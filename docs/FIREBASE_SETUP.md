# FIREBASE_SETUP.md
# SIM KEUANGAN YAYASAN

---

# PHASE 1 (MVP) ARSITEKTUR

Digunakan:

✓ Firebase Authentication
✓ Cloud Firestore

Tidak digunakan:

✗ Firebase Storage (Fitur ditunda untuk fase berikutnya)
✗ Cloud Functions (Fitur ditunda untuk fase berikutnya)

---

# ALASAN KEPUTUSAN ARSITEKTUR

- Project menggunakan Firebase Spark Plan (Gratis).
- Firebase Storage membutuhkan upgrade ke Blaze Plan.
- Prioritas proyek adalah menyelesaikan seluruh fitur bisnis inti terlebih dahulu.
- Upload dokumen/file dapat ditambahkan pada fase berikutnya.

---

# BUKTI TRANSAKSI (MVP)

Bukti transaksi tidak di-upload sebagai file pada MVP.

Sebagai pengganti, simpan data tekstual pada dokumen:

- Nomor Bukti / Nomor Kwitansi
- Nomor Referensi / Nomor Transfer Bank
- Catatan Transaksi

Jika di masa depan diperlukan lampiran digital:

- Google Drive Link (opsional, disimpan sebagai string)
- Firebase Storage (fase berikutnya)

---

# ARSITEKTUR FIREBASE YANG DIGUNAKAN

## Firebase Authentication
- Login pengguna
- Role Management

## Cloud Firestore
- Master Data (Tahun Anggaran, Unit, Sumber Dana, Kategori Pengeluaran, Users)
- RAPBS
- Pemasukan
- Pengeluaran
- Approval
- Dashboard
- Laporan
- Audit Log
- Settings (Profil Yayasan)