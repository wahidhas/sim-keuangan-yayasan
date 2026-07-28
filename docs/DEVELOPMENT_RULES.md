# DEVELOPMENT_RULES.md
# SIM KEUANGAN YAYASAN
Version 1.0

---

# TUJUAN

Dokumen ini berisi aturan resmi pengembangan aplikasi.

Seluruh developer dan AI Assistant wajib mengikuti aturan ini.

Business Workflow tidak boleh diubah tanpa persetujuan Product Owner.

---

# FILOSOFI

Prioritas utama aplikasi adalah:

1. Sederhana
2. Transparan
3. Mudah digunakan
4. Cepat
5. Mudah dipelihara

Bukan membuat aplikasi dengan fitur sebanyak mungkin.

---

# RUANG LINGKUP

Aplikasi hanya menangani:

- RAPBS
- Pemasukan
- Perpindahan Dana
- Pengajuan Pengeluaran
- Approval
- Realisasi Pengeluaran
- Dashboard
- Laporan

Selain itu dianggap di luar scope.

---

# LARANGAN

JANGAN membuat:

- Sistem Akuntansi
- ERP
- Payroll
- Inventory
- Asset Management
- Purchase Order
- COA
- Jurnal
- Buku Besar
- Neraca
- Laba Rugi
- Pajak
- Multi Currency
- Multi Company

Kecuali ada permintaan resmi dari Product Owner.

---

# PRINSIP PENGEMBANGAN

## 1

Business Workflow adalah prioritas.

Kode harus mengikuti workflow.

Bukan sebaliknya.

---

## 2

Jangan mengubah Business Workflow tanpa izin.

---

## 3

Jangan menambah fitur baru tanpa izin.

---

## 4

Jangan menghapus fitur yang sudah ada.

---

## 5

Jangan mengubah nama menu tanpa izin.

---

## 6

Jangan mengubah Role tanpa izin.

---

## 7

Jangan mengubah hak akses tanpa izin.

---

# ARSITEKTUR

Gunakan:

Next.js App Router

TypeScript

Tailwind CSS

Firebase Authentication

Cloud Firestore

Firebase Storage (Fitur ditunda untuk fase berikutnya)

---

# MOBILE FIRST

Aplikasi dirancang Mobile First.

Desktop adalah versi adaptasi.

Prioritas layout:

1.

Mobile

2.

Tablet

3.

Desktop

---

# UI PRINCIPLE

Gunakan:

- Material Design 3
- Clean
- Minimal
- Modern
- Responsive

---

# LAYOUT

Desktop

Sidebar

+

Topbar

+

Content

---

Mobile

Top App Bar

+

Bottom Navigation

+

Content

Sidebar berubah menjadi Drawer.

---

# BOTTOM NAVIGATION

Hanya menu utama.

Dashboard

Pemasukan

Pengeluaran

Laporan

Lainnya

---

# DASHBOARD

Dashboard harus sederhana.

Tidak lebih dari:

Saldo TU

Saldo Bendahara

Saldo Bank

Dana Infaq

Target RAPBS

Realisasi

Sisa Anggaran

Approval Pending

Aktivitas Terakhir

---

# FIRESTORE PRINCIPLE

Gunakan

One Transaction = One Document

Jangan membuat dokumen baru hanya karena status berubah.

---

# STATE MACHINE

Seluruh modul menggunakan State Machine.

Status berubah.

Dokumen tetap.

---

# SOFT DELETE

Gunakan:

deletedAt

deletedBy

Tidak boleh Hard Delete.

---

# AUDIT TRAIL

Seluruh perubahan penting harus mencatat:

createdBy

updatedBy

createdAt

updatedAt

Tidak boleh ada transaksi anonim.

---

# SECURITY

Gunakan Firebase Authentication.

Gunakan Firestore Security Rules.

Seluruh akses berdasarkan Role.

---

# ROLE BASED ACCESS

Role menentukan:

Menu

Halaman

Button

Action

Query Database

---

# PERFORMANCE

Gunakan:

Pagination

Lazy Loading

Dynamic Import

Optimized Query

---

# FIRESTORE QUERY

Gunakan Query sederhana.

Hindari nested query.

Gunakan Composite Index bila diperlukan.

---

# COMPONENT

Gunakan reusable component.

Contoh:

Button

Card

Modal

Input

Select

Badge

Dialog

Table

Pagination

---

# FORM

Gunakan React Hook Form.

Gunakan Zod Validation.

---

# ERROR HANDLING

Gunakan:

Loading

Empty State

Error State

Success Message

Semua request harus memiliki feedback.

---

# CODING STYLE

Gunakan:

camelCase

PascalCase

TypeScript Strict Mode

Tidak menggunakan any kecuali benar-benar diperlukan.

---

# FOLDER STRUCTURE

app/

components/

features/

lib/

hooks/

services/

types/

utils/

firebase/

styles/

---

# SERVICE LAYER

Business Logic tidak boleh berada di UI.

Gunakan Service Layer.

---

# UI RULE

Jangan mengubah tampilan sekaligus Business Logic.

Jika task adalah UI,

maka hanya UI yang boleh berubah.

---

# BUSINESS RULE

Business Rule berada di Service.

Bukan di Component.

---

# DATABASE

Firestore menjadi Single Source of Truth.

Jangan menyimpan data ganda.

---

# STATUS

Semua proses menggunakan Status.

Bukan membuat Collection baru.

---

# TESTING

Setiap fitur harus diuji:

Happy Path

Invalid Input

Permission

Role

Edge Case

---

# SEBELUM CODING

AI wajib membaca:

PROJECT_KNOWLEDGE.md

BUSINESS_WORKFLOW.md

DATABASE_SCHEMA.md

DEVELOPMENT_RULES.md

Sebelum membuat perubahan.

---

# SAAT MENGUBAH KODE

AI wajib menjelaskan:

1.

File yang akan diubah.

2.

Alasan perubahan.

3.

Dampak perubahan.

4.

Apakah mempengaruhi Database.

5.

Apakah mempengaruhi Workflow.

---

# JIKA TASK ADALAH UI

Maka:

JANGAN mengubah:

Business Logic

Authentication

Database

Firestore

Role

Workflow

Function

API

Service

Hanya boleh mengubah:

HTML

Tailwind

Layout

Spacing

Typography

Icon

Animation

Responsive Layout

---

# JIKA TASK ADALAH DATABASE

Jangan mengubah:

Workflow

Role

UI

Kecuali diminta.

---

# JIKA TASK ADALAH WORKFLOW

Jangan mengubah:

Database

UI

Authentication

Kecuali diminta.

---

# CHANGE MANAGEMENT

Setiap perubahan harus mengikuti prinsip:

Perubahan kecil.

Perubahan terukur.

Perubahan dapat diuji.

Hindari refactor besar dalam satu sprint.

---

# SPRINT RULE

Satu Sprint hanya memiliki satu tujuan utama.

Contoh:

Sprint 4

Hanya Pemasukan.

Tidak boleh mengerjakan Dashboard.

Tidak boleh mengubah Login.

Tidak boleh mengubah RAPBS.

---

# KOMPATIBILITAS

Perubahan baru tidak boleh merusak fitur yang sudah berjalan.

Backward Compatibility wajib dijaga.

---

# DEFINITION OF DONE

Sebuah Sprint dianggap selesai jika:

✅ Fitur berjalan.

✅ Tidak merusak fitur lain.

✅ Mobile Responsive.

✅ Role berjalan.

✅ Firestore aman.

✅ Tidak ada Error Console.

✅ Tidak ada TypeScript Error.

✅ Tidak ada Build Error.

---

# PRINSIP TERAKHIR

Kesederhanaan lebih penting daripada kompleksitas.

Stabilitas lebih penting daripada fitur baru.

Business Workflow lebih penting daripada implementasi teknis.

Jika ragu, ikuti Business Workflow.

Jika masih ragu, tanyakan Product Owner.

Jangan mengambil keputusan bisnis sendiri.