# BUSINESS_WORKFLOW.md
# SIM KEUANGAN YAYASAN
Version 1.0

---

# TUJUAN

Dokumen ini menjelaskan alur bisnis resmi SIM Keuangan Yayasan.

Semua pengembangan aplikasi harus mengikuti workflow ini.

Developer maupun AI tidak boleh mengubah workflow tanpa persetujuan Product Owner.

---

# PRINSIP

Aplikasi dibuat untuk:

- Transparansi Keuangan Yayasan
- Akuntabilitas
- Monitoring Posisi Dana
- Monitoring RAPBS
- Persetujuan Pengeluaran

Aplikasi bukan sistem akuntansi.

Tidak menggunakan:

- Jurnal
- COA
- Ledger
- Neraca
- Laba Rugi

---

# AKTOR

1. Admin

2. Ketua Yayasan

3. Bendahara Yayasan

4. Staf TU

5. PJ Infaq

---

# UNIT YAYASAN

- RA
- MI
- MTs
- Unit Usaha

---

# SUMBER DANA

- SPP
- BOS
- LKS
- Seragam
- Unit Usaha
- Dana Infaq

---

# POSISI DANA

Dana dapat berada pada tiga posisi.

DI TU

↓

DI BENDAHARA

↓

DI BANK

Dashboard selalu menampilkan posisi dana berdasarkan status tersebut.

---

# WORKFLOW RAPBS

Admin

↓

Menyusun RAPBS

↓

Status

DRAFT

↓

Ajukan Persetujuan

↓

MENUNGGU PERSETUJUAN

↓

Ketua Yayasan

↓

APPROVE

atau

REJECT

↓

Jika APPROVE

↓

Status

AKTIF

↓

RAPBS dapat digunakan untuk transaksi.

Jika REJECT

↓

Kembali ke Admin untuk diperbaiki.

---

# WORKFLOW PEMASUKAN

Staf TU

↓

Input Pemasukan

↓

Status Dana

DI_TU

↓

Dana diterima Bendahara

↓

Status

DI_BENDAHARA

↓

Dana disetor ke Bank

↓

Status

DI_BANK

↓

Selesai

Catatan:

Satu transaksi tetap menggunakan satu dokumen.

Hanya status yang berubah.

---

# WORKFLOW DANA INFAQ

PJ Infaq

↓

Input Dana Infaq

↓

Verifikasi (opsional)

↓

Selesai

Dana Infaq tidak melalui TU maupun Bendahara.

Tetap dihitung pada Dashboard Yayasan.

---

# WORKFLOW PENGAJUAN PENGELUARAN

Bendahara Yayasan

↓

Membuat Pengajuan Pengeluaran

↓

Status

DRAFT

↓

Kirim Approval

↓

MENUNGGU_APPROVAL

↓

Ketua Yayasan

↓

APPROVE

atau

REJECT

Jika REJECT

↓

Status

REJECTED

↓

Bendahara memperbaiki atau membatalkan.

Jika APPROVE

↓

Status

APPROVED

↓

Belum mengurangi saldo Bank.

---

# WORKFLOW REALISASI PENGELUARAN

Setelah pengajuan berstatus APPROVED.

↓

Bendahara melakukan pembayaran.

↓

Status

DIREALISASIKAN

↓

Saldo Bank berkurang.

↓

Dashboard diperbarui.

↓

Selesai

---

# WORKFLOW DASHBOARD

Dashboard mengambil data otomatis.

Tidak ada input manual.

Dashboard menampilkan.

## Saldo

Saldo TU

Saldo Bendahara

Saldo Bank

Dana Infaq

---

## RAPBS

Target Pemasukan

Realisasi Pemasukan

Target Pengeluaran

Realisasi Pengeluaran

Sisa Anggaran

Persentase Realisasi

---

## Approval

Jumlah Pengajuan Menunggu Persetujuan

---

## Aktivitas

10 transaksi terbaru

---

# WORKFLOW LOGIN

User Login

↓

Firebase Authentication

↓

Sistem membaca Role

↓

Role menentukan menu yang tampil.

---

# HAK AKSES

## Admin

Dashboard

Master Data

RAPBS

Pemasukan

Pengeluaran

Approval (monitoring)

Laporan

User

Settings

---

## Ketua Yayasan

Dashboard

Approval RAPBS

Approval Pengeluaran

Laporan

Tidak dapat mengubah transaksi.

---

## Bendahara Yayasan

Dashboard

Menerima Dana dari TU

Setor ke Bank

Membuat Pengajuan Pengeluaran

Realisasi Pengeluaran

Laporan

---

## Staf TU

Dashboard

Input Pemasukan

Serah Terima ke Bendahara

Riwayat Transaksi

---

## PJ Infaq

Dashboard

Input Dana Infaq

Riwayat Dana Infaq

---

# BUSINESS RULES

## 1

Seluruh transaksi harus memiliki Tahun Anggaran.

---

## 2

Seluruh transaksi harus memiliki Unit.

---

## 3

Seluruh transaksi harus memiliki User Pembuat.

---

## 4

Dana tidak boleh langsung berpindah dari TU ke Bank.

Harus melalui Bendahara.

---

## 5

Dana Infaq tidak melalui workflow TU.

---

## 6

Pengeluaran hanya boleh menggunakan saldo Bank.

---

## 7

Pengeluaran tidak boleh melebihi saldo Bank.

---

## 8

Pengeluaran tidak boleh direalisasikan sebelum disetujui Ketua Yayasan.

---

## 9

Ketua Yayasan tidak melakukan input transaksi.

Hanya melakukan persetujuan.

---

## 10

Admin dapat melakukan koreksi transaksi dengan Audit Trail.

---

## 11

Semua perubahan status wajib tercatat.

---

## 12

Tidak ada Hard Delete.

Semua menggunakan Soft Delete.

---

# STATE MACHINE

RAPBS

DRAFT

↓

MENUNGGU_PERSETUJUAN

↓

AKTIF

↓

DITUTUP

atau

↓

REJECTED

---

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

---

# PRINSIP PENGEMBANGAN

Semua fitur baru harus mengikuti prinsip berikut.

1.

Business Workflow tidak boleh berubah tanpa persetujuan Product Owner.

2.

Satu transaksi = satu dokumen Firestore.

3.

Workflow direpresentasikan melalui perubahan status.

4.

Tidak membuat collection baru jika hanya terjadi perubahan status.

5.

Dashboard selalu membaca data berdasarkan status transaksi.

6.

Role menentukan hak akses terhadap perubahan status.

7.

Seluruh perubahan wajib memiliki Audit Trail.

8.

Kesederhanaan lebih diutamakan daripada kompleksitas.

9.

Fokus utama aplikasi adalah transparansi keuangan yayasan.

10.

Developer maupun AI tidak boleh menambah fitur di luar ruang lingkup tanpa persetujuan Product Owner.

---

# ROADMAP MODUL

Sprint 1
Authentication & Role

Sprint 2
Master Data

Sprint 3
RAPBS

Sprint 4
Pemasukan

Sprint 5
Perpindahan Dana (TU → Bendahara → Bank)

Sprint 6
Pengajuan Pengeluaran

Sprint 7
Approval Ketua Yayasan

Sprint 8
Realisasi Pengeluaran

Sprint 9
Dashboard

Sprint 10
Laporan & Audit Trail

Sprint 11
Testing

Sprint 12
Deployment