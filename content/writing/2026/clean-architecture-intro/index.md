---
title: "Clean Architecture: Dari Spaghetti Code ke Kode yang Bisa Dibaca Ulang"
description: "Pengantar Clean Architecture untuk mahasiswa, dari spaghetti code ke kode yang terstruktur, dengan contoh nyata dari proyek GPS tracker."
author: "Faiq Najib Al-Aziz"
date: 2026-04-15
lastmod: 2026-09-11T09:28:00+07:00
draft: false
toc: true
comments: false
tags:
  - catatan
  - arsitektur
---

Saya pernah menulis kode yang terasa masuk akal saat dibuat. Logikanya jelas, alurnya rapi, nama variabelnya deskriptif. Tiga bulan kemudian, saya membuka file yang sama dan bertanya, _"ini tadi mau ngapain sih?"_

Di sini saya mengenalkan **Clean Architecture** lewat contoh dari proyek GPS _tracker_ yang pernah saya tangani. Saya fokus pada idenya, bukan istilah-istilah yang bikin pusing.

## Mengenali "_Spaghetti Code_"

_Spaghetti code_ bukan istilah teknis formal. Istilah ini menggambarkan **kode yang saling terikat dan sulit dipisahkan**, seperti mie spaghetti yang sulit diambil sehelai tanpa menarik yang lain.

Di proyek GPS _tracker_ yang pernah saya tangani, ada satu _function_ yang kurang lebih seperti ini:

```
function handleUpdatePosition(request):
    // Langsung query ke database
    vehicle = db.query("SELECT * FROM vehicles WHERE id = ?", request.vehicleId)

    if not vehicle:
        return error("Vehicle not found")

    // Business logic campur di sini
    if vehicle.status == "inactive":
        vehicle.status = "active"
        vehicle.lastActivation = now()

    // Update posisi
    db.query("UPDATE positions SET lat = ?, lng = ?, time = ? WHERE vehicleId = ?",
             request.lat, request.lng, now(), request.vehicleId)

    // Kirim notifikasi langsung dari sini
    if vehicle.hasAlert:
        email.send(vehicle.ownerEmail, "Alert: " + vehicle.name)
        sms.send(vehicle.ownerPhone, "Alert from " + vehicle.name)

    // Generate laporan langsung
    report = generateDailyReport(vehicle)
    db.query("INSERT INTO reports ...", report)

    return success(vehicle)
```

Bisa dilihat? Satu _function_ nangkap **semua**, baca database, olah logika bisnis, kirim email, kirim SMS, _generate_ laporan. Saat itu kelihatannya praktis. Tapi coba bayangkan:

- **Kalau mau ganti cara kirim notifikasi**: harus edit _function_ ini
- **Kalau mau _test_ logika bisnis**: harus _setup_ database dan _email server_
- **Kalau mau ganti database**: harus ubah semua _query_ yang tersebar di mana-mana
- **Kalau ada bug di laporan**: harus _trace_ lewat _function_ yang sudah panjang ini

```
┌─────────────────────────────────────────────────┐
│              Spaghetti Flow                      │
│                                                  │
│  Request ──► [Database + Logic + Email + Report] │
│                         │                        │
│                         ▼                        │
│              Semua menyatu.                      │
│              Ubah satu, risiko semua goyah.      │
└─────────────────────────────────────────────────┘
```

## Clean Architecture: Intinya Sederhana Kok

Robert C. Martin (_Uncle Bob_) memopulerkan istilah "Clean Architecture". Gagasan utamanya sederhana: **kode yang penting (logika bisnis) tidak boleh bergantung pada detail teknis (database, _framework_, API).**

Logika bisnis biasanya lebih stabil daripada detail teknis. Contohnya aturan menghitung jarak, menentukan kendaraan aktif, dan menetapkan batas kecepatan. Database, _framework_, dan cara mengirim email adalah **detail** yang bisa berubah.

