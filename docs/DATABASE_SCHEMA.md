# DATABASE_SCHEMA.md
# SIM KEUANGAN YAYASAN
Version 1.0

---

# DATABASE

Firebase Cloud Firestore

Semua koleksi menggunakan:

- UUID sebagai Document ID
- createdAt
- updatedAt
- createdBy
- updatedBy
- deletedAt (Soft Delete)

Tidak ada hard delete.

---

# COLLECTION

tahun_anggaran

Deskripsi:

Menyimpan seluruh Tahun Anggaran.

Fields

id

nama

contoh:

2026-2027

isActive

boolean

keterangan

createdAt

updatedAt

---

# COLLECTION

unit

Deskripsi:

Daftar Unit Yayasan.

Contoh:

RA

MI

MTs

Unit Usaha

Fields

id

kode

nama

isActive

createdAt

updatedAt

---

# COLLECTION

users

Firebase Authentication

Data tambahan disimpan di Firestore.

Fields

uid

nama

email

role

unitId

isActive

photoURL

lastLogin

createdAt

updatedAt

---

# ROLE

admin

ketua_yayasan

bendahara_yayasan

staf_tu

pj_infaq

---

# COLLECTION

sumber_dana

Fields

id

nama

Urutan awal

SPP

BOS

LKS

Seragam

Unit Usaha

Dana Infaq

isActive

createdAt

---

# COLLECTION

kategori_pengeluaran

Fields

id

nama

contoh

Honor

ATK

Operasional

Sarana

Transport

Listrik

Air

Internet

Program

Lainnya

createdAt

---

# COLLECTION

rapbs

Deskripsi

Rencana Anggaran Pendapatan dan Belanja.

Fields

id

tahunAnggaranId

unitId

jenis

enum

PEMASUKAN

PENGELUARAN

sumberDanaId

nullable

kategoriPengeluaranId

nullable

namaProgram

target

number

keterangan

status

enum

DRAFT

MENUNGGU_APPROVAL

APPROVED

REJECTED

approvedBy

approvedAt

createdBy

createdAt

updatedAt

---

# COLLECTION

pemasukan

Deskripsi

Seluruh pemasukan yayasan.

Fields

id

tanggal

tahunAnggaranId

unitId

rapbsId

sumberDanaId

nominal

keterangan

statusDana

enum

DI_TU

DI_BENDAHARA

DI_BANK

inputBy

createdAt

updatedAt

---

# COLLECTION

serah_terima

Deskripsi

Serah terima uang dari TU ke Bendahara.

Fields

id

tanggal

pemasukanIds

array

totalNominal

diserahkanOleh

diterimaOleh

catatan

createdAt

---

# COLLECTION

setoran_bank

Deskripsi

Setoran Bendahara ke Bank.

Fields

id

tanggal

serahTerimaId

totalNominal

namaBank

nomorReferensi

disetorOleh

createdAt

---

# COLLECTION

pengajuan_pengeluaran

Deskripsi

Pengajuan dari Bendahara.

Fields

id

tanggal

tahunAnggaranId

unitId

rapbsId

kategoriPengeluaranId

nominal

penerima

metodePembayaran

keterangan

lampiran (nullable/optional, upload file ditunda untuk fase berikutnya)

status

enum

DRAFT

MENUNGGU_APPROVAL

APPROVED

REJECTED

approvalBy

approvalAt

approvalNote

createdBy

createdAt

updatedAt

---

# COLLECTION

realisasi_pengeluaran

Deskripsi

Terbentuk otomatis setelah approval.

Fields

id

pengajuanId

tanggal

tahunAnggaranId

unitId

rapbsId

kategoriPengeluaranId

nominal

penerima

metodePembayaran

keterangan

createdBy

createdAt

---

# COLLECTION

infaq

Deskripsi

Dana Infaq.

Fields

id

tanggal

nominal

donatur

nullable

keterangan

inputBy

