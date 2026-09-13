---
title: "Geofencing dengan PostGIS: Deteksi Masuk-Keluar Real-Time"
description: "Mendeteksi kapan kendaraan masuk dan keluar area dengan PostGIS: polygon geofence, ST_Within, event entry/exit dengan window function, sampai POI radius dengan geography — diuji dengan rute nyata."
author: "Faiq Najib Al-Aziz"
date: 2026-11-11
lastmod: 2026-11-11
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - postgresql
  - postgis
  - gps
  - gis
pillar: "postgresql"
series: "gps-backend-series"
series_part: 5
---

"Kendaraan A masuk area pelabuhan jam 03:00, keluar jam 05:30."

Kalimat sesederhana itu adalah salah satu fitur paling laku dijual di dunia GPS tracking — dan salah satu yang paling sering diimplementasikan dengan salah. Geofencing bukan sekadar menggambar _polygon_ di peta; itu soal mendeteksi _event_ masuk/keluar secara benar dari _stream_ data yang datang tiap 10–30 detik.

Di [Part 4](/writing/2026/gps-data-postgresql-timescaledb/) posisi tersimpan rapi di TimescaleDB. Artikel ini menambahkan satu dimensi: **wilayah**. Semua contoh diuji di PostGIS 3.5 (PostgreSQL 16, container `postgis/postgis:16-3.5`).

## Geofence Itu Pertanyaan Dalam atau Luar

Masalah inti geofencing sebenarnya satu pertanyaan yang dijawab berulang-ulang: _apakah titik ini di dalam polygon itu?_ PostGIS menjawabnya dengan `ST_Within(titik, polygon)`. Sebelum bicara real-time, mari buktikan dulu fondasinya.

Pertama, tabel geofence — polygon dengan SRID 4326 (koordinat lintang/bujur standar GPS) dan index GiST:

```sql
CREATE TABLE geofences (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL DEFAULT 1,
    name      TEXT NOT NULL,
    geom      GEOMETRY(Polygon, 4326) NOT NULL
);

CREATE INDEX idx_geofences_geom ON geofences USING GIST (geom);
```

Untuk demo, saya pakai persegi panjang yang kira-kira membungkus area pelabuhan Tanjung Perak Surabaya (di production, polygon digambar pelanggan di peta dan bisa berbentuk apa pun):

```sql
INSERT INTO geofences (name, geom) VALUES (
    'Area Pelabuhan Tanjung Perak',
    ST_GeomFromText(
        'POLYGON((112.72 -7.20, 112.78 -7.20, 112.78 -7.23,
                  112.72 -7.23, 112.72 -7.20))', 4326)
);
```

Lalu titik posisi. Trik kecil yang menyenangkan: kalau tabel `positions` masih memakai kolom `lat`/`lon` (seperti skema Part 4), kita bisa menambahkan kolom geometry yang **tercipta otomatis** lewat _generated column_ — tanpa mengubah cara insert sama sekali:

```sql
ALTER TABLE positions ADD COLUMN geom GEOMETRY(Point, 4326)
    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED;
```

Sekarang uji keanggotaan dengan rute truk yang saya tanam: dua titik di luar area, dua titik di dalam:

```sql
SELECT time, lat, lon,
       ST_Within(geom, (SELECT geom FROM geofences WHERE id = 1)) AS inside
FROM positions ORDER BY time;
```

```text
          time          |  lat  |  lon   | inside
------------------------+-------+--------+--------
 2026-11-11 02:58:00+07 | -7.19 | 112.73 | f
 2026-11-11 03:00:00+07 | -7.21 | 112.74 | t
 2026-11-11 03:30:00+07 | -7.22 | 112.75 | t
 2026-11-11 05:30:00+07 | -7.25 | 112.76 | f
(4 rows)
```

Fondasi bekerja. Tapi pelanggan tidak membeli daftar `true`/`false` — mereka membeli **event**.

## Dalam/Luar Menjadi Event: Masuk dan Keluar

