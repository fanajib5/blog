---
title: "Geofencing dengan PostGIS: Deteksi Masuk-Keluar Real-Time"
description: "Mendeteksi kendaraan masuk dan keluar area dengan PostGIS, dari polygon geofence dan ST_Within sampai event entry/exit dan POI radius geography. Saya coba dengan rute nyata."
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

Catatan seperti itu sering jadi fitur layanan GPS tracking. Kedengarannya sederhana, tapi implementasinya bisa bikin salah paham. Kita perlu menggambar _polygon_ sekaligus membaca _event_ masuk dan keluar dari _stream_ posisi yang datang tiap 10-30 detik.

Di [Part 4](/writing/2026/gps-data-postgresql-timescaledb/), posisi sudah masuk TimescaleDB. Kali ini saya tambahkan satu hal: **wilayah**. Contoh-contohnya saya uji dengan PostGIS 3.5 (PostgreSQL 16, container `postgis/postgis:16-3.5`).

## Pertama, Titik Ini di Dalam atau di Luar?

Dasarnya sederhana: untuk setiap titik, kita tanya _"ini ada di dalam polygon atau di luar?"_ PostGIS punya `ST_Within(titik, polygon)` untuk menjawabnya. Saya mulai dari pertanyaan dasar ini dulu.

Saya buat tabel geofence dengan polygon SRID 4326 (koordinat lintang/bujur standar GPS) dan index GiST:

```sql
CREATE TABLE geofences (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tenant_id BIGINT NOT NULL DEFAULT 1,
    name      TEXT NOT NULL,
    geom      GEOMETRY(Polygon, 4326) NOT NULL
);

CREATE INDEX idx_geofences_geom ON geofences USING GIST (geom);
CREATE INDEX idx_geofences_geog ON geofences USING GIST ((geom::geography));
```

Untuk demo ini saya pakai persegi panjang yang kira-kira mencakup area Pelabuhan Tanjung Perak Surabaya. Di production, pelanggan bisa menggambar polygon dengan bentuk apa saja di peta.

```sql
INSERT INTO geofences (name, geom) VALUES (
    'Area Pelabuhan Tanjung Perak',
    ST_GeomFromText(
        'POLYGON((112.72 -7.20, 112.78 -7.20, 112.78 -7.23,
                  112.72 -7.23, 112.72 -7.20))', 4326)
);
```

Berikutnya saya siapkan geometri titik posisi. Kalau tabel `positions` masih memakai kolom `lat`/`lon` seperti skema Part 4, kolom geometry bisa dibuat otomatis lewat _generated column_. Cara insert-nya tidak perlu diubah:

```sql
ALTER TABLE positions ADD COLUMN geom GEOMETRY(Point, 4326)
    GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lon, lat), 4326)) STORED;
```

Saya uji dengan rute truk contoh yang saya siapkan. Ada dua titik di luar area dan dua di dalam:

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

Nah, hasilnya sudah benar. Tapi yang dibutuhkan pengguna bukan daftar `true` dan `false`; yang dicari adalah **event**.

## Dari Status ke Event Masuk dan Keluar

Status dalam/luar saja belum cukup. Truk yang diam di pelabuhan selama 4 jam bisa mengirim ratusan titik `inside`. Kalau dashboard menulis "masuk" 400 kali, ada yang salah. Kita hanya perlu `ENTER` saat status berubah dari luar ke dalam, lalu `EXIT` saat berubah lagi.

Untuk melihat perubahan status, saya bandingkan titik sekarang dengan titik sebelumnya. _Window function_ `LAG` pas untuk pekerjaan ini:

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

Rute tadi menghasilkan dua baris:

```text
 device_id |          time          | event
-----------+------------------------+-------
         1 | 2026-11-11 03:00:00+07 | ENTER
         1 | 2026-11-11 05:30:00+07 | EXIT
```

(Di production, tambahkan `PARTITION BY device_id, g.id ORDER BY time` supaya tiap device punya urutan status sendiri untuk tiap fence.)

## Cek Posisi Saat Data Masuk

Query tadi cocok untuk melihat data historis. Untuk alert real-time, posisi perlu dicek **saat data masuk**. Di arsitektur Part 2, listener tidak menyentuh database. Bagian ini ditangani ingest worker:

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

Ada dua hal yang perlu diingat saat jumlah fence bertambah:

1. **Pre-filter `ST_DWithin` geography 5 km** dapat memakai index ekspresi `idx_geofences_geog` pada `geom::geography` untuk memangkas fence yang jauh. Index `idx_geofences_geom` tetap digunakan untuk operasi geometry seperti `ST_Within`. Planner bisa memilih scan lain bergantung ukuran dan statistik tabel, jadi cek rencana query dengan `EXPLAIN (ANALYZE, BUFFERS)`.
2. **Status sebelumnya tidak di-query dari `positions`**. Worker cukup membaca cache (`device_id:fence_id → inside`), informasi satu bit yang hanya berubah saat event.

Kenapa tidak pakai _trigger_ PostgreSQL saja? Bisa, tapi logika bisnis jadi menempel ke schema, lebih sulit dites terpisah, dan pekerjaannya tidak kelihatan dari metrik aplikasi. Dengan pola worker, notifikasi (push/WhatsApp/email) bisa dikirim lewat fungsi Go biasa. Buat saya, batas tanggung jawabnya jadi lebih mudah dibaca.

## POI Beradius: Pakai geography, Bukan geometry

Polygon geofence cocok untuk area yang batasnya jelas, seperti pelabuhan atau gudang. Kalau kebutuhannya "beri alert saat kendaraan mendekati SPBU dalam radius 500 meter", radius lebih masuk akal. Tapi PostGIS punya satu jebakan kecil: **satuan**.

`geometry` menghitung dalam derajat; `geography` menghitung di permukaan bumi dalam **meter**. Radius 500 meter yang ditulis sebagai `ST_DWithin(geom, geom, 500)` pada tipe geometry berarti 500 _derajat_, cukup untuk melingkari Indonesia lima kali. Untuk radius, pakai `geography`:

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

Hasilnya 199 meter, masih di dalam radius 500 meter. `geography` juga memperhitungkan lengkung bumi.

## Beberapa Hal yang Bisa Bikin Kaget

- **GPS drift di tepi polygon.** Titik GPS yang berubah-ubah di sekitar batas bisa menghasilkan event ENTER/EXIT palsu beruntun, misalnya saat truk parkir persis di pagar. Salah satu solusi umum adalah _buffer_: masukkan hanya jika titik berada 50 m ke dalam polygon (`ST_DWithin(geom, geom, -50)` tidak valid; pakai `ST_Contains(ST_Buffer(geom, -0.0005), point)`), atau minta dua titik berurutan yang konsisten sebelum emit event.
- **Interval sampling vs kecepatan.** Kendaraan 60 km/jam dengan interval 60 detik berpindah 1 km antara titik. Rute yang "melewati" fence kecil bisa terlewat di antara dua titik tanpa pernah berada _di dalam_. Untuk fence kritis, evaluasi pergeseran dengan memeriksa apakah segmen dua titik memotong batas polygon memakai `ST_Intersects` pada `ST_MakeLine`.
- **Satuan derajat vs meter.** `geometry` memakai derajat, sedangkan `geography` memakai meter. Pastikan tipe yang digunakan.
- **SRID campur aduk.** `ST_SetSRID(ST_MakePoint(lon, lat), 4326)`: jika lupa SetSRID, PostGIS menolak membandingkan geometri (atau lebih buruk, diam-diam cocok karena keduanya 0). Urutannya juga penting: **lon dulu, lat kemudian**, kebalikan dari kebiasaan menyebut "lat-lon".

## Sebelum Pindah ke Part Berikutnya

Intinya, `ST_Within` memberi status dalam/luar, lalu `LAG` membantu membaca perubahan status sebagai event. Untuk pengecekan real-time, worker bisa memakai pre-filter `ST_DWithin` dan menyimpan status terakhir di cache. Soal radius, `geography` memakai meter, sedangkan `geometry` memakai derajat. Dan karena GPS bisa meleset atau jarang mengirim titik, kita perlu mempertimbangkan _drift_ dan lintasan antar titik juga.

Posisi sudah tersimpan dan event geofence sudah terdeteksi. Di [Part 6](/writing/2026/real-time-gps-dashboard/), saya lanjut ke dashboard GPS real-time yang menampilkan peta tanpa refresh, dengan WebSocket, fan-out, dan pola broadcast.

## What's Next

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

- Sebelumnya: [Part 4: Menyimpan Data GPS dengan PostgreSQL + TimescaleDB](/writing/2026/gps-data-postgresql-timescaledb/)
- Selanjutnya: [Part 6: Membangun Real-Time GPS Dashboard](/writing/2026/real-time-gps-dashboard/)

## CTA

Untuk membahas geofencing dengan PostGIS lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
