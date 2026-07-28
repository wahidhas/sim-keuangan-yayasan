# AI_INSTRUCTIONS.md
# SIM KEUANGAN YAYASAN

---

# INSTRUKSI ARSITEKTUR FIREBASE PHASE 1 (MVP)

Setiap AI Assistant atau Developer wajib mematuhi aturan arsitektur berikut:

1. **Service Firebase MVP yang Aktif**:
   - ✓ **Firebase Authentication**: Login & Role Management.
   - ✓ **Cloud Firestore**: Single Source of Truth (Database utama).

2. **Service Firebase yang TIDAK DIGUNAKAN (Non-MVP)**:
   - ✗ **Firebase Storage**: Fitur ditunda untuk fase berikutnya (proyek menggunakan Spark Free Plan).
   - ✗ **Cloud Functions**: Fitur ditunda untuk fase berikutnya.

3. **Larangan Kode**:
   - Dilarang menginstal Firebase Storage SDK baru.
   - Dilarang membuat bucket Firebase Storage.
   - Dilarang membuat upload service, upload component, image preview, atau file management.
   - Field lampiran/bukti transaksi pada data model tetap dipertahankan sebagai `optional` / `nullable` untuk kompatibilitas masa depan, namun pada MVP bukti transaksi hanya dicatat menggunakan nomor bukti, nomor kwitansi, nomor referensi, dan keterangan tekstual.
