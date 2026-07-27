// Status State Machine RAPBS
// DRAFT → MENUNGGU_APPROVAL → APPROVED → DITUTUP
// DRAFT → MENUNGGU_APPROVAL → REJECTED (kembali ke Admin)

export type StatusRapbs =
  | "DRAFT"
  | "MENUNGGU_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "DITUTUP";

export type JenisRapbs = "PEMASUKAN" | "PENGELUARAN";

export interface Rapbs {
  id: string;
  tahunAnggaranId: string;
  tahunAnggaranNama?: string; // denormalized for display
  unitId: string;
  unitNama?: string; // denormalized for display
  jenis: JenisRapbs;
  sumberDanaId?: string | null; // nullable, hanya untuk PEMASUKAN
  sumberDanaNama?: string | null; // denormalized
  kategoriPengeluaranId?: string | null; // nullable, hanya untuk PENGELUARAN
  kategoriPengeluaranNama?: string | null; // denormalized
  namaProgram: string;
  target: number;
  keterangan?: string | null;
  status: StatusRapbs;
  approvedBy?: string | null;
  approvedAt?: any | null;
  approvedNote?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: any | null;
  rejectedNote?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any | null;
  deletedBy?: string | null;
}

// Valid state transitions
export const RAPBS_TRANSITIONS: Record<StatusRapbs, StatusRapbs[]> = {
  DRAFT: ["MENUNGGU_APPROVAL"],
  MENUNGGU_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["DITUTUP"],
  REJECTED: ["DRAFT"],
  DITUTUP: [],
};

export const STATUS_RAPBS_LABELS: Record<StatusRapbs, string> = {
  DRAFT: "Draft",
  MENUNGGU_APPROVAL: "Menunggu Persetujuan",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  DITUTUP: "Ditutup",
};

export const STATUS_RAPBS_COLORS: Record<StatusRapbs, string> = {
  DRAFT: "bg-gray-100 text-gray-700 ring-gray-500/20",
  MENUNGGU_APPROVAL: "bg-amber-50 text-amber-700 ring-amber-500/20",
  APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-500/20",
  DITUTUP: "bg-slate-100 text-slate-600 ring-slate-500/20",
};