createdAt

---

# COLLECTION

activity_logs

Audit Trail.

Fields

id

userId

action

collection

documentId

oldValue

newValue

ipAddress

device

createdAt

---

# ENUM

Role

ADMIN

KETUA_YAYASAN

BENDAHARA_YAYASAN

STAF_TU

PJ_INFAQ

---

# ENUM

Status RAPBS

DRAFT

MENUNGGU_APPROVAL

APPROVED

REJECTED

---

# ENUM

Status Dana

DI_TU

DI_BENDAHARA

DI_BANK

---

# ENUM

Status Pengajuan

DRAFT

MENUNGGU_APPROVAL

APPROVED

REJECTED

---

# RELASI

tahun_anggaran

↓

rapbs

↓

pemasukan

↓

serah_terima

↓

setoran_bank

↓

Saldo Bank

↓

pengajuan_pengeluaran

↓

approval Ketua Yayasan

↓

realisasi_pengeluaran

---

# DASHBOARD CALCULATION

Saldo TU

SUM(statusDana == DI_TU)

Saldo Bendahara

SUM(statusDana == DI_BENDAHARA)

Saldo Bank

SUM(statusDana == DI_BANK)
-
SUM(realisasi_pengeluaran.nominal)

Total Infaq

SUM(infaq.nominal)

Target Pemasukan

SUM(rapbs.target WHERE jenis = PEMASUKAN)

Realisasi Pemasukan

SUM(pemasukan.nominal)

Target Pengeluaran

SUM(rapbs.target WHERE jenis = PENGELUARAN)

Realisasi Pengeluaran

SUM(realisasi_pengeluaran.nominal)

Sisa Anggaran

Target Pengeluaran
-
Realisasi Pengeluaran

---

# FIRESTORE SECURITY

Admin

Full Access

Ketua Yayasan

Read All

Approve RAPBS

Approve Pengeluaran

Bendahara

Read

Create Pengajuan

Create Setoran Bank

Create Serah Terima

Staf TU

Create Pemasukan

Read Miliknya

PJ Infaq

Create Infaq

Read Infaq

---

# INDEX YANG DIPERLUKAN

pemasukan

tahunAnggaranId + statusDana

rapbs

tahunAnggaranId + unitId

pengajuan_pengeluaran

status + tanggal

realisasi_pengeluaran

tahunAnggaranId + unitId

activity_logs

userId + createdAt

---

# SOFT DELETE

Semua koleksi menggunakan:

deletedAt

deletedBy

Data tidak boleh dihapus permanen.

---

# DESIGN PRINCIPLE

- Sederhana
- Mudah dipahami
- Tidak menggunakan konsep akuntansi
- Tidak menggunakan jurnal
- Tidak menggunakan COA
- Fokus pada transparansi keuangan yayasan
- Mobile First

---

# REKOMENDASI DESAIN DATABASE

## Prinsip

Aplikasi ini menggunakan pendekatan **Single Source of Truth**.

Satu transaksi hanya memiliki satu dokumen yang berubah status sepanjang siklus hidupnya.

Hindari duplikasi data.

Jangan membuat collection yang memiliki data sama.

---

# PENGAJUAN PENGELUARAN

Gunakan SATU collection saja:

pengajuan_pengeluaran

JANGAN membuat collection:

realisasi_pengeluaran

Karena seluruh proses dapat dikelola melalui perubahan status pada dokumen yang sama.

---

# ALUR STATUS PENGELUARAN

Draft

↓

Menunggu Approval

↓

Approved

↓

Direalisasikan

↓

Selesai

atau

Draft

↓

Menunggu Approval

↓

Rejected

---

# STATUS

Gunakan enum berikut:

DRAFT

MENUNGGU_APPROVAL

APPROVED

DIREALISASIKAN

REJECTED

---

# FIELD TAMBAHAN

Collection:

pengajuan_pengeluaran

