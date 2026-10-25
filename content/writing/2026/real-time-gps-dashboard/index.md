---
title: "Membangun Real-Time GPS Dashboard"
description: "Episode terakhir seri GPS Backend: mengirim posisi armada ke peta lewat WebSocket, Redis pub/sub, dan Leaflet.js. Saya uji alurnya dari Go dan Redis sampai browser."
author: "Faiq Najib Al-Aziz"
date: 2026-11-25
lastmod: 2026-11-25
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - gps
  - dashboard
  - websocket
  - realtime
pillar: "gps-iot"
series: "gps-backend-series"
series_part: 6
---

Di lima artikel sebelumnya, saya merakit backend GPS ini pelan-pelan: [protokol](/writing/2026/memahami-gps-protocol/), [TCP listener](/writing/2026/tcp-listener-gps-go/), [decoder](/writing/2026/decode-packet-gt06-teltonika/), [TimescaleDB](/writing/2026/gps-data-postgresql-timescaledb/), dan [geofencing](/writing/2026/geofencing-postgis/). Data sudah masuk, tersimpan, dan bisa memicu event wilayah.

Pelanggan tentu tidak melihat tabel database. Yang mereka lihat **peta yang bergerak**. Di artikel penutup ini saya sambungkan bagian-bagian tadi: WebSocket untuk mengirim posisi, Redis pub/sub sebagai jembatan dari ingest worker, lalu Leaflet.js di browser. Kodenya saya uji di laptop dengan server Go dan Redis lokal. Dashboard saya buka di browser, lalu posisi saya kirim lewat `PUBLISH`. Lumayan juga rasanya lihat titiknya pindah sendiri hehe.

## Dari Polling ke WebSocket

Cara paling sederhana membuat dashboard terasa "real-time" adalah _polling_: JavaScript meminta `GET /api/positions` setiap 2 detik. Tapi hitungannya cepat menumpuk. Satu klien membuat 30 _request_ per menit; 20 tab dashboard operator jadi 600 _request_ per menit, meski 90% datanya sama saja. Rata-rata _latency_ setengah interval polling, jadi posisi yang disebut "sekarang" bisa telat 1 detik.

Pilihan lain ada **SSE** (Server-Sent Events, satu arah lewat HTTP) dan **WebSocket** (dua arah, lewat _upgrade_ dari HTTP). Kalau cuma mengirim posisi ke browser, SSE sebenarnya cukup dan lebih sederhana. Tapi seperti yang saya singgung di Part 1, server GPS mungkin perlu mengirim perintah balik juga, misalnya minta posisi sekarang, mengubah interval, atau _engine cut_. Jadi untuk seri ini saya memilih WebSocket dari awal.

Kurang lebih alurnya begini:

```text
[Tracker] → [Listener] → [Queue] → [Ingest Worker] ──┬──▶ [PostgreSQL]
                                                     ├──▶ [Redis: cache posisi terakhir]
                                                     └──▶ [Redis PUBLISH positions:live]
                                                                │
                                              [Bridge (subscribe)] → [Hub] ──▶ N × browser WebSocket
```

Ingest worker tidak perlu tahu soal browser, tugasnya hanya `PUBLISH`. Hub juga tidak perlu tahu detail device, ia cukup melakukan broadcast. Redis jadi perantara. Kalau suatu saat trafik naik, dua bagian ini bisa diatur kapasitasnya sendiri.

## Hub untuk Mengatur Klien

Hub punya daftar klien, channel broadcast, dan aturan untuk klien yang lambat. Ini potongan kodenya:

```go
type client struct {
    send chan []byte // buffer 64 pesan per klien
}

type Hub struct {
    mu         sync.RWMutex
    clients    map[*client]struct{}
    register   chan *client
    unregister chan *client
}

func (h *Hub) run() {
    for {
        select {
        case c := <-h.register:
            h.mu.Lock()
            h.clients[c] = struct{}{}
            h.mu.Unlock()
        case c := <-h.unregister:
            h.mu.Lock()
            if _, ok := h.clients[c]; ok {
                delete(h.clients, c)
                close(c.send)
            }
            h.mu.Unlock()
        }
    }
}

// Broadcast ke semua klien. Klien lambat (buffer penuh) didrop,
// bukan menghambat yang lain.
func (h *Hub) Broadcast(msg []byte) {
    h.mu.RLock()
    var victims []*client
    for c := range h.clients {
        select {
        case c.send <- msg:
        default: // buffer penuh: kandidat drop
            victims = append(victims, c)
        }
    }
    h.mu.RUnlock()

    for _, c := range victims {
        h.mu.Lock()
        if _, ok := h.clients[c]; ok {
            delete(h.clients, c)
            close(c.send)
        }
        h.mu.Unlock()
        log.Printf("klien lambat didrop")
    }
}
```

Ada dua pilihan di kode ini yang mungkin tidak langsung kelihatan:

1. **Setiap klien punya channel `send` ber-buffer.** `Broadcast` tidak pernah menyentuh _network_, ia hanya memasukkan pesan ke antrean tiap klien. Satu goroutine _writer_ per koneksi yang mengosongkannya. Tanpa ini, satu browser dengan jaringan buruk membekukan broadcast untuk semua orang.
2. **Klien yang antreannya penuh diputus.** Dashboard real-time ini cocok dengan pola _stateless-friendly_: klien yang didrop cukup _reconnect_ dan menyegarkan posisi dari cache. Mengakhiri koneksi yang lambat lebih murah daripada mengorbankan klien sehat.

(Di versi pertama, saya menjalankan `delete` map di dalam `RLock`. Baru saat diteliti ulang saya sadar ini _data race_: map ditulis di bawah _read lock_. Kode di atas mengumpulkan kandidat di `RLock`, lalu menghapusnya di `Lock`. Jalankan dengan mode `-race`, nanti ketahuan.)

## Endpoint WebSocket: Writer-nya Satu Saja

```go
var upgrader = websocket.Upgrader{CheckOrigin: func(r *http.Request) bool { return true }}

func (h *Hub) wsHandler(w http.ResponseWriter, r *http.Request) {
    conn, err := upgrader.Upgrade(w, r, nil)
    if err != nil {
        return
    }
    c := &client{send: make(chan []byte, 64)}

    h.register <- c
    defer func() { h.unregister <- c }()

    // satu-satunya goroutine yang MENULIS ke koneksi ini
    go func() {
        for msg := range c.send {
            conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
            if err := conn.WriteMessage(websocket.TextMessage, msg); err != nil {
                return
            }
        }
        conn.Close()
    }()

    // kita tidak menunggu pesan dari dashboard, cukup deteksi close
    for {
        if _, _, err := conn.ReadMessage(); err != nil {
            return
        }
    }
}
```

Aturan gorilla/websocket (dan WebSocket pada umumnya): **jangan menulis ke koneksi yang sama dari dua goroutine sekaligus**. Satu _writer_ per koneksi menghindari masalah itu, sementara reader hanya menunggu sampai koneksi ditutup. `SetWriteDeadline` juga mencegah writer menunggu selamanya kalau browsernya sudah tidak merespons.

## Bridge: Dari Redis ke Hub

```go
func bridge(ctx context.Context, hub *Hub, rdb *redis.Client) {
    sub := rdb.Subscribe(ctx, "positions:live")
    for msg := range sub.Channel() {
        hub.Broadcast([]byte(msg.Payload))
    }
}
```

Ingest worker yang menyimpan data ke TimescaleDB dan mengecek geofence di Part 5 menerbitkan posisi dengan `rdb.Publish(ctx, "positions:live", jsonPosition)`. Worker juga dapat menjalankan `SET device:last:<id>` untuk menyimpan posisi terakhir. Klien yang baru tersambung bisa mengambilnya dari cache agar petanya tidak kosong sambil menunggu titik berikutnya.

## Browser: Leaflet + Reconnect

Di browser, Leaflet menampilkan peta dan marker per device. Koneksi WebSocket akan tersambung ulang jika terputus:

```html
<div id="map"></div>
<div id="status">menghubungkan…</div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  const map = L.map("map").setView([-7.2575, 112.7521], 12); // Surabaya
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(map);

  const markers = {}; // device_id -> L.Marker
  const statusEl = document.getElementById("status");

  function connect() {
    const ws = new WebSocket(`ws://${location.hostname}:8081/ws`);
    ws.onopen = () => (statusEl.textContent = "terhubung");
    ws.onclose = () => {
      statusEl.textContent = "terputus, sambung ulang 3 dtk…";
      setTimeout(connect, 3000); // reconnect otomatis
    };
    ws.onmessage = (ev) => {
      const p = JSON.parse(ev.data);
      if (!markers[p.device_id]) {
        markers[p.device_id] = L.marker([p.lat, p.lon]).addTo(map);
      } else {
        markers[p.device_id].setLatLng([p.lat, p.lon]); // pindah, bukan duplikat
      }
    };
  }
  connect();
</script>
```

## Waktu Saya Coba di Lokal

Saya coba tiga skenario di laptop sendiri, memakai loopback, Redis lokal, dan browser Chromium:

| Skenario                                                                                | Hasil                                                                                                                   |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1 `PUBLISH` → 50 klien WebSocket tersambung                                             | 50/50 menerima, dalam **2,5-3,4 ms**                                                                                    |
| Klien lambat (buffer 4 KB, tidak pernah membaca) + klien sehat, 300 pesan 64 KB dikirim | Klien sehat menerima **300/300**; klien lambat **didrop** oleh hub (`klien lambat didrop` di log server)                |
| Browser sungguhan: 3 posisi (2 device) di-`PUBLISH`                                     | Status `terhubung · 3 posisi`; **2 marker** di peta, marker device yang sama berpindah via `setLatLng`, bukan duplikat |

Di tes browser, satu device punya satu marker, lalu koordinatnya diperbarui setiap ada pesan baru. Kalau marker baru dibuat untuk setiap pesan, 500 device yang mengirim tiap 10 detik akan membuat peta berantakan dalam semenit. Karena itu `markers` memakai `device_id` sebagai kunci.

## Hal yang Belum Beres untuk Production

- **Ping/pong.** Proxy dan load balancer suka memutus koneksi "diam". Kirim ping periodik dari server (gorilla: `SetReadDeadline` + pong handler) dan balas dari klien atau set `TCP keepalive`.
- **Autentikasi koneksi.** Di production, `CheckOrigin` jangan `return true` untuk semua, dan token/tenant diverifikasi saat upgrade (cookie/header), koneksi WS tidak bisa divalidasi sesering HTTP biasa.
- **Backpressure adalah fitur.** Buffer 64 × drop itu kebijakan sadar: pesan dashboard bersifat _latest-wins_ (yang penting posisi terakhir), bukan semua-posisi-harus-sampai. Data yang harus lengkap tetap lewat jalur database.

## Beberapa Hal yang Perlu Diingat

- **Pisahkan dunia**: ingest hanya `PUBLISH`, hub hanya broadcast, dan Redis menghubungkan keduanya. Setiap bagian bisa diskalakan sendiri.
- **Satu writer goroutine per koneksi** + buffer per klien + drop kebijakan untuk yang lambat.
- **Latest-wins**: marker per `device_id` di-update, bukan dibuat ulang; klien baru dihidrasi dari cache posisi terakhir.
- **Reconnect itu bagian dari protokol**, klien yang didrop harus bisa kembali dan menyegarkan diri tanpa intervensi.

## Seri Ini Selesai, Terus Apa?

Nah, enam artikel ini sekarang membentuk satu alur backend GPS, dari byte mentah di socket sampai titik yang bergerak di peta. Saya berencana menyatukan seri ini jadi **ebook gratis "Membangun GPS Backend dengan Go"**. Info rilisnya nanti saya bagikan lewat [RSS](/writing/index.xml) atau [Contact](/contact/).

Untuk seri berikutnya, saya sedang mempertimbangkan antrean pesan (RabbitMQ/Kafka), API dengan Fiber + pgx, atau deployment Coolify. Kalau ada yang lebih ingin kamu baca, [bilang saja](/contact/).

Kalau ingin membahas WebSocket, Redis, atau cara marker diperbarui, [hubungi saya](/contact/). Tulisan berikutnya bisa diikuti lewat [RSS](/writing/index.xml).
