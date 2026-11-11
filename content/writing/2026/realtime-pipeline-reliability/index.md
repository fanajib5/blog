---
title: "Reliability Pipeline GPS Real-Time: Retry, Backpressure, dan Observability"
description: "Cara memikirkan kegagalan, retry, backpressure, dan observability pada pipeline GPS real-time tanpa menganggap data selalu lengkap atau tersedia."
author: "Faiq Najib Al-Aziz"
date: 2026-10-24
lastmod: 2026-10-24
draft: false
toc: true
comments: true
images: []
tags:
  - golang
  - gps
  - reliability
  - streaming
pillar: "gps-iot"
series: ""
series_part: 0
---

Sistem GPS bisa terlihat sehat karena server menerima koneksi dan beberapa titik lokasi muncul di peta. Namun, satu bagian pipeline yang tertahan dapat membuat posisi yang ditampilkan sudah usang: listener masih menerima byte, worker tertinggal, antrean membesar, atau penulisan ke penyimpanan gagal berulang.

Karena itu, reliability bukan sekadar menjaga proses tetap hidup. Kita perlu tahu data apa yang berhasil diterima, apa yang belum diproses, apa yang gagal, dan tindakan apa yang aman dilakukan ketika salah satu komponen tidak tersedia.

Saya tulis ini sebagai kerangka berpikir untuk pipeline ingestion GPS. Contoh kode di sini ilustrasi, bukan implementasi lengkap, dan tidak menyatakan hasil produksi atau jaminan availability.

## Petakan alur dan batas kegagalan

Pipeline sederhana dapat dipetakan seperti ini:

```text
Tracker
  -> koneksi TCP
  -> framing dan validasi paket
  -> antrean kerja
  -> decode dan normalisasi
  -> penyimpanan atau layanan downstream
  -> pembaruan status yang dibaca operator
```

Setiap panah adalah batas yang perlu dipahami. Koneksi TCP dapat terputus. Frame dapat belum lengkap atau tidak valid. Worker dapat tertahan. Database dapat menolak koneksi atau menulis lebih lambat dari laju masuk. Consumer dashboard bisa terputus tanpa mengganggu ingestion, atau justru menghabiskan resource tanpa batas jika desainnya tidak membatasi klien.

Tanyakan pada setiap tahap:

- Apakah data sudah diterima hanya di memori, atau sudah tersimpan secara durable?
- Siapa yang mengetahui kegagalan?
- Apakah pengirim dapat mencoba lagi?
- Bagaimana kita mengenali data ganda?
- Apa perilaku sistem ketika kapasitas downstream terlampaui?

Jawaban “sudah diterima” perlu spesifik. Byte yang dibaca dari socket belum tentu sudah diproses, dan pesan yang masuk ke channel di memori belum tentu bertahan jika proses berhenti.

## Retry: ulangi hanya pekerjaan yang aman

Retry berguna untuk kegagalan sementara, misalnya koneksi downstream yang sebentar tidak tersedia. Tetapi retry bukan obat untuk setiap error. Mengulang payload yang ditolak karena format tidak valid tidak akan membuatnya menjadi valid. Mengulang operasi yang sudah berhasil tetapi responsnya hilang dapat membuat efek ganda.

Sebelum retry, bedakan setidaknya:

1. **Error sementara:** mungkin pulih setelah menunggu atau membangun ulang koneksi.
2. **Error permanen untuk pesan itu:** perlu dicatat, diperbaiki, atau dikarantina. Retry tanpa perubahan hanya mengulang kegagalan.
3. **Error yang hasilnya tidak diketahui:** downstream mungkin sudah melakukan pekerjaan tetapi balasan tidak sampai.

Untuk kategori ketiga, tentukan idempotensi. Jika protokol menyediakan nomor urut atau identitas pesan, gunakan informasi tersebut sesuai semantiknya. Jika tidak ada identitas stabil, jangan mengklaim deduplikasi sempurna; pilih dan dokumentasikan kompromi yang sesuai dengan dampak duplikasi.

Hindari retry rapat tanpa batas. Gunakan batas percobaan atau waktu, jeda yang meningkat, dan variasi jeda agar banyak worker tidak mencoba kembali serempak. Setelah batas tercapai, kegagalan perlu terlihat dan mengikuti kebijakan, misalnya masuk antrean durable untuk ditinjau, menolak koneksi agar sumber mencoba ulang, atau mengirim pesan ke jalur karantina. Pilihan bergantung pada kemampuan perangkat dan risiko kehilangan atau duplikasi data.

Pseudocode berikut menunjukkan urutannya, bukan API siap pakai:

```text
attempt = 0
while within retry budget:
    result = write(event)
    if success:
        acknowledge only when the delivery contract allows it
        stop
    if error is permanent:
        record and quarantine or reject
        stop
    wait with bounded exponential backoff and jitter
if still failing:
    emit a visible failure and apply the documented recovery policy
```

Retry perlu punya batas, error perlu bisa diklasifikasikan, dan kontrak acknowledgement tidak boleh membuat pengirim mengira data aman padahal hanya tersimpan di memori.

## Backpressure: kapasitas harus punya batas

Antrean membantu menyerap lonjakan singkat, tetapi antrean tanpa batas hanya menunda kegagalan sambil memakai memori lebih banyak. Antrean berbatas membuat sistem harus mengambil keputusan saat consumer tidak mampu mengejar producer.

Contoh berikut menunjukkan channel terbatas di Go:

```go
jobs := make(chan Packet, 256)

select {
case jobs <- packet:
    // Paket diterima ke antrean dalam memori.
default:
    // Kapasitas penuh: jalankan kebijakan overload yang sudah ditentukan.
    return ErrOverloaded
}
```

`Packet` dan `ErrOverloaded` adalah placeholder konseptual, bukan tipe dari aplikasi ini. Channel tersebut berada di memori: jika proses berhenti sebelum worker menyimpan paket, isi antrean dapat hilang.

Saat penuh, beberapa pilihan yang mungkin adalah:

- **Menahan pembacaan sementara.** Ini meneruskan tekanan ke koneksi, tetapi hanya berguna jika perangkat dan protokol menangani jeda dengan baik.
- **Menolak atau memutus koneksi.** Sumber mungkin akan mengirim ulang, tetapi perilaku ini perlu dibuktikan untuk perangkat yang digunakan.
- **Menyimpan ke antrean durable.** Ini menambah kebutuhan operasi, retensi, deduplikasi, dan pemulihan.
- **Menolak atau melepas data tertentu.** Hanya layak bila kebijakan bisnis mengizinkan kehilangan jenis data tersebut dan kehilangan itu terlihat.

Tidak ada kebijakan universal. Pilih berdasarkan nilai data, kemampuan retry dari perangkat, dan apa yang boleh terjadi ketika kapasitas habis. Apa pun pilihannya, jangan membiarkan overload berubah menjadi kehilangan diam-diam.

## Observability yang menjawab pertanyaan operasional

Log “error” saja tidak menunjukkan apakah data terlambat atau apakah tim perlu bertindak. Mulailah dengan sinyal yang menghubungkan komponen dan dampak:

| Sinyal | Pertanyaan yang dijawab |
|---|---|
| Koneksi aktif, ditolak, dan putus | Apakah sumber dapat terhubung dan mempertahankan sesi? |
| Paket diterima, tidak valid, dan gagal decode | Apakah format atau kualitas data berubah? |
| Kedalaman antrean dan usia item tertua | Apakah consumer mengejar laju masuk? |
| Jumlah retry dan hasil akhirnya | Apakah gangguan sementara pulih, atau kegagalan menumpuk? |
| Latensi pemrosesan dan penulisan | Tahap mana yang mulai tertahan? |
| Waktu posisi direkam dibanding diterima | Seberapa segar informasi yang dilihat pengguna? |

Definisikan nama, satuan, sumber, dan rentang pengukuran. Untuk menghitung freshness, bandingkan waktu posisi yang disediakan sumber dengan waktu penerimaan, sambil menangani perbedaan jam dan timestamp yang hilang. Jangan menyimpulkan perangkat offline hanya dari satu titik yang terlambat tanpa memeriksa koneksi dan aturan pelaporan.

Gunakan identitas perangkat sebagai label dengan hati-hati. Label ber-cardinality tinggi pada sistem metrik dapat menyulitkan penyimpanan dan query. Detail per perangkat dapat lebih sesuai di log terstruktur atau sistem investigasi, dengan kebijakan akses dan retensi yang sesuai.

## Ilustrasi kegagalan sintetis

Bayangkan sebuah consumer penyimpanan melambat sementara listener masih menerima paket. Antrean berbatas mulai terisi. Dengan hanya metrik jumlah koneksi, sistem mungkin tampak sehat. Dengan metrik usia item tertua dan latensi penulisan, operator dapat melihat bahwa data tertahan sebelum sampai ke penyimpanan.

Tim kemudian menjalankan kebijakan overload yang telah dipilih, misalnya menahan pembacaan atau mengirim data ke antrean durable, dan mencatat apakah paket dapat diproses setelah downstream pulih. Ini skenario sintetis untuk menjelaskan cara berpikir.

## Uji perilaku saat sistem tertekan

Jangan hanya menguji jalur sukses. Buat skenario uji yang meliputi:

- koneksi putus saat frame belum lengkap;
- paket malformed atau duplikat;
- database lambat atau tidak tersedia;
- antrean mencapai batas;
- worker berhenti dan dimulai kembali;
- proses restart saat ada data yang belum durable;
- sumber mengirim ulang setelah koneksi terputus.

Untuk tiap skenario, tentukan hasil yang diharapkan: data ditolak, ditunda, dicoba ulang, dikarantina, atau diproses satu kali bila kontrak sistem mendukungnya. Catat juga bagaimana operator mengetahui keadaan tersebut. Gunakan perangkat simulasi atau fixture yang tidak mengandung data rahasia.

## Checklist singkat

- Batas antara diterima, diantrekan, diproses, dan disimpan dijelaskan.
- Retry hanya digunakan untuk error yang sesuai dan memiliki batas.
- Operasi yang diulang memiliki kebijakan idempotensi atau duplikasi yang eksplisit.
- Semua antrean memiliki batas serta perilaku overload yang disepakati.
- Data di memori tidak disebut durable.
- Metrik menunjukkan usia data dan tahap pipeline yang tertahan.
- Jalur error terlihat dan memiliki pemilik tindak lanjut.
- Kegagalan penting diuji dengan skenario yang dapat diulang.

Kalau tim kamu sedang menilai integrasi atau pilot sistem armada, [hubungi Akordium Lab untuk mendiskusikan workflow dan batas implementasinya](https://akordium.id/contact).

Sekian. Salam.