Tambahkan field berikut.

status

approvalBy

approvalAt

approvalNote

realisasiAt

dibayarOleh

nomorBukti

lampiran

---

# SAAT APPROVAL

Ketua Yayasan melakukan:

Approve

atau

Reject

Jika Approve

Status menjadi:

APPROVED

Saldo Bank BELUM berkurang.

Karena pembayaran belum dilakukan.

---

# SAAT PEMBAYARAN

Bendahara Yayasan menekan tombol:

"Realisasikan"

Status berubah menjadi:

DIREALISASIKAN

Pada saat ini sistem otomatis:

- Mengurangi Saldo Bank
- Menambah nilai Realisasi Pengeluaran Dashboard
- Mengurangi Sisa Anggaran RAPBS
- Menyimpan tanggal pembayaran
- Menyimpan pengguna yang melakukan pembayaran

---

# DASHBOARD

Dashboard menghitung:

Realisasi Pengeluaran

berdasarkan

status == DIREALISASIKAN

Pengajuan yang masih

DRAFT

MENUNGGU_APPROVAL

APPROVED

tidak dihitung sebagai pengeluaran.

---

# KEUNTUNGAN

Pendekatan ini memberikan beberapa keuntungan.

1.

Tidak ada duplikasi data.

2.

Query Firestore lebih sederhana.

3.

Lebih hemat biaya baca dan tulis Firestore.

4.

Riwayat transaksi tetap utuh.

5.

Audit lebih mudah.

6.

Satu transaksi memiliki satu ID sepanjang siklus hidupnya.

7.

Lebih mudah dikembangkan di masa depan.

8.

Lebih mudah dipahami AI maupun developer.

---

# FIRESTORE BEST PRACTICE

Gunakan satu dokumen untuk satu transaksi.

Gunakan perubahan status untuk menggambarkan alur bisnis.

Hindari membuat collection baru apabila hanya digunakan untuk menyimpan data yang sama.

Prinsip ini mengikuti best practice Firebase Cloud Firestore.

---

# REKOMENDASI ARSITEKTUR FIRESTORE

## Prinsip Utama

Aplikasi menggunakan konsep:

**One Transaction = One Document**

Setiap transaksi hanya memiliki SATU dokumen selama seluruh siklus hidupnya.

Status transaksi berubah mengikuti proses bisnis.

Jangan membuat dokumen baru apabila hanya terjadi perubahan status.

---

# PEMASUKAN

Gunakan SATU collection:

pemasukan

JANGAN membuat collection:

- serah_terima
- setoran_bank

Karena kedua proses tersebut hanyalah perubahan status dari transaksi pemasukan.

---

# ALUR STATUS PEMASUKAN

DI_TU

↓

DI_BENDAHARA

↓

DI_BANK

---

# COLLECTION

pemasukan

Contoh struktur:

id

tanggal

tahunAnggaranId

unitId

rapbsId

sumberDanaId

nominal

keterangan

statusDana

enum

DI_TU

DI_BENDAHARA

DI_BANK

---

# FIELD PERPINDAHAN DANA

Saat uang berpindah, cukup update field berikut.

## Serah Terima

diserahkanAt

diserahkanBy

diterimaBy

catatanSerahTerima

---

## Setor Bank

disetorAt

disetorBy

namaBank

nomorReferensi

catatanSetoran

---

# CONTOH

Saat pertama kali dicatat.

statusDana

DI_TU

↓

Setelah Bendahara menerima.

statusDana

DI_BENDAHARA

↓

Setelah Bendahara setor Bank.

statusDana

DI_BANK

Dokumen tetap sama.

ID tetap sama.

Tidak membuat dokumen baru.

---

# DASHBOARD

Saldo TU

SUM(
statusDana == DI_TU
)

Saldo Bendahara

SUM(
statusDana == DI_BENDAHARA
)

Saldo Bank

