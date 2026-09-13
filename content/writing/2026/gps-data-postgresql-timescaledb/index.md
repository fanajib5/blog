---
title: "Menyimpan Data GPS dengan PostgreSQL + TimescaleDB"
description: "Menyimpan jutaan titik GPS tanpa membuat PostgreSQL tumbang: setup hypertable, continuous aggregate untuk reporting, compression policy untuk data lama — semua diuji dengan 155 ribu baris data."
author: "Faiq Najib Al-Aziz"
date: 2026-10-28
lastmod: 2026-10-28
draft: true
toc: true
comments: true
images:
  - og.png
tags:
  - postgresql
  - timescaledb
  - gps
  - database
pillar: "postgresql"
series: "gps-backend-series"
series_part: 4
---

Hitung singkat dulu. Satu kendaraan mengirim posisi tiap 10 detik. Seribu kendaraan berarti 8,6 juta baris per hari, 260 juta per bulan, 3 miliar setahun — dan dashboard pelanggan minta dua hal yang bertolak belakang: _insert_ super cepat untuk data yang mengalir terus, dan _query_ reporting yang menyapu data berminggu-minggu dalam sekejap.

Tabel PostgreSQL biasa bisa memasukkan data itu (dengan index yang tepat, insert masih kencang), tapi query agregat seperti "kecepatan maksimum per jam selama 30 hari" akan menyapu ratusan juta baris setiap kali diminta. Indeks B-tree tidak menolong untuk agregat rentang waktu — yang dibutuhkan bukan mencari satu baris, melainkan merangkum jutaan baris.

Di [Part 3](/writing/2026/decode-packet-gt06-teltonika/) koordinat sudah mengalir keluar dari decoder. Artikel ini tentang rumahnya: PostgreSQL + [TimescaleDB](https://www.timescale.com/)[^ts], dan semua contoh di bawah saya jalankan di container `timescale/timescaledb:latest-pg16` (TimescaleDB 2.30) dengan 155 ribu baris data sintetis.

## Kenapa TimescaleDB, Bukan Tabel Biasa?

TimescaleDB adalah ekstensi PostgreSQL — bukan database terpisah. Artinya semua yang sudah kamu punya (pgx, DBeaver, backup `pg_dump`, user permission) tetap jalan. Yang ditambahkan tiga hal yang persis dibutuhkan data time-series:

1. **Hypertable** — tabel yang otomatis dipecah jadi _chunk_ per rentang waktu (partisi otomatis, transparan). Query tetap ditulis seperti biasa; TimescaleDB yang memilih chunk mana yang perlu disentuh.
2. **Continuous aggregates** — ringkasan yang dihitung di belakang layar secara bertahap, bukan dihitung ulang tiap query.
3. **Compression policy** — data lama dikompresi otomatis jadi format kolom, jauh lebih kecil, dan tetap bisa di-query.

Alternatif yang sering dibanding-bandingkan: Cassandra (operasional berat, tidak ada SQL penuh), InfluxDB (bahasa query sendiri, relasi lemah), atau ClickHouse (kencang untuk analitik, tapi bukan PostgreSQL — perlu dua sistem). Untuk GPS tracking yang butuh _operational query_ (posisi terbaru, history rute) **dan** analitik ringan dalam satu sistem, TimescaleDB posisinya pas — dan di production, hypertable inilah yang menampung jutaan titik per hari dengan reporting dari menit jadi detik.

## Setup: Tabel Device dan Hypertable Positions

Data GPS itu dua jenis: _registry_ yang jarang berubah (device, kendaraan, tenant) dan _time-series_ yang tumbuh terus (posisi). Pisahkan — jangan satukan di satu tabel.

```sql
CREATE TABLE devices (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    imei      TEXT UNIQUE NOT NULL,
    name      TEXT NOT NULL,
    tenant_id BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE positions (
    time      TIMESTAMPTZ  NOT NULL,
    device_id BIGINT       NOT NULL REFERENCES devices(id),
    lat       DOUBLE PRECISION NOT NULL,
    lon       DOUBLE PRECISION NOT NULL,
    speed_kmh SMALLINT     NOT NULL DEFAULT 0,
    course    SMALLINT     NOT NULL DEFAULT 0,
    attrs     JSONB
);
```

Lalu satu baris yang mengubah semuanya:

```sql
SELECT create_hypertable('positions', 'time',
    chunk_time_interval => INTERVAL '1 day');
```

Dari sini `positions` adalah hypertable: data tiap hari masuk ke _chunk_ terpisah. Menambah index setelahnya pun sama seperti biasa — perhatikan bahwa pola akses GPS paling umum adalah "device X, periode Y", jadi:

```sql
CREATE INDEX idx_positions_device_time ON positions (device_id, time DESC);
```

> Catatan dari pengalaman production: jangan asal `SELECT *` ke tabel ini di aplikasi. Batasi selalu rentang waktu — index `(device_id, time DESC)` membuat query "posisi device 1 hari ini" jadi murah, tapi tanpa batas waktu kamu menyapu seluruh sejarah device.

## Insert dari Go dengan pgx

Di sisi aplikasi, pola yang saya pakai di production: listener (Part 2) tidak pernah menyentuh database — dia meneruskan posisi ke antrean, dan worker yang memasukkan. Untuk insert, `pgx` dengan _batch_ lebih dari cukup:

```go
func insertPositions(ctx context.Context, pool *pgxpool.Pool, pts []Position) error {
    b := &pgx.Batch{}
    for _, p := range pts {
        b.Queue(`INSERT INTO positions (time, device_id, lat, lon, speed_kmh, course)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
            p.Time, p.DeviceID, p.Lat, p.Lon, p.SpeedKmh, p.Course)
    }
    return pool.SendBatch(ctx, b).Close()
}
```

Satu hal yang tidak perlu kamu pikirkan lagi: `UPDATE`/`DELETE` massal untuk "menggulung" data lama. Itu urusan policy, bukan aplikasi.

## Query Harian: Posisi Terakhir Tiap Device

Query yang paling sering dipanggil dashboard — posisi terbaru tiap kendaraan. Idiomatik di PostgreSQL dengan `DISTINCT ON`:

```sql
SELECT DISTINCT ON (device_id) device_id, d.name, time, lat, lon, speed_kmh
FROM positions p
JOIN devices d ON d.id = p.device_id
ORDER BY device_id, time DESC;
```

```text
 device_id |    name    |             time              |  lat  |  lon  | speed_kmh
-----------+------------+-------------------------------+-------+-------+-----------
         1 | B 1234 XYZ | 2026-09-12 14:33:09+00        | -7.25 | 112.76|        68
         2 | B 5678 ABC | 2026-09-12 14:33:19+00        | -7.25 | 112.74|        55
         3 | L 9012 KLW | 2026-09-12 14:33:19+00        | -7.25 | 112.74|        32
(3 rows)
```

Dengan index `(device_id, time DESC)`, query ini tetap cepat berapa pun umur tabel — setiap device hanya menyentuh baris terbarunya.

## Continuous Aggregates: Reporting yang Sudah Dihitung

Sekarang masalah kedua: "kecepatan maksimum dan rata-rata per jam, per kendaraan, 7 hari terakhir". Tanpa bantuan, database menyapu semua baris mentah setiap kali dashboard dimuat. Continuous aggregate menghitungnya di belakang layar:

```sql
CREATE MATERIALIZED VIEW positions_hourly
WITH (timescaledb.continuous) AS
SELECT device_id,
       time_bucket('1 hour', time) AS bucket,
       count(*)                AS points,
       max(speed_kmh)          AS max_speed,
       avg(speed_kmh)::smallint AS avg_speed
FROM positions
GROUP BY device_id, bucket
WITH NO DATA;

