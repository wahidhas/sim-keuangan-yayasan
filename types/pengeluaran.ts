// State Machine Pengajuan Pengeluaran
// DRAFT → MENUNGGU_APPROVAL → APPROVED → DIREALISASIKAN → SELESAI
//                           ↘ REJECTED
// Prinsip: One Transaction = One Document
// JANGAN membuat collection realisasi_pengeluaran

export type StatusPengeluaran =
  | "DRAFT"
  | "MENUNGGU_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "DIREALISASIKAN"
  | "SELESAI";

export type MetodePembayaran = "TUNAI" | "TRANSFER" | "CEK";

export interface PengajuanPengeluaran {
  id: string;
  tanggal: string; // ISO date string
  tahunAnggaranId: string;
  tahunAnggaranNama?: string; // denormalized
  unitId: string;
  unitNama?: string; // denormalized
  rapbsId?: string | null;
  rapbsNama?: string | null; // denormalized
  kategoriPengeluaranId: string;
  kategoriPengeluaranNama?: string; // denormalized
  nominal: number;
  penerima: string; // nama penerima pembayaran
  metodePembayaran: MetodePembayaran;
  keterangan?: string | null;
  lampiran?: string | null; // URL Firebase Storage

  // State Machine
  status: StatusPengeluaran;

  // Approval Fields
  approvalBy?: string | null;
  approvalByNama?: string | null;
  approvalAt?: string | null;
  approvalNote?: string | null;

  // Realisasi Fields (bagian dari dokumen yang sama — ONE DOCUMENT)
  realisasiAt?: string | null;
  dibayarOleh?: string | null;
  dibayarOlehNama?: string | null;
  nomorBukti?: string | null;
  catatanRealisasi?: string | null;

  // Audit
  createdBy?: string | null;
  createdByNama?: string | null;
  updatedBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any | null;
  deletedBy?: string | null;
}

// Valid state transitions
export const PENGELUARAN_TRANSITIONS: Record<StatusPengeluaran, StatusPengeluaran[]> = {
  DRAFT: ["MENUNGGU_APPROVAL"],
  MENUNGGU_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["DIREALISASIKAN"],
  REJECTED: ["DRAFT"], // Bisa diperbaiki dan diajukan lagi
  DIREALISASIKAN: ["SELESAI"],
  SELESAI: [],
};

export const STATUS_PENGELUARAN_LABELS: Record<StatusPengeluaran, string> = {
  DRAFT: "Draft",
  MENUNGGU_APPROVAL: "Menunggu Persetujuan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  DIREALISASIKAN: "Direalisasikan",
  SELESAI: "Selesai",
};

export const STATUS_PENGELUARAN_COLORS: Record<StatusPengeluaran, string> = {
  DRAFT: "bg-gray-100 text-gray-700 ring-gray-500/20",
  MENUNGGU_APPROVAL: "bg-amber-50 text-amber-700 ring-amber-500/20",
  APPROVED: "bg-blue-50 text-blue-700 ring-blue-500/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-500/20",
  DIREALISASIKAN: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  SELESAI: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export const METODE_PEMBAYARAN_LABELS: Record<MetodePembayaran, string> = {
  TUNAI: "Kas Bendahara (Tunai)",
  TRANSFER: "Rekening Bank Yayasan",
  CEK: "Cek / Giro Bank",
};