SUM(
statusDana == DI_BANK
)
-
SUM(
pengajuan_pengeluaran
status == DIREALISASIKAN
)

---

# RIWAYAT

Riwayat perpindahan dana tetap tersimpan.

Contoh:

createdAt

createdBy

diserahkanAt

diserahkanBy

diterimaBy

disetorAt

disetorBy

updatedAt

Tidak perlu collection history tambahan.

---

# KEUNTUNGAN

1.

One Transaction = One Document.

2.

Tidak ada duplikasi data.

3.

Lebih hemat biaya Firestore.

4.

Dashboard cukup menghitung berdasarkan statusDana.

5.

Lebih mudah dipahami developer.

6.

Lebih mudah dipahami AI.

7.

Performa query lebih baik.

8.

Audit tetap lengkap.

---

# BEST PRACTICE FIREBASE

Firestore sangat cocok untuk model state machine.

Setiap transaksi memiliki satu dokumen.

Perubahan proses direpresentasikan melalui perubahan status.

Bukan dengan membuat dokumen baru.

Pendekatan ini mengikuti praktik yang umum digunakan pada aplikasi workflow modern berbasis Firebase.

---

# STATE MACHINE

PEMASUKAN

DI_TU

↓

DI_BENDAHARA

↓

DI_BANK

↓

SELESAI

---

PENGELUARAN

DRAFT

↓

MENUNGGU_APPROVAL

↓

APPROVED

↓

DIREALISASIKAN

↓

SELESAI

atau

↓

REJECTED

Seluruh perubahan dilakukan pada dokumen yang sama.

Tidak membuat collection baru.

---

# PRINSIP PENGEMBANGAN

Setiap fitur baru harus mengikuti aturan berikut:

- Satu transaksi = satu dokumen.
- Status menggambarkan proses bisnis.
- Hindari duplikasi data.
- Gunakan update status, bukan membuat dokumen baru.
- Dashboard dihitung dari status transaksi.
- Semua histori disimpan pada dokumen yang sama melalui metadata dan timestamp.

---

# CORE ARCHITECTURE
# STATE MACHINE WORKFLOW

## Filosofi

Seluruh modul dalam aplikasi menggunakan pola **State Machine Workflow**.

Artinya:

Setiap transaksi hanya memiliki SATU dokumen.

Dokumen tersebut berubah status sesuai proses bisnis.

Jangan membuat dokumen baru hanya karena proses bisnis berubah.

Perubahan proses direpresentasikan dengan perubahan status (state).

Prinsip ini berlaku untuk seluruh modul aplikasi.

---

# MENGAPA MENGGUNAKAN STATE MACHINE

Keuntungan:

- Satu transaksi memiliki satu ID sepanjang hidupnya.
- Tidak ada duplikasi data.
- Query Firestore lebih sederhana.
- Dashboard lebih mudah dihitung.
- Audit trail lebih jelas.
- Workflow lebih mudah dipahami.
- Role & Permission lebih mudah diterapkan.
- Mudah dikembangkan di masa depan.
- Sesuai best practice Firebase Cloud Firestore.

---

# STATE MACHINE RAPBS

Draft

↓

Menunggu Persetujuan

↓

Disetujui

↓

Aktif

↓

Ditutup

Jika ditolak:

Draft

↓

Menunggu Persetujuan

↓

Ditolak

Hanya RAPBS dengan status **AKTIF** yang dapat digunakan sebagai dasar transaksi.

---

# STATE MACHINE PEMASUKAN

Saat pertama kali dicatat:

DI_TU

↓

Diserahkan ke Bendahara

↓

DI_BENDAHARA

↓

Disetor ke Bank

↓

DI_BANK

↓

SELESAI

Seluruh proses menggunakan dokumen yang sama.

Tidak membuat dokumen baru.

---

# STATE MACHINE PENGELUARAN

Draft

↓

Menunggu Approval

↓

Approved

↓

Direalisasikan

↓