SELECT add_continuous_aggregate_policy('positions_hourly',
    start_offset      => INTERVAL '3 days',
    end_offset        => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

-- data historis di luar jendela policy: refresh manual sekali
CALL refresh_continuous_aggregate('positions_hourly',
    now() - INTERVAL '7 days', now());
```

Ini bukan materialized view PostgreSQL biasa yang harus di-refresh penuh — continuous aggregate bersifat _incremental_: hanya data baru dan data yang berubah yang diproses. Query-nya pun transparan, sama seperti tabel biasa.

Angka nyata dari dataset uji saya (155 ribu baris, 3 device, 7 hari, container lokal):

| Query ringkasan 7 hari                         | Waktu eksekusi |
| ---------------------------------------------- | -------------- |
| `GROUP BY time_bucket` langsung ke `positions` | **158 ms**     |
| Query ke `positions_hourly`                    | **0,5 ms**     |

300× lebih cepat — dan selisihnya melebar seiring data bertambah, karena sisi cagg tidak pernah tumbuh secepat data mentah.

## Compression: Data Lama Mengecil Sendiri

Aturan mainnya satu kalimat: data lebih tua dari 3 hari tidak lagi diakses per-baris oleh dashboard, jadi tidak ada alasan menyimpannya boros.

```sql
-- definisikan cara mengompresi: kelompokkan per device, urut waktu
ALTER TABLE positions SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id',
    timescaledb.compress_orderby   = 'time'
);

SELECT add_compression_policy('positions', INTERVAL '3 days');
```

Mulai detik itu, pekerjaan terjadwal akan mengompresi chunk yang berumur lebih dari 3 hari — otomatis, tanpa downtime. Untuk membuktikan efeknya tanpa menunggu job terjadwal, saya kompresi satu chunk manual:

```sql
SELECT compress_chunk(c)
FROM show_chunks('positions', older_than => INTERVAL '3 days') c
LIMIT 1;
```

Hasilnya di chunk berisi satu hari data (2856 kB sebelum kompresi): **mengecil jadi 24 kB**. Angka itu memang milik data sintetis yang sangat mudah dikompresi — di data GPS nyata, rasio yang realistis ada di kisaran 10–20× (data sensor asli lebih berisik). Tetap saja: pada 260 juta baris per bulan, hemat 90%+ berarti selisih ratusan gigabyte.

Dan bagian terbaiknya: **chunk terkompresi tetap bisa di-query** dengan SQL biasa. TimescaleDB yang men-decompress transparan saat dibutuhkan.

> Pasangan natural compression adalah **retention policy** (`add_retention_policy`) untuk menghapus otomatis data yang lebih tua dari N bulan — legal atau kebutuhan bisnis yang menentukan N-nya. Di artikel ini saya tidak memasangnya, tapi di production, tentukan sejak hari pertama.

## Yang Harus Kamu Pahami Sebelum Lanjut

- **Pisahkan registry dan time-series.** `devices` adalah tabel biasa; `positions` hypertable. Jangan campur.
- **Selalu batasi rentang waktu di query.** Index `(device_id, time DESC)` hanya menolong query yang tahu mau periode apa.
- **Continuous aggregate untuk semua reporting agregat.** Hitung sekali di belakang layar, bukan setiap kali dashboard dibuka — di production, pola ini yang mengubah reporting menit jadi detik.
- **Compression + retention sejak hari pertama.** Keduanya tidak bisa dipasang mundur ke masa lalu dengan gratis — keputusan "berapa lama data hidup" itu keputusan bisnis, jangan jadi kejutan operasional.

Koordinat tersimpan rapi dan cepat di-query. Tapi GPS tracking bukan cuma menyimpan titik — pelanggan bertanya "kendaraan saya sudah keluar area kirim belum?" Di [Part 5](/writing/2026/geofencing-postgis/), kita bahas geofencing dengan PostGIS: polygon, `ST_Contains`, dan deteksi masuk-keluar area real-time.

## What's Next

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

- Sebelumnya: [Part 3 — Decode Packet: GT06 & Teltonika Protocol](/writing/2026/decode-packet-gt06-teltonika/)
- Selanjutnya: [Part 5 — Geofencing dengan PostGIS](/writing/2026/geofencing-postgis/)

## CTA

Bagikan artikel ini jika bermanfaat. Untuk diskusi lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).

[^ts]: Semua SQL di artikel ini diuji di TimescaleDB 2.30.0 (PostgreSQL 16, container Docker `timescale/timescaledb:latest-pg16`) dengan 155.523 baris data sintetis — skrip lengkapnya bisa direplikasi dengan `docker run` + SQL di atas.
