export interface TahunAnggaran {
  id: string;
  nama: string; // e.g. "2026-2027"
  isActive: boolean;
  keterangan?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any | null;
  deletedBy?: string | null;
}

export interface UnitYayasan {
  id: string;
  kode: string; // e.g. "RA", "MI", "MTS", "UU"
  nama: string; // e.g. "RA Perwanida"
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any | null;
  deletedBy?: string | null;
}

export interface SumberDana {
  id: string;
  nama: string; // SPP, BOS, LKS, Seragam, Unit Usaha, Dana Infaq
  isActive: boolean;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any | null;
  deletedBy?: string | null;
}

export interface KategoriPengeluaran {
  id: string;
  nama: string; // Honor, ATK, Operasional, Sarana, Transport, Listrik, Air, Internet, Program, Lainnya
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any | null;
  deletedBy?: string | null;
}