Selesai

Jika ditolak:

Draft

↓

Menunggu Approval

↓

Rejected

Saldo Bank hanya berkurang ketika status menjadi:

DIREALISASIKAN

Bukan saat APPROVED.

---

# STATE MACHINE DANA INFAQ

Draft

↓

Terverifikasi

↓

Selesai

Dana Infaq tidak melalui proses TU maupun Bendahara.

Tetap menjadi bagian dari Dashboard Yayasan.

---

# ATURAN PERUBAHAN STATUS

Status hanya boleh berubah sesuai workflow.

Contoh:

DI_TU

boleh menjadi

DI_BENDAHARA

Tidak boleh langsung menjadi

SELESAI

---

APPROVED

boleh menjadi

DIREALISASIKAN

Tidak boleh kembali menjadi

DRAFT

Kecuali oleh Admin melalui proses pembatalan yang terdokumentasi.

---

# VALIDASI WORKFLOW

Sistem wajib memvalidasi perubahan status.

Perubahan yang tidak sesuai workflow harus ditolak.

Contoh:

DI_BANK

↓

DI_TU

Tidak diperbolehkan.

---

# ROLE BERDASARKAN STATE

## Admin

Dapat mengubah seluruh state sesuai kewenangannya.

---

## Ketua Yayasan

Berwenang mengubah state approval:

MENUNGGU_APPROVAL

↓

APPROVED

atau

REJECTED

Tidak dapat melakukan realisasi pembayaran.

---

## Bendahara Yayasan

Berwenang mengubah:

DI_BENDAHARA

↓

DI_BANK

Serta:

APPROVED

↓

DIREALISASIKAN

Tidak dapat melakukan approval.

---

## Staf TU

Berwenang membuat transaksi pemasukan.

Status awal selalu:

DI_TU

Tidak dapat mengubah transaksi menjadi DI_BANK.

---

## PJ Infaq

Berwenang membuat transaksi Dana Infaq.

Tidak memiliki akses ke workflow pemasukan maupun pengeluaran lainnya.

---

# AUDIT TRAIL

Setiap perubahan status wajib mencatat:

statusSebelumnya

statusBaru

diubahOleh

diubahPada

catatanPerubahan

Tidak boleh ada perubahan status tanpa jejak audit.

---

# DASHBOARD BERDASARKAN STATE

Dashboard dihitung berdasarkan status transaksi.

Contoh:

Saldo TU

= SUM(statusDana == DI_TU)

Saldo Bendahara

= SUM(statusDana == DI_BENDAHARA)

Saldo Bank

= SUM(statusDana == DI_BANK)
- SUM(pengeluaran dengan status == DIREALISASIKAN)

Target Pemasukan

= SUM(target RAPBS jenis PEMASUKAN dengan status AKTIF)

Realisasi Pemasukan

= SUM(pemasukan)

Target Pengeluaran

= SUM(target RAPBS jenis PENGELUARAN dengan status AKTIF)

Realisasi Pengeluaran

= SUM(pengeluaran dengan status DIREALISASIKAN)

Pengajuan Menunggu Approval

= COUNT(status == MENUNGGU_APPROVAL)

---

# PRINSIP PENGEMBANGAN

Semua modul baru yang ditambahkan di masa depan wajib mengikuti pola berikut:

1. One Transaction = One Document.
2. Workflow direpresentasikan oleh perubahan status.
3. Tidak membuat collection baru jika hanya terjadi perubahan status.
4. Status menjadi dasar hak akses (Role Based Access).
5. Dashboard mengambil data berdasarkan status transaksi.
6. Seluruh perubahan status harus tercatat dalam audit trail.
7. Setiap workflow harus memiliki aturan transisi yang jelas dan tervalidasi.

State Machine Workflow adalah standar arsitektur resmi aplikasi SIM Keuangan Yayasan dan harus dipatuhi pada seluruh modul yang dikembangkan.