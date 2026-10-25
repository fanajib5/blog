---
title: "Membangun Real-Time GPS Dashboard"
description: "Finale seri GPS Backend: menghidupkan posisi armada di peta tanpa refresh — WebSocket hub dengan slow-client protection, Redis pub/sub fan-out, dan Leaflet.js. Semua diuji end-to-end di browser sungguhan."
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

Lima artikel sebelumnya membangun backend GPS ini tahap demi tahap: [protokol](/writing/2026/memahami-gps-protocol/), [TCP listener](/writing/2026/tcp-listener-gps-go/), [decoder](/writing/2026/decode-packet-gt06-teltonika/), [TimescaleDB](/writing/2026/gps-data-postgresql-timescaledb/), dan [geofencing](/writing/2026/geofencing-postgis/). Data masuk, tersimpan, dan event wilayah terdeteksi.

Pelanggan tidak melihat tabel. Mereka melihat **peta yang bergerak sendiri**. Artikel penutup seri ini menyatukan semuanya: WebSocket untuk push real-time, Redis pub/sub sebagai jembatan dari ingest worker, dan Leaflet.js di browser. Semua kode di bawah saya uji end-to-end: server Go + Redis di lokal, lalu halaman dashboard dibuka di browser sungguhan dan posisi dikirim lewat `PUBLISH`.

## Polling Dulu, Baru Bicara WebSocket

Cara paling naif membuat dashboard "real-time" adalah _polling_: JavaScript menanya `GET /api/positions` setiap 2 detik. Aritmetikanya cepat memburuk: 30 _request_/menit per klien. Dashboard operator dengan 20 tab terbuka menghasilkan 600 _request_/menit, padahal 90% isinya tidak berubah. _Latency_ rata-rata juga setengah interval polling, jadi posisi "sekarang" selalu telat 1 detik.

Ada dua pilihan berikutnya: **SSE** (Server-Sent Events, satu arah via HTTP) atau **WebSocket** (dua arah, _upgrade_ dari HTTP). Kalau kebutuhannya hanya mengirim posisi ke browser, SSE sudah cukup dan lebih sederhana. Namun, seperti dibahas di Part 1, server GPS juga perlu _mengirim perintah ke arah sebaliknya_ suatu hari nanti (request posisi sekarang, ubah interval, sampai engine-cut). Untuk seri ini kita pasang WebSocket sejak awal.

Arsitektur akhirnya seperti ini:

```text
[Tracker] → [Listener] → [Queue] → [Ingest Worker] ──┬──▶ [PostgreSQL]
                                                     ├──▶ [Redis: cache posisi terakhir]
                                                     └──▶ [Redis PUBLISH positions:live]
                                                                │
                                              [Bridge (subscribe)] → [Hub] ──▶ N × browser WebSocket
```

Ingest worker tidak tahu ada browser; ia hanya `PUBLISH`. Hub tidak tahu ada device; ia hanya broadcast. Dua dunia dipisahkan Redis — dan bisa diproses berbeda saat skala menuntut.

## Hub: Registry Klien dan Broadcast

Hub ini terdiri dari registry klien, satu channel broadcast, dan kebijakan untuk menangani klien lambat:

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

Dua keputusan desain yang tersembunyi di sini:

1. **`send` per klien dengan buffer, bukan tulis langsung ke koneksi.** `Broadcast` tidak pernah menyentuh _network_ — ia hanya memasukkan pesan ke antrean tiap klien. Satu goroutine _writer_ per koneksi yang mengosongkannya. Tanpa ini, satu browser dengan jaringan buruk membekukan broadcast untuk semua orang.
2. **Klien yang antreuannya meluap didrop.** Dashboard real-time ini cocok dengan pola _stateless-friendly_: klien yang didrop cukup _reconnect_ dan menyegarkan posisi dari cache. Mengakhiri koneksi yang lambat lebih murah daripada mengorbankan klien sehat.

(Di versi pertama kode ini, saya menulis `delete` map di dalam `RLock` — data race yang tidak kelihatan sampai diteliti ulang: menulis map di bawah _read lock_. Versi di atas sudah memisahkan: kumpulkan kandidat drop di `RLock`, eksekusi drop di `Lock`. `-race` mode akan menangkap ini — jalankan selalu.)

