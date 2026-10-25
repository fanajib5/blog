---
title: "Clean Architecture: Dari Spaghetti Code ke Kode yang Bisa Dibaca Ulang"
description: "Catatan santai soal Clean Architecture, pakai contoh dari proyek GPS tracker yang pernah saya kerjakan."
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

Saya pernah menulis kode yang rasanya masuk akal saat itu. Logikanya jelas, alurnya rapi, nama variabelnya deskriptif. Tiga bulan kemudian saya buka lagi file yang sama, lalu mikir, _"ini tadi mau ngapain sih?"_ Ya, ternyata saya sendiri juga bisa bingung sama kode buatan sendiri hehe.

Di proyek GPS _tracker_ yang pernah saya tangani, satu _function_ mengurus semuanya: baca database, ubah status dan posisi kendaraan, kirim notifikasi, lalu bikin laporan. Praktis? Awalnya mungkin. Setelah kodenya tumbuh, ya mulai terasa.

## Mengenali "_Spaghetti Code_"

_Spaghetti code_ bukan istilah teknis formal. Istilah ini menggambarkan **kode yang saling terikat dan sulit dipisahkan**, seperti mie spaghetti yang sulit diambil sehelai tanpa menarik yang lain.

Kira-kira begini bentuk _function_-nya (pseudocode):

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

## Clean Architecture, Versi Ringkasnya

Robert C. Martin (_Uncle Bob_) memopulerkan istilah "Clean Architecture". Kalau diringkas, idenya begini: **logika bisnis jangan bergantung pada detail teknis seperti database, _framework_, atau API.** Biar kedengarannya tidak lebih rumit dari yang perlu.

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

Nah, biasanya pembagian tanggung jawabnya dijelaskan lewat tiga _layer_ ini:

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

## Coba Terapkan ke Contoh GPS Tracker

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

## Kalau Proyeknya Kecil Gimana?

Mungkin kamu sedang berpikir, _"Ini kan buat proyek gede. Skripsi saya cuma aplikasi kecil."_ Bisa jadi. Untuk aplikasi kecil, Clean Architecture memang gampang jadi _overkill_. Tapi memisahkan logika bisnis dari urusan teknis tetap ada gunanya, apalagi kalau nanti kodenya perlu dites atau detail implementasinya berubah.

Saat menjelaskan rancangan skripsi, dosen mungkin bertanya _"kenapa kamu _design_ sistem seperti ini?"_ Jawaban _"karena logika bisnis saya tidak tergantung pada database"_ lebih jelas daripada _"karena tutorial yang saya ikuti seperti itu"_.

### Kapan Tidak Perlu Repot-repot

Clean Architecture bukan _silver bullet_. Ada saatnya tidak perlu:

- **Prototype**: kalau kamu cuma mau _proof of concept_, tulis saja cepat. Jangan _overthink_.
- **_Script_ kecil**: kalau cuma 50 baris untuk _scrape data_, tidak perlu _layer-layeran_.
- **Belajar dasar dulu**: kalau belum nyaman dengan OOP atau _design pattern_, pelajari itu dulu. Clean Architecture butuh fondasi tersebut.

Jadi, pakai kalau kompleksitas proyeknya memang sudah minta begitu. Jangan cuma karena namanya kedengaran keren, nanti keburu sibuk bikin _layer_ sebelum masalahnya ada hehe.

## Yang Saya Catat

### _Spaghetti code_ bisa kejadian

_Spaghetti code_ bisa muncul ketika kode terus tumbuh tanpa pembagian tanggung jawab yang jelas. Tidak perlu langsung panik atau menghakimi kode lama. Mulai saja dengan mencari bagian mana yang saling menempel.

### Bedakan "apa" dan "bagaimana"

Logika bisnis menjawab apa yang sistem lakukan. Database, _API_, dan _framework_ adalah cara teknis untuk menjalankannya. Buat saya, pemisahan itu inti idenya.

### Kalau susah dites, cek lagi pembagiannya

Kesulitan menulis _unit test_ bisa jadi tanda pembagian tanggung jawabnya perlu dilihat lagi. Di contoh ini, _Entity_ dan _Use Case_ bisa dites tanpa menghubungi database atau layanan email.

### Ini alat, bukan aturan wajib

Clean Architecture itu _tool_, bukan agama (saya ulang biar tidak ada yang bikin _layer_ demi _layer_). Pahami idenya, lalu pakai kalau memang cocok dengan proyeknya.

## Nah, Terus Gimana?

Jadi, yang penting bukan banyaknya _layer_ atau _pattern_ yang _fancy_. Tujuannya supaya tanggung jawab tidak campur aduk, dan supaya beberapa bulan lagi kita masih bisa paham kode sendiri. Saya sendiri pernah gagal di bagian terakhir itu hehe.

Kalau penasaran seperti apa penerapannya di proyek nyata, termasuk migrasi PHP ke Go dengan 370+ _endpoint_, saya pernah menulis [catatan terpisah](/writing/2026/legacy-php-to-go-migration/).

Kalau ingin membahas penerapannya atau mencari bantuan, [hubungi saya](/contact/) atau lihat [layanan](/services/) yang saya tawarkan.

---

_Tag: [catatan](/tags/catatan/) · [arsitektur](/tags/arsitektur/)_
