// Dana Infaq — Sesuai DATABASE_SCHEMA.md
// Dana Infaq TIDAK melalui TU maupun Bendahara (Business Rule #5)
// Alur sederhana: Input → (Verifikasi opsional) → Selesai
// Koleksi: infaq

export interface Infaq {
  id: string;
  tanggal: string; // ISO date string
  tahunAnggaranId: string;
  tahunAnggaranNama?: string; // denormalized
  nominal: number;
  donatur?: string | null; // nullable — bisa anonim
  keterangan?: string | null;
  inputBy?: string | null;
  inputByNama?: string | null;
  // Audit
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any | null;
  deletedBy?: string | null;
}

// Rekap bulanan untuk laporan
export interface InfaqBulanGroup {
  bulan: string; // "2026-07"
  bulanLabel: string; // "Juli 2026"
  total: number;
  jumlahTransaksi: number;
}