## Endpoint WebSocket: Satu Writer per Koneksi

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

    // kita tidak menunggu pesan dari dashboard — cukup deteksi close
    for {
        if _, _, err := conn.ReadMessage(); err != nil {
            return
        }
    }
}
```

Aturan gorilla/websocket (dan WebSocket umumnya): **tidak boleh ada dua goroutine menulis koneksi yang sama bersamaan**. Pola satu _writer_ per koneksi menyelesaikannya — reader hanya mendeteksi koneksi tertutup. `SetWriteDeadline` memastikan writer yang menulis ke browser mati tidak menunggu selamanya.

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

## Hasil Uji End-to-End

Tiga lapis pengujian, semua di laptop saya (loopback, Redis lokal, browser Chromium):

| Skenario                                                                                | Hasil                                                                                                                   |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1 `PUBLISH` → 50 klien WebSocket tersambung                                             | 50/50 menerima, dalam **2,5–3,4 ms**                                                                                    |
| Klien lambat (buffer 4 KB, tidak pernah membaca) + klien sehat, 300 pesan 64 KB dikirim | Klien sehat menerima **300/300**; klien lambat **didrop** oleh hub (`klien lambat didrop` di log server)                |
| Browser sungguhan: 3 posisi (2 device) di-`PUBLISH`                                     | Status `terhubung · 3 posisi`; **2 marker** di peta — marker device yang sama berpindah via `setLatLng`, bukan duplikat |

Pada skenario browser, setiap device memiliki satu marker yang posisinya diperbarui saat pesan baru datang. Jika dashboard membuat marker baru untuk setiap pesan, 500 device yang mengirim posisi setiap 10 detik akan membuat peta tak terbaca dalam satu menit. Dictionary `markers` memakai `device_id` sebagai kunci agar marker yang sama bisa diperbarui.

## Jebakan yang Tersisa di Production

- **Ping/pong.** Proxy dan load balancer suka memutus koneksi "diam". Kirim ping periodik dari server (gorilla: `SetReadDeadline` + pong handler) dan balas dari klien — atau set `TCP keepalive`.
- **Autentikasi koneksi.** Di production, `CheckOrigin` jangan `return true` untuk semua, dan token/tenant diverifikasi saat upgrade (cookie/header) — koneksi WS tidak bisa divalidasi sesering HTTP biasa.
- **Backpressure adalah fitur.** Buffer 64 × drop itu kebijakan sadar: pesan dashboard bersifat _latest-wins_ (yang penting posisi terakhir), bukan semua-posisi-harus-sampai. Data yang harus lengkap tetap lewat jalur database.

## Yang Harus Kamu Pahami

- **Pisahkan dunia**: ingest hanya `PUBLISH`, hub hanya broadcast, dan Redis menghubungkan keduanya. Setiap bagian bisa diskalakan sendiri.
- **Satu writer goroutine per koneksi** + buffer per klien + drop kebijakan untuk yang lambat.
- **Latest-wins**: marker per `device_id` di-update, bukan dibuat ulang; klien baru dihidrasi dari cache posisi terakhir.
- **Reconnect itu bagian dari protokol** — klien yang didrop harus bisa kembali dan menyegarkan diri tanpa intervensi.

## Seri Selesai — Lalu ke Mana?

Dengan dashboard ini, keenam artikel menyusun satu backend GPS utuh: dari byte mentah di socket sampai titik bergerak di peta pelanggan. Seluruh seri akan dikompilasi menjadi **ebook gratis "Membangun GPS Backend dengan Go"** — pantau [RSS](/writing/index.xml) atau [hubungi saya](/contact/) untuk info rilisnya.

Seri lanjutan yang sudah masuk kandidat: antrean pesan (RabbitMQ/Kafka), API layer dengan Fiber + pgx, dan deployment Coolify. Kalau salah satu topik itu yang kamu tunggu, [bilang saja](/contact/).

## CTA

Kalau ingin membahas pilihan WebSocket, Redis, atau cara marker diperbarui di dashboard ini, kunjungi [Contact](/contact/) atau ikuti tulisan berikutnya lewat [RSS](/writing/index.xml).
