// State Machine Pemasukan
// DI_TU → DI_BENDAHARA → DI_BANK → SELESAI
// Prinsip: One Transaction = One Document
// JANGAN membuat collection serah_terima atau setoran_bank

export type StatusDana = "DI_TU" | "DI_BENDAHARA" | "DI_BANK" | "SELESAI";

export interface Pemasukan {
  id: string;
  tanggal: string; // ISO date string
  tahunAnggaranId: string;
  tahunAnggaranNama?: string; // denormalized
  unitId: string;
  unitNama?: string; // denormalized
  rapbsId?: string | null;
  rapbsNama?: string | null; // denormalized
  sumberDanaId: string;
  sumberDanaNama?: string; // denormalized
  nominal: number;
  keterangan?: string | null;
  statusDana: StatusDana;

  // Metadata pembuat
  inputBy?: string | null;
  inputByNama?: string | null;

  // Field Serah Terima TU → Bendahara (tidak perlu collection terpisah)
  diserahkanAt?: string | null;
  diserahkanBy?: string | null;
  diserahkanByNama?: string | null;
  diterimaBy?: string | null;
  diterimaByNama?: string | null;
  catatanSerahTerima?: string | null;

  // Field Setor Bank (tidak perlu collection terpisah)
  disetorAt?: string | null;
  disetorBy?: string | null;
  disetorByNama?: string | null;
  namaBank?: string | null;
  nomorReferensi?: string | null;
  catatanSetoran?: string | null;

  // Audit
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any | null;
  deletedBy?: string | null;
}

// Valid state transitions
export const PEMASUKAN_TRANSITIONS: Record<StatusDana, StatusDana[]> = {
  DI_TU: ["DI_BENDAHARA"],
  DI_BENDAHARA: ["DI_BANK"],
  DI_BANK: ["SELESAI"],
  SELESAI: [],
};

export const STATUS_DANA_LABELS: Record<StatusDana, string> = {
  DI_TU: "Di TU",
  DI_BENDAHARA: "Di Bendahara",
  DI_BANK: "Di Bank",
  SELESAI: "Selesai",
};

export const STATUS_DANA_COLORS: Record<StatusDana, string> = {
  DI_TU: "bg-orange-50 text-orange-700 ring-orange-500/20",
  DI_BENDAHARA: "bg-blue-50 text-blue-700 ring-blue-500/20",
  DI_BANK: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  SELESAI: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

export const STATUS_DANA_STEP: Record<StatusDana, number> = {
  DI_TU: 1,
  DI_BENDAHARA: 2,
  DI_BANK: 3,
  SELESAI: 4,
};
