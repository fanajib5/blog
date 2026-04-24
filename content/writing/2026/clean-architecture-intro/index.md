---
title: "Clean Architecture: Dari Spaghetti Code ke Kode yang Bisa Dibaca Ulang"
description: "Pengantar Clean Architecture untuk mahasiswa, dari spaghetti code ke kode yang terstruktur, dengan contoh nyata dari proyek GPS tracker."
author: "Faiq Najib"
date: 2026-04-15
lastmod: 2026-04-15
draft: false
toc: true
comments: false
tags:
  - catatan
  - arsitektur
---

Saya pernah nulis kode yang saat itu _sense banget_. Logikanya jelas, alurnya rapi, _variabel_-nya deskriptif. Tiga bulan kemudian, buka lagi file yang sama, _"ini tadi mau ngapain sih?"_

_Nganu_, kalau kamu pernah merasakan hal yang sama, selamat datang. Kamu tidak sendirian hehe.

Tulisan ini bukan kuliah formal tentang arsitektur _software_. Ini catatan saya tentang **Clean Architecture**, dijelaskan dengan cara yang saya sendiri pengen dulu dengar waktu masih kuliah, bukan dengan istilah-istilah yang bikin pusing.

## Apa Itu "_Spaghetti Code_" dan Kenapa Kita Semua Pernah Menulisnya

_Spaghetti code_ itu bukan istilah teknis yang formal. Tapi semua _developer_ tahu apa artinya: **kode yang saling terikat dan sulit dipisahkan**, seperti mie spaghetti yang nggak bisa kamu ambil satu helai tanpa menarik yang lain.

Contoh _nyata_ dari proyek GPS _tracker_ yang pernah saya tangani. Dulu, ada satu _function_ yang kurang lebih begini (ini pseudo-code, ya):

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

Intinya: **ubah satu hal, risiko hal lain ikut rusak**.

## Clean Architecture: Intinya Sederhana Kok

Istilah "Clean Architecture" populer lewat Robert C. Martin (_Uncle Bob_). Tapi jangan keterangan dulu, kamu tidak perlu baca bukunya untuk mulai memahami idenya.

Intinya cuma satu kalimat: **kode yang penting (logika bisnis) tidak boleh tergantung pada detail teknis (database, _framework_, API).**

Kenapa? Karena logika bisnis itu yang **tidak berubah**, aturan cara menghitung jarak, cara menentukan kendaraan aktif, cara menentukan batas kecepatan. Database, _framework_, cara kirim email, itu **detail** yang bisa berubah.

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

Aturannya sederhana: **panah hanya boleh mengarah ke dalam**. _Entity_ tidak tahu apa-apa tentang database. _Use Case_ tidak tahu cara kirim email. _Infrastructure_ yang tahu detail teknis.

Ini artinya: kalau kamu mau ganti database dari MySQL ke PostgreSQL, _Entity_ dan _Use Case_ **tidak berubah sama sekali**. Yang berubah cuma _Infrastructure_.

### Tiga Layer yang Penting

Untuk mahasiswa, saya rasa tiga layer ini yang paling penting dipahami:

**1. Entity, Aturan Bisnis Inti**

Ini yang **tidak boleh berubah** terlepas dari teknologi apa pun yang kamu pakai. Di proyek GPS _tracker_, contohnya:

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

Perhatikan: tidak ada _database query_, tidak ada _HTTP request_, tidak ada _framework_. Ini murni **aturan bisnis**, apakah kendaraan _speeding_, bagaimana cara mengaktifkan kendaraan. Bahkan kalau besok ganti bahasa pemrograman, logika ini tetap sama.

**2. Use Case, Apa yang Sistem Lakukan**

_Use case_ mendefinisikan **apa** yang sistem lakukan, tanpa peduli **bagaimana** detailnya.

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

Perhatikan: _use case_ memanggil `vehicleRepository` dan `alertService`, tapi **tidak tahu** apakah itu pakai MySQL, PostgreSQL, kirim via email atau SMS. Dia cuma tahu _"cari kendaraan"_, _"simpan"_, _"kirim alert"_.

Ini kekuatan utama Clean Architecture: **kamu bisa mengganti database tanpa menyentuh use case**.

**3. Infrastructure, Detail Teknis**

Di sinilah detail implementasi berada, database, API, _framework_, _email service_, dll.

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

Sekarang mari kita bandingkan kode _spaghetti_ di awal dengan versi yang sudah "clean":

### Before: Spaghetti

Satu _function_ nangkap semua, baca DB, olah logika, kirim notifikasi, _generate_ laporan. Semua menyatu.

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

Perhatikan: **setiap layer bisa di-_test_ sendiri**. `Vehicle` bisa di-_test_ tanpa database. `UpdatePositionUseCase` bisa di-_test_ dengan _mock repository_. `MySQLVehicleRepository` bisa di-_test_ secara terpisah.

## Kenapa Ini Penting Buat Kamu

Bukan Cuma Buat Proyek Besar

Mungkin kamu berpikir, _"Ini kan buat proyek gede. Skripsi saya cuma aplikasi kecil."_ Betul, untuk aplikasi kecil, Clean Architecture bisa _overkill_. Tapi prinsipnya tetap berlaku:

- **Pisahkan yang penting dari detail teknis**: ini bukan soal jumlah _layer_, ini soal _mindset_
- **Tulis kode yang bisa di-_test_**: bahkan di proyek kecil, ini _save time_ saat _debugging_
- **Pikirkan dulu, tulis kemudian**: Clean Architecture itu soal **memikirkan** apa yang penting sebelum mulai ngode

Untuk skripsi, dosen _pasti_ akan tanya _"kenapa kamu _design_ sistem seperti ini?"_ Kalau kamu bisa jawab _"karena logika bisnis saya tidak tergantung pada database"_, itu jawaban yang jauh lebih kuat daripada _"karena tutorial yang saya ikuti seperti itu"_.

### Kapan Boleh Tidak Pakai Clean Architecture

Clean Architecture bukan _silver bullet_. Ada saatnya tidak perlu:

- **Prototype**: kalau kamu cuma mau _proof of concept_, tulis saja cepat. Jangan _overthink_.
- **_Script_ kecil**: kalau cuma 50 baris untuk _scrape data_, tidak perlu _layer-layeran_.
- **Belajar dasar dulu**: kalau belum nyaman dengan OOP atau _design pattern_, pelajari itu dulu. Clean Architecture butuh fondasi tersebut.

Intinya: **gunakan ketika kompleksitas sudah membutuhkannya**, bukan karena kedengarannya keren.

## Pelajaran

### 1. _Spaghetti Code_ Itu Normal, Tinggal di Itu yang Tidak Normal

Semua _developer_ pernah nulis spaghetti code, termasuk yang sudah senior. Yang membedakan adalah: sadar kalau kodenya sudah _spaghetti_, dan tahu cara memperbaikinya.

### 2. Pisahkan "Apa" dari "Bagaimana"

Apa yang sistem lakukan (_business logic_) harus terpisah dari bagaimana sistem melakukannya (_database_, _API_, _framework_). Ini inti Clean Architecture.

### 3. _Test_-ability Itu Indikator Arsitektur yang Baik

Kalau kamu sulit menulis _unit test_ untuk kode kamu, itu sinyal bahwa arsitekturnya perlu dipikirkan ulang. Kode yang baik itu mudah ditest.

### 4. Jangan Dogmatis

Clean Architecture itu _tool_, bukan agama. Kalau konteksnya tidak membutuhkan, tidak perlu dipaksakan. Yang penting paham prinsipnya dan tahu kapan mengaplikasikannya.

## Penutup

Clean Architecture, pada intinya, bukan soal jumlah _layer_ atau pattern yang fancy. Ini soal **menulis kode yang bisa dipahami, diubah, dan di-_test_, oleh diri kamu sendiri maupun orang lain**. Bahkan kalau itu 3 bulan kemudian hehe.

Kalau kamu tertarik melihat bagaimana Clean Architecture ini diterapkan di proyek nyata (migrasi dari PHP ke Go, 370+ _endpoint_), saya punya [catatan terpisah](/writing/legacy-php-to-go-migration/) untuk sisi implementasinya.

Kalau ada pertanyaan atau mau diskusi lebih lanjut, [hubungi saya](/contact/). Atau lihat [layanan](/services/) yang bisa saya bantu.

---

_Tag: [catatan](/tags/catatan/) · [arsitektur](/tags/arsitektur/)_
