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

Salah satu fitur yang sering ditawarkan layanan GPS tracking adalah mencatat kendaraan masuk dan keluar area. Meski terdengar sederhana, geofencing juga sering keliru diimplementasikan. Kita tidak hanya menggambar _polygon_ di peta, tetapi juga mendeteksi _event_ masuk dan keluar dari _stream_ data yang datang tiap 10–30 detik.

Di [Part 4](/writing/2026/gps-data-postgresql-timescaledb/), posisi sudah tersimpan di TimescaleDB. Artikel ini menambahkan satu dimensi: **wilayah**. Semua contoh diuji di PostGIS 3.5 (PostgreSQL 16, container `postgis/postgis:16-3.5`).

## Geofence Itu Pertanyaan Dalam atau Luar

Inti geofencing adalah menjawab satu pertanyaan untuk setiap titik: _apakah titik ini di dalam polygon itu?_ PostGIS menjawabnya dengan `ST_Within(titik, polygon)`. Kita mulai dengan menguji fondasinya.

Buat tabel geofence dengan polygon ber-SRID 4326 (koordinat lintang/bujur standar GPS) dan index GiST:

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

Berikutnya, buat geometri titik posisi. Jika tabel `positions` masih memakai kolom `lat`/`lon` (seperti skema Part 4), kita bisa menambahkan kolom geometry **tercipta otomatis** lewat _generated column_ tanpa mengubah cara insert:

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

Fondasi sudah berjalan. Namun, pelanggan tidak membeli daftar `true`/`false`, melainkan **event**.

## Dalam/Luar Menjadi Event: Masuk dan Keluar

Keanggotaan saja belum cukup. Truk yang berdiri diam di dalam pelabuhan selama 4 jam akan mengirim ratusan titik `inside`. Dashboard yang menampilkan "masuk" 400 kali tentu keliru. Yang dibutuhkan adalah satu event `ENTER` saat status berubah dari luar ke dalam dan satu `EXIT` saat sebaliknya.

Untuk mengenali perubahan, bandingkan status titik saat ini dengan status sebelumnya. _Window function_ `LAG` cocok untuk itu:

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

(Di production, `PARTITION BY device_id, g.id ORDER BY time`, tiap device punya urutan statusnya sendiri per fence.)

## Real-Time: Pengecekan di Ingest Worker

Query di atas berguna untuk analisis historis. Alert real-time perlu diperiksa **saat data masuk**. Sesuai arsitektur di Part 2, listener tidak menyentuh database; ingest worker yang memeriksa posisi:

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

1. **Pre-filter `ST_DWithin` geography 5 km** memakai index GiST untuk memangkas fence yang jauh, lalu `_Within` yang eksak hanya dijalankan untuk kandidat dekat.
2. **Status sebelumnya tidak di-query dari `positions`**. Worker cukup membaca cache (`device_id:fence_id → inside`), informasi satu bit yang hanya berubah saat event.

Kenapa bukan _trigger_ PostgreSQL? Trigger bisa dipakai, tetapi mengikat logika bisnis ke schema, sulit dites terpisah, dan menyembunyikan pekerjaan dari pengamat aplikasi. Dengan pola worker, notifikasi alert (push/WhatsApp/email) cukup dikirim lewat fungsi Go biasa.

## POI Radius: geography Bukan geometry

Geofence polygon cocok untuk area berbatas tegas (pelabuhan, gudang, kawasan). Untuk kebutuhan "alert kalau kendaraan mendekati SPBU dalam radius 500 meter", lingkaran lebih alami. Namun, ada jebakan PostGIS: **satuan**.

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

Jaraknya 199 meter, masih dalam radius 500 meter. `geography` memperhitungkan kelengkungan bumi.

## Jebakan yang Sering Menggigit

- **GPS drift di tepi polygon.** Titik GPS yang berubah-ubah di sekitar batas bisa menghasilkan event ENTER/EXIT palsu beruntun, misalnya saat truk parkir persis di pagar. Salah satu solusi umum adalah _buffer_: masukkan hanya jika titik berada 50 m ke dalam polygon (`ST_DWithin(geom, geom, -50)` tidak valid; pakai `ST_Contains(ST_Buffer(geom, -0.0005), point)`), atau minta dua titik berurutan yang konsisten sebelum emit event.
- **Interval sampling vs kecepatan.** Kendaraan 60 km/jam dengan interval 60 detik berpindah 1 km antara titik. Rute yang "melewati" fence kecil bisa terlewat di antara dua titik tanpa pernah berada _di dalam_. Untuk fence kritis, evaluasi pergeseran dengan memeriksa apakah segmen dua titik memotong batas polygon memakai `ST_Intersects` pada `ST_MakeLine`.
- **Satuan derajat vs meter.** `geometry` memakai derajat, sedangkan `geography` memakai meter. Pastikan tipe yang digunakan.
- **SRID campur aduk.** `ST_SetSRID(ST_MakePoint(lon, lat), 4326)`: jika lupa SetSRID, PostGIS menolak membandingkan geometri (atau lebih buruk, diam-diam cocok karena keduanya 0). Urutannya juga penting: **lon dulu, lat kemudian**, kebalikan dari kebiasaan menyebut "lat-lon".

## Yang Harus Kamu Pahami Sebelum Lanjut

- Geofence = pertanyaan dalam/luar (`ST_Within`) yang diubah menjadi **event transisi** (`LAG` membandingkan status), bukan daftar keanggotaan.
- Cek real-time di **ingest worker** dengan pre-filter `ST_DWithin` + cache status satu bit; query massal window function untuk analisis historis.
- `geometry` vs `geography`: derajat vs meter. Radius POI = `geography`.
- GPS tidak presisi: desain untuk _drift_ (buffer) dan sampling jarang (segmen vs titik).

Data posisi sudah tersimpan dan event geofence sudah terdeteksi. Di [Part 6](/writing/2026/real-time-gps-dashboard/), kita lanjutkan dengan dashboard GPS real-time yang menampilkan peta tanpa refresh, memakai WebSocket, fan-out, dan pola broadcast.

## What's Next

Artikel ini bagian dari seri **Membangun GPS Backend dari Nol**.

- Sebelumnya: [Part 4 — Menyimpan Data GPS dengan PostgreSQL + TimescaleDB](/writing/2026/gps-data-postgresql-timescaledb/)
- Selanjutnya: [Part 6 — Membangun Real-Time GPS Dashboard](/writing/2026/real-time-gps-dashboard/)

## CTA

Untuk membahas geofencing dengan PostGIS lebih lanjut, kunjungi [Contact](/contact/) atau subscribe [RSS](/writing/index.xml).