Keanggotaan saja belum cukup. Truk yang berdiri diam di dalam pelabuhan selama 4 jam akan mengirim ratusan titik `inside` — dan dashboard yang menampilkan "masuk" 400 kali itu dashboard yang salah. Yang benar: satu event `ENTER` saat status berubah dari luar ke dalam, satu `EXIT` saat sebaliknya.

Ini murni masalah membandingkan status titik sekarang dengan titik sebelumnya — pekerjaan sempurna untuk _window function_ `LAG`:

```sql
WITH membership AS (
    SELECT p.device_id, p.time,
           ST_Within(p.geom, g.geom) AS inside
    FROM positions p
    CROSS JOIN geofences g
),
changes AS (
    SELECT *,
           LAG(inside) OVER (ORDER BY time) AS prev_inside
    FROM membership
)
SELECT device_id, time,
       CASE WHEN NOT prev_inside AND inside THEN 'ENTER'
            WHEN prev_inside AND NOT inside THEN 'EXIT' END AS event
FROM changes
WHERE prev_inside IS NOT NULL          -- titik pertama: belum ada pembanding
  AND prev_inside IS DISTINCT FROM inside;
```

Hasilnya di rute tadi — persis dua baris, persis yang diinginkan pelanggan:

```text
 device_id |          time          | event
-----------+------------------------+-------
         1 | 2026-11-11 03:00:00+07 | ENTER
         1 | 2026-11-11 05:30:00+07 | EXIT
```

(Di production, `PARTITION BY device_id, g.id ORDER BY time` — tiap device punya urutan statusnya sendiri per fence.)

## Real-Time: Pengecekan di Ingest Worker

Query di atas bagus untuk analisis historis. Untuk alert real-time, tempat pengecekannya bukan query massal, melainkan **di titik data masuk** — dan mengikuti arsitektur kita sejak Part 2: listener tidak menyentuh database, ingest worker yang bekerja:

```go
func checkGeofences(ctx context.Context, pool *pgxpool.Pool, p Position) {
    rows, err := pool.Query(ctx, `
        SELECT g.id, g.name,
               ST_Within(ST_SetSRID(ST_MakePoint($1, $2), 4326), g.geom) AS inside
        FROM geofences g
        WHERE g.tenant_id = $3
          AND ST_DWithin(ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
                         g.geom::geography, 5000)`, -- pre-filter bbox 5 km
        p.Lon, p.Lat, p.TenantID)
    if err != nil {
        log.Printf("geofence query: %v", err)
        return
    }
    defer rows.Close()

    for rows.Next() {
        var id int64
        var name string
        var inside bool
        _ = rows.Scan(&id, &name, &inside)
        // bandingkan dengan status sebelumnya (cache/Redis per device+fence),
        // beda → emit event ENTER/EXIT
    }
}
```

Dua detail yang membuat ini efisien untuk ribuan fence:

1. **Pre-filter `ST_DWithin` geography 5 km** memakai index GiST untuk memangkas fence yang jauh — `_Within` yang eksak hanya dijalankan untuk kandidat dekat.
2. **Status sebelumnya tidak di-query dari `positions`** — cukup dari cache (`device_id:fence_id → inside`). Ini informasi sekecil satu bit yang hanya berubah saat event.

Kenapa bukan _trigger_ PostgreSQL? Bisa juga — tapi trigger mengikat logika bisnis ke schema, sulit dites terpisah, dan menyembunyikan pekerjaan dari pengamat aplikasi. Dengan pola worker, alert notification (push/WhatsApp/email) tinggal fungsi Go biasa.

## POI Radius: geography Bukan geometry

Geofence polygon cocok untuk area berbatas tegas (pelabuhan, gudang, kawasan). Tapi kebutuhan "alert kalau kendaraan mendekati SPBU dalam radius 500 meter" lebih alami dinyatakan sebagai lingkaran — dan di sini ada jebakan klasik PostGIS: **satuan**.

`geometry` menghitung dalam derajat; `geography` menghitung di permukaan bumi dalam **meter**. Radius 500 meter yang ditulis sebagai `ST_DWithin(geom, geom, 500)` pada tipe geometry itu 500 _derajat_ — melingkari Indonesia lima kali. Pakai `geography`:

```sql
CREATE TABLE pois (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL,
    geog GEOGRAPHY(Point, 4326) NOT NULL
);

INSERT INTO pois (name, geog) VALUES
    ('SPBU Kalimas', ST_SetSRID(ST_MakePoint(112.7521, -7.2575), 4326)::geography);

SELECT name,
       ST_DWithin(geog,
           ST_SetSRID(ST_MakePoint(112.7521, -7.2593), 4326)::geography,
           500) AS dalam_500m,
       ST_Distance(geog,
           ST_SetSRID(ST_MakePoint(112.7521, -7.2593), 4326)::geography) AS jarak_m
FROM pois;
```

```text
    name     | dalam_500m |   jarak_m
--------------+------------+--------------
 SPBU Kalimas | t          | 199.0656
(1 row)
```

199 meter — masuk radius, dan angkanya masuk akal karena `geography` memperhitungkan kelengkungan bumi.

## Jebakan yang Sering Menggigit

- **GPS drift di tepi polygon.** Titik GPS menyala-matian di sekitar batas akan menghasilkan event ENTER/EXIT palsu beruntun (truk parkir persis di pagar). Solusi umum: _buffer_ — masukkan hanya jika titik berada 50 m ke dalam polygon (`ST_DWithin(geom, geom, -50)` tidak valid; pakai `ST_Contains(ST_Buffer(geom, -0.0005), point)`), atau minta dua titik berurutan yang konsisten sebelum emit event.
- **Interval sampling vs kecepatan.** Kendaraan 60 km/jam dengan interval 60 detik berpindah 1 km per titik — rute "melewati" fence kecil bisa terlewat antara dua titik tanpa pernah berada _di dalam_. Untuk fence kritis, evaluasi pergeseran (apakah segmen dua titik memotong batas polygon dengan `ST_Intersects` pada `ST_MakeLine`).
- **Satuan derajat vs meter** — seperti di atas: `geometry` derajat, `geography` meter. Selalu sadar sedang pakai yang mana.
- **SRID campur aduk** — `ST_SetSRID(ST_MakePoint(lon, lat), 4326)`: kalau lupa SetSRID, PostGIS menolak membandingkan (atau lebih buruk: diam-diam cocok karena keduanya 0). Perhatikan juga urutannya **lon dulu, lat kemudian** — kebalikan dari kebiasaan manusia bicara "lat-lon".

## Yang Harus Kamu Pahami Sebelum Lanjut

- Geofence = pertanyaan dalam/luar (`ST_Within`) yang diubah menjadi **event transisi** (`LAG` bandingkan status) — bukan daftar keanggotaan.
- Cek real-time di **ingest worker** dengan pre-filter `ST_DWithin` + cache status satu bit; query massal window function untuk analisis historis.
- `geometry` vs `geography`: derajat vs meter. Radius POI = `geography`.
- GPS tidak presisi: desain untuk _drift_ (buffer) dan sampling jarang (segmen vs titik).

Data posisi tersimpan dan event wilayah terdeteksi. Yang tersisa dari backend ini: menghidupkan semuanya di layar pelanggan — peta yang bergerak sendiri tanpa di-refresh. Di [Part 6](/writing/2026/real-time-gps-dashboard/) kita bahas real-time dashboard: WebSocket, fan-out, dan pola broadcast.

## What's Next

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

- Sebelumnya: [Part 4 — Menyimpan Data GPS dengan PostgreSQL + TimescaleDB](/writing/2026/gps-data-postgresql-timescaledb/)
- Selanjutnya: [Part 6 — Membangun Real-Time GPS Dashboard](/writing/2026/real-time-gps-dashboard/)

## CTA

Bagikan artikel ini jika bermanfaat. Untuk diskusi lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