### Aturan Ketergantungan (_Dependency Rule_)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ┌─────────────────────────────────────────────┐   │
│   │              Entity                          │   │
│   │   Aturan bisnis inti. Paling dalam.          │   │
│   │   Tidak tergantung apapun.                   │   │
│   │                                              │   │
│   │   ┌──────────────────────────────────────┐  │   │
│   │   │          Use Case                     │  │   │
│   │   │   Apa yang sistem lakukan.            │  │   │
│   │   │   Tergantung ke Entity, bukan ke DB.  │  │   │
│   │   │                                       │  │   │
│   │   │   ┌───────────────────────────────┐  │  │   │
│   │   │   │     Infrastructure             │  │  │   │
│   │   │   │   Database, API, Email, SMS.   │  │  │   │
│   │   │   │   Detail teknis. Paling luar.  │  │  │   │
│   │   │   └───────────────────────────────┘  │  │   │
│   │   └──────────────────────────────────────┘  │   │
│   └─────────────────────────────────────────────┘   │
│                                                      │
│   Arah panah: luar ──► dalam                       │
│   Luar tergantung pada dalam. Dalam TIDAK tergantung │
│   pada luar.                                        │
└──────────────────────────────────────────────────────┘
```

**Panah hanya boleh mengarah ke dalam.** _Entity_ tidak tahu tentang database, dan _Use Case_ tidak tahu cara mengirim email. _Infrastructure_ menangani detail teknis.

Kalau kontrak _repository_ tetap sama, mengganti MySQL dengan PostgreSQL tidak mengharuskan perubahan pada _Entity_ atau _Use Case_. Implementasi di _Infrastructure_ yang berubah.

### Tiga Layer yang Penting

Tiga _layer_ ini membantu menjelaskan pembagian tanggung jawabnya:

**1. Entity, Aturan Bisnis Inti**

Ini berisi aturan bisnis inti yang tidak bergantung pada teknologi tertentu. Di proyek GPS _tracker_, contohnya:

```
class Vehicle:
    id, name, status, currentSpeed, speedLimit

    function isSpeeding():
        return currentSpeed > speedLimit

    function activate():
        if status == "inactive":
            status = "active"
            lastActivation = now()
```

Di sini tidak ada _database query_, _HTTP request_, atau _framework_. Isinya aturan bisnis: apakah kendaraan _speeding_ dan bagaimana mengaktifkannya.

**2. Use Case, Apa yang Sistem Lakukan**

_Use case_ mendefinisikan **apa** yang dilakukan sistem, tanpa peduli **bagaimana** detailnya.

```
class UpdatePositionUseCase:
    function execute(vehicleId, lat, lng):
        // 1. Cari kendaraan
        vehicle = vehicleRepository.findById(vehicleId)
        if not vehicle:
            return error("Vehicle not found")

        // 2. Update posisi
        vehicle.updatePosition(lat, lng)

        // 3. Simpan
        vehicleRepository.save(vehicle)

        // 4. Kalau speeding, trigger alert
        if vehicle.isSpeeding():
            alertService.sendSpeedAlert(vehicle)
```

_Use case_ memanggil `vehicleRepository` dan `alertService`, tetapi **tidak tahu** apakah implementasinya memakai MySQL atau PostgreSQL, atau mengirim alert lewat email atau SMS. Yang diketahuinya hanya _"cari kendaraan"_, _"simpan"_, dan _"kirim alert"_.

Selama kontrak _repository_ tidak berubah, database dapat diganti tanpa mengubah _use case_.

**3. Infrastructure, Detail Teknis**

Di sinilah detail implementasi berada: database, API, _framework_, dan _email service_.

```
class MySQLVehicleRepository:
    function findById(id):
        row = db.query("SELECT * FROM vehicles WHERE id = ?", id)
        return Vehicle(id: row.id, name: row.name, ...)

    function save(vehicle):
        db.query("UPDATE vehicles SET lat = ?, lng = ? WHERE id = ?",
                 vehicle.lat, vehicle.lng, vehicle.id)
```

```
class EmailAlertService:
    function sendSpeedAlert(vehicle):
        email.send(
            to: vehicle.ownerEmail,
            subject: "Speed Alert: " + vehicle.name,
            body: vehicle.name + " is going " + vehicle.currentSpeed
        )
```

Ini bagian yang **boleh berubah**. Kalau mau ganti MySQL ke PostgreSQL, ubah di sini. Kalau mau ganti email ke WhatsApp, ubah di sini. _Entity_ dan _Use Case_ tidak tersentuh.

## Langkah demi Langkah: Terapkan di GPS Tracker

Berikut versi "clean" dari kode _spaghetti_ di awal:

### Before: Spaghetti

Satu _function_ menangani semuanya: membaca database, menjalankan logika, mengirim notifikasi, dan membuat laporan.

### After: Clean

```
// === Entity: Vehicle ===
// (aturan bisnis murni, tidak tergantung apapun)

class Vehicle:
    function updatePosition(lat, lng):
        this.lat = lat
        this.lng = lng
        this.lastUpdate = now()

    function isSpeeding():
        return this.currentSpeed > this.speedLimit

// === Use Case: UpdatePosition ===
// (apa yang dilakukan, tanpa peduli bagaimana)

class UpdatePositionUseCase:
    function execute(vehicleId, lat, lng):
        vehicle = repository.findById(vehicleId)
        if not vehicle:
            return error("Not found")

        vehicle.updatePosition(lat, lng)
        repository.save(vehicle)

        if vehicle.isSpeeding():
            alertService.sendSpeedAlert(vehicle)

        return success(vehicle)

// === Infrastructure ===
// (detail teknis, boleh berubah kapanpun)

class MySQLVehicleRepository:
    function findById(id):
        return db.query("SELECT ...")

    function save(vehicle):
        db.query("UPDATE ...")

class EmailAlertService:
    function sendSpeedAlert(vehicle):
        email.send(...)
```

### Apa yang Berubah?

| Aspek | Spaghetti | Clean |
|-------|-----------|-------|
| _Test_ logika bisnis | Perlu _setup_ DB + _email_ | Cuma _test_ `Vehicle` class |
| Ganti database | Ubah semua _query_ di mana-mana | Ubah cuma _repository_ |
| Ganti cara _alert_ | Cari di seluruh _codebase_ | Ubah cuma `AlertService` |
| _Onboarding_ _developer_ baru | Baca satu _function_ panjang | Baca per _layer_, mulai dari _Entity_ |
| Efek samping perubahan | _Domino effect_ | Terisolasi per _layer_ |

Setiap _layer_ bisa diuji sendiri: `Vehicle` tanpa database, `UpdatePositionUseCase` dengan _mock repository_, dan `MySQLVehicleRepository` secara terpisah.

## Clean Architecture untuk Proyek Kecil

Mungkin kamu berpikir, _"Ini kan buat proyek gede. Skripsi saya cuma aplikasi kecil."_ Untuk aplikasi kecil, Clean Architecture memang bisa _overkill_. Namun, memisahkan logika bisnis dari detail teknis tetap berguna, terutama saat kode perlu diuji atau detail implementasinya berubah.

Saat menjelaskan rancangan skripsi, dosen mungkin bertanya _"kenapa kamu _design_ sistem seperti ini?"_ Jawaban _"karena logika bisnis saya tidak tergantung pada database"_ lebih jelas daripada _"karena tutorial yang saya ikuti seperti itu"_.

### Kapan Boleh Tidak Pakai Clean Architecture

Clean Architecture bukan _silver bullet_. Ada saatnya tidak perlu:

- **Prototype**: kalau kamu cuma mau _proof of concept_, tulis saja cepat. Jangan _overthink_.
- **_Script_ kecil**: kalau cuma 50 baris untuk _scrape data_, tidak perlu _layer-layeran_.
- **Belajar dasar dulu**: kalau belum nyaman dengan OOP atau _design pattern_, pelajari itu dulu. Clean Architecture butuh fondasi tersebut.

Gunakan saat kompleksitas proyek membutuhkannya, bukan karena namanya terdengar keren.

## Pelajaran

### 1. _Spaghetti Code_ Itu Normal, Tinggal di Situ yang Tidak Normal

_Spaghetti code_ bisa muncul saat kode tumbuh tanpa pemisahan tanggung jawab. Langkah awal memperbaikinya adalah mengenali bagian-bagian yang sudah saling terikat.

### 2. Pisahkan "Apa" dari "Bagaimana"

Pisahkan apa yang sistem lakukan (_business logic_) dari cara melakukannya (_database_, _API_, _framework_). Itulah inti Clean Architecture.

### 3. _Test_-ability Itu Indikator Arsitektur yang Baik

Kesulitan menulis _unit test_ bisa menjadi sinyal bahwa pemisahan tanggung jawab perlu ditinjau ulang. Dalam contoh ini, _Entity_ dan _Use Case_ dapat diuji tanpa menghubungi database atau layanan email.

### 4. Jangan Dogmatis

Clean Architecture itu _tool_, bukan agama. Pahami prinsipnya, lalu gunakan jika konteks proyek memang membutuhkannya.

## Penutup

Clean Architecture bukan soal jumlah _layer_ atau _pattern_ yang _fancy_. Tujuannya memisahkan tanggung jawab agar kode lebih mudah dipahami, diubah, dan diuji, termasuk saat kamu membukanya lagi beberapa bulan kemudian.

Kalau kamu tertarik melihat bagaimana Clean Architecture ini diterapkan di proyek nyata (migrasi dari PHP ke Go, 370+ _endpoint_), saya punya [catatan terpisah](/writing/2026/legacy-php-to-go-migration/) untuk sisi implementasinya.

Kontak saya ada di [hubungi saya](/contact/); [layanan](/services/) memuat pilihan bantuan yang saya tawarkan.

---

_Tag: [catatan](/tags/catatan/) · [arsitektur](/tags/arsitektur/)_
