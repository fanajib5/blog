---
title: "Menyimpan Data GPS dengan PostgreSQL + TimescaleDB"
description: "Menyimpan jutaan titik GPS tanpa membuat PostgreSQL tumbang: setup hypertable, continuous aggregate untuk reporting, compression policy untuk data lama: semua diuji dengan 155 ribu baris data."
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

Satu kendaraan mengirim posisi tiap 10 detik. Kalau ada seribu kendaraan, berarti 8,6 juta baris per hari, 260 juta per bulan, atau sekitar 3 miliar setahun. Dashboard pelanggan juga ingin dua hal: data baru cepat masuk, lalu laporan beberapa minggu bisa dibuka tanpa menunggu lama. PostgreSQL harus kerja dua arah di sini.

Tabel PostgreSQL biasa bisa menerima data sebanyak itu kalau index-nya pas. Masalahnya, query seperti "kecepatan maksimum per jam selama 30 hari" perlu merangkum ratusan juta baris setiap kali dijalankan. Index B-tree memang berguna, tapi tidak banyak menolong untuk agregat rentang waktu. Yang dicari bukan satu baris, melainkan ringkasan dari banyak baris.

Di [Part 3](/writing/2026/decode-packet-gt06-teltonika/), koordinat keluar dari decoder. Sekarang saya masukkan ke PostgreSQL + [TimescaleDB](https://www.timescale.com/)[^ts]. Contoh di artikel ini saya jalankan di container `timescale/timescaledb:latest-pg16` (TimescaleDB 2.30) dengan 155 ribu baris data sintetis. Bukan jutaan dulu, biar laptop saya tidak protes.

## Kenapa TimescaleDB, Bukan Tabel Biasa?

TimescaleDB itu ekstensi PostgreSQL, bukan database lain yang harus dipelihara terpisah. Jadi pgx, DBeaver, backup `pg_dump`, dan user permission yang sudah biasa dipakai tetap bisa digunakan. Untuk data time-series, ada beberapa fitur tambahan:

1. **Hypertable**: tabel yang otomatis dipecah jadi _chunk_ per rentang waktu (partisi otomatis, transparan). Query tetap ditulis seperti biasa; TimescaleDB yang memilih chunk mana yang perlu disentuh.
2. **Continuous aggregates**: ringkasan yang dihitung di belakang layar secara bertahap, bukan dihitung ulang tiap query.
3. **Compression policy**: data lama dikompresi otomatis jadi format kolom, jauh lebih kecil, dan tetap bisa di-query.

Alternatif yang sering dibandingkan adalah Cassandra (operasional berat, tidak ada SQL penuh), InfluxDB (bahasa query sendiri, relasi lemah), dan ClickHouse (kencang untuk analitik, tapi bukan PostgreSQL sehingga perlu dua sistem). Untuk GPS tracking yang membutuhkan _operational query_ (posisi terbaru, history rute) **dan** analitik ringan dalam satu sistem, TimescaleDB cocok. Di production, hypertable ini menampung jutaan titik per hari dan membuat reporting yang sebelumnya memakan menit selesai dalam hitungan detik.

## Setup: Tabel Device dan Hypertable Positions

Data GPS terbagi menjadi dua jenis: _registry_ yang jarang berubah (device, kendaraan, tenant) dan _time-series_ yang terus bertambah (posisi). Simpan keduanya di tabel terpisah.

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

Lalu ubah tabel `positions` menjadi hypertable dengan satu perintah:

```sql
SELECT create_hypertable('positions', 'time',
    chunk_time_interval => INTERVAL '1 day');
```

Setelah itu, `positions` menjadi hypertable dan data setiap hari masuk ke _chunk_ terpisah. Index dibuat dengan sintaks yang sama seperti di PostgreSQL biasa. Karena pola akses GPS yang umum adalah "device X, periode Y", gunakan:

```sql
CREATE INDEX idx_positions_device_time ON positions (device_id, time DESC);
```

> Catatan dari production: jangan asal menjalankan `SELECT *` ke tabel ini. Batasi rentang waktunya. Index `(device_id, time DESC)` membuat query "posisi device 1 hari ini" murah, tapi tanpa batas waktu kamu tetap menyapu seluruh riwayat device. Nanti yang mahal bukan index-nya, tapi kebiasaan kita sendiri.

## Insert dari Go dengan pgx

Di aplikasi production, listener (Part 2) tidak menyentuh database. Dia meneruskan posisi ke antrean, lalu worker yang memasukkannya. Untuk insert, `pgx` dengan _batch_ sudah lebih dari cukup:

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

Kamu tidak perlu menulis `UPDATE` atau `DELETE` massal untuk "menggulung" data lama. Retensi data ditangani oleh policy, bukan aplikasi.

## Query Harian: Posisi Terakhir Tiap Device

Dashboard paling sering meminta posisi terbaru tiap kendaraan. Di PostgreSQL, `DISTINCT ON` adalah cara ringkas untuk mengambilnya:

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

Dengan index `(device_id, time DESC)`, query ini tetap cepat meski tabel terus bertambah karena hanya baris terbaru tiap device yang diperlukan.

## Continuous Aggregates: Reporting yang Sudah Dihitung

Lalu ada permintaan seperti "kecepatan maksimum dan rata-rata per jam, per kendaraan, selama 7 hari terakhir". Tanpa continuous aggregate, database harus membaca semua baris mentah lagi setiap kali dashboard dibuka. Continuous aggregate menyimpan ringkasan yang dihitung bertahap di belakang layar:

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

Berbeda dari materialized view PostgreSQL biasa yang perlu di-refresh penuh, continuous aggregate bersifat _incremental_. Hanya data baru dan data yang berubah yang diproses. Query ke aggregate ini tetap seperti query ke tabel biasa.

Angka nyata dari dataset uji saya (155 ribu baris, 3 device, 7 hari, container lokal):

| Query ringkasan 7 hari                         | Waktu eksekusi |
| ---------------------------------------------- | -------------- |
| `GROUP BY time_bucket` langsung ke `positions` | **158 ms**     |
| Query ke `positions_hourly`                    | **0,5 ms**     |

Pada dataset kecil ini, query ke aggregate sekitar 300 kali lebih cepat. Jangan langsung menyimpulkan laptop saya baru saja memecahkan masalah semua orang, ya. Keuntungan utamanya, dashboard tidak perlu mengulang hitungan dari data mentah setiap kali dibuka.

## Compression: Data Lama Mengecil Sendiri

Dalam contoh ini, data yang lebih tua dari 3 hari tidak lagi diakses per-baris oleh dashboard. Karena itu, data lama bisa disimpan dalam format terkompresi.

```sql
-- definisikan cara mengompresi: kelompokkan per device, urut waktu
ALTER TABLE positions SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id',
    timescaledb.compress_orderby   = 'time'
);

SELECT add_compression_policy('positions', INTERVAL '3 days');
```

Policy ini menjadwalkan kompresi otomatis untuk chunk yang berumur lebih dari 3 hari, tanpa downtime. Saya juga mengompresi satu chunk secara manual agar bisa melihat hasilnya tanpa menunggu job terjadwal:

```sql
SELECT compress_chunk(c)
FROM show_chunks('positions', older_than => INTERVAL '3 days') c
LIMIT 1;
```

Di pengujian ini, ukuran chunk sehari turun dari 2856 kB menjadi **24 kB**. Data sintetisnya memang gampang dikompresi. Untuk GPS sungguhan, perkiraan yang lebih masuk akal sekitar 10-20 kali karena data sensornya lebih berisik. Dengan 260 juta baris per bulan, penghematan 90% lebih tetap berarti ruang disk yang lumayan besar.

**Chunk terkompresi tetap bisa di-query** dengan SQL biasa. TimescaleDB melakukan dekompresi secara transparan saat data dibutuhkan.

> Compression biasanya ditemani **retention policy** (`add_retention_policy`) untuk menghapus otomatis data yang lebih tua dari N bulan. Berapa N-nya tergantung aturan legal dan kebutuhan bisnis. Saya tidak memasangnya di contoh ini, tapi di production sebaiknya diputuskan sejak awal, bukan saat storage mulai menjerit.

## Catatan Sebelum Lanjut

- **Pisahkan registry dan time-series.** `devices` adalah tabel biasa; `positions` hypertable. Jangan campur.
- **Selalu batasi rentang waktu di query.** Index `(device_id, time DESC)` hanya menolong query yang tahu mau periode apa.
- **Continuous aggregate untuk reporting agregat.** Ringkas data di belakang layar agar dashboard tidak menghitung semuanya dari awal. Di sistem production yang saya tangani, pola ini membantu memangkas waktu reporting dari menit menjadi detik.
- **Pikirkan compression dan retention sejak awal.** Memutuskan berapa lama data disimpan adalah urusan bisnis juga. Jangan tunggu sampai storage penuh baru bertanya, "ini data tahun lalu masih perlu?"

Nah, koordinatnya sudah tersimpan dan bisa di-query. Tapi GPS tracking juga perlu menjawab pertanyaan seperti "kendaraan saya sudah keluar area kirim belum?" Di [Part 5](/writing/2026/geofencing-postgis/), saya lanjut ke geofencing dengan PostGIS, polygon, `ST_Contains`, dan deteksi kendaraan masuk atau keluar area.

## What's Next

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

- Sebelumnya: [Part 3: Decode Packet: GT06 & Teltonika Protocol](/writing/2026/decode-packet-gt06-teltonika/)
- Selanjutnya: [Part 5: Geofencing dengan PostGIS](/writing/2026/geofencing-postgis/)

## CTA

Kalau ingin membahas penyimpanan data GPS dengan PostgreSQL atau TimescaleDB, [hubungi saya](/contact/). Kamu juga bisa mengikuti tulisan berikutnya lewat [RSS](/writing/index.xml).

[^ts]: Semua SQL di artikel ini diuji di TimescaleDB 2.30.0 (PostgreSQL 16, container Docker `timescale/timescaledb:latest-pg16`) dengan 155.523 baris data sintetis. Skrip lengkapnya bisa direplikasi dengan `docker run` + SQL di atas.
