# PROJECT KNOWLEDGE
# SIM KEUANGAN YAYASAN

Versi 1.0

---

# TUJUAN APLIKASI

SIM Keuangan Yayasan adalah aplikasi untuk mencatat seluruh rencana dan realisasi keuangan yayasan.

Fokus aplikasi adalah:

- Transparansi
- Akuntabilitas
- Kemudahan penggunaan
- Monitoring posisi uang

Aplikasi BUKAN sistem akuntansi.

Aplikasi BUKAN ERP.

Aplikasi tidak menggunakan jurnal, COA, ledger, neraca maupun laba rugi.

---

# VISI

Seluruh pengurus yayasan dapat mengetahui kondisi keuangan secara real time.

---

# MISI

Mencatat:

- Rencana pemasukan
- Rencana pengeluaran
- Realisasi pemasukan
- Realisasi pengeluaran

Mengetahui posisi uang:

- TU
- Bendahara
- Bank

---

# UNIT YAYASAN

RA

MI

MTs

Unit Usaha

---

# SUMBER DANA

SPP

BOS

LKS

Seragam

Unit Usaha

Dana Infaq

---

# POSISI UANG

Dalam aplikasi terdapat tiga posisi uang.

## 1

Uang di TU

Artinya:

uang sudah diterima dari siswa atau masyarakat.

Belum diserahkan ke Bendahara Yayasan.

---

## 2

Uang di Bendahara

Artinya:

uang sudah diterima Bendahara.

Belum disetor ke Bank.

---

## 3

Uang di Bank

Artinya:

uang telah masuk rekening yayasan.

Seluruh pengeluaran berasal dari saldo Bank.

---

# ALUR BISNIS

## Tahap 1

Admin membuat RAPBS.

↓

## Tahap 2

Ketua Yayasan melakukan approval RAPBS.

↓

## Tahap 3

RAPBS aktif.

↓

## Tahap 4

Staf TU mencatat pemasukan.

Status:

Uang berada di TU.

↓

## Tahap 5

TU menyerahkan uang ke Bendahara.

Status berubah:

Di Bendahara.

↓

## Tahap 6

Bendahara menyetor uang ke Bank.

Status berubah:

Di Bank.

↓

## Tahap 7

Bendahara membuat Pengajuan Pengeluaran.

↓

## Tahap 8

Ketua Yayasan melakukan:

Approve

atau

Reject

↓

## Tahap 9

Jika Approve

otomatis menjadi

Realisasi Pengeluaran.

Saldo Bank berkurang.

---

# RAPBS

RAPBS adalah rencana.

Belum ada transaksi.

RAPBS hanya berisi target.

---

# REALISASI

Realisasi adalah transaksi yang benar-benar terjadi.

---

# DASHBOARD

Dashboard menampilkan:

Saldo TU

Saldo Bendahara

Saldo Bank

Total Dana Infaq

Target Pemasukan

Realisasi Pemasukan

Target Pengeluaran

Realisasi Pengeluaran

Sisa Anggaran

Pengajuan Menunggu Approval

10 transaksi terakhir

---

# ROLE

## Admin

Hak akses penuh.

Membuat RAPBS.

Master Data.

User.

Mengoreksi transaksi.

Melihat seluruh laporan.

---

## Ketua Yayasan

Tidak menginput transaksi.

Hanya:

Approve RAPBS.

Approve Pengeluaran.

Melihat Dashboard.

Melihat seluruh laporan.

---

## Bendahara Yayasan

Menerima uang dari TU.

Menyetor uang ke Bank.

Mengajukan Pengeluaran.

Melihat Dashboard.

Melihat laporan.

---

## Staf TU

Input pemasukan.

Serah Terima ke Bendahara.

Melihat transaksi miliknya.

---

## PJ Infaq

Input Dana Infaq.

Melihat laporan Dana Infaq.

---

# MENU APLIKASI

Dashboard

↓

RAPBS

↓

Catatan Pemasukan

↓

Serah Terima TU

↓

Setoran Bank

↓

Pengajuan Pengeluaran

↓

Laporan

↓

Master Data

---

# MASTER DATA

Tahun Anggaran

Unit

User

Kategori Pengeluaran

Sumber Dana

---

# STATUS RAPBS

Draft

Menunggu Persetujuan

Disetujui

Ditolak

---

# STATUS PEMASUKAN

Di TU

↓

Diserahkan ke Bendahara

↓

Disetor ke Bank

---

# STATUS PENGELUARAN

Draft

↓

Menunggu Approval

↓

Disetujui

↓

Direalisasikan

atau

Ditolak

---

# BUSINESS RULES

1.

Pengeluaran hanya boleh dilakukan jika saldo Bank mencukupi.

2.

Dana tidak boleh langsung berpindah dari TU ke Bank.

Harus melalui Bendahara.

3.

Dana Infaq tidak melalui TU.

Dicatat langsung oleh PJ Infaq.

4.

Ketua Yayasan tidak boleh mengubah transaksi.

5.

Ketua Yayasan hanya dapat approve atau reject.

6.

Pengeluaran otomatis mengurangi saldo Bank.

7.

RAPBS hanya dapat diubah Admin.

8.

Setelah RAPBS disetujui,

target tidak boleh berubah tanpa revisi.

9.

Seluruh transaksi harus memiliki:

Tanggal

User

Timestamp

10.

Seluruh transaksi harus tersimpan sebagai histori.

Tidak boleh benar-benar dihapus.

Gunakan Soft Delete.

---

# UI PRINCIPLE

Mobile First.

Bottom Navigation.

Sidebar hanya Desktop.

Semua form satu kolom pada mobile.

Card lebih diutamakan daripada tabel.

---

# DESIGN PRINCIPLE

Simple.

Fast.

Modern.

Financial Dashboard.

Mudah dipahami guru.

Mudah dipahami bendahara.

---

# YANG TIDAK BOLEH DIBUAT

Jangan membuat:

COA

Jurnal

Ledger

Neraca

Laba Rugi

Pajak

Akuntansi

ERP

Payroll

Inventory

Asset Management

Fitur di luar kebutuhan.

---

# TEKNOLOGI

Next.js

TypeScript

Tailwind CSS

Firebase Authentication

Firestore

Firebase Storage (Fitur ditunda untuk fase berikutnya)

Vercel

---

# PRINSIP PENGEMBANGAN

Setiap perubahan harus mengikuti aturan berikut:

1.

Tidak mengubah Business Process tanpa izin.

2.

Tidak menambah menu baru tanpa izin.

3.

Tidak menghapus fitur tanpa izin.

4.

Tidak mengubah nama menu tanpa izin.

5.

Tidak mengubah workflow tanpa izin.

6.

Fokus pada kesederhanaan.

7.

Semua fitur harus mendukung transparansi keuangan yayasan.