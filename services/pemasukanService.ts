import { db } from "@/firebase/config";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  Pemasukan,
  StatusDana,
  PEMASUKAN_TRANSITIONS,
} from "@/types/pemasukan";

const STORAGE_KEY = "sim_pemasukan";

const isDemoEnv = (): boolean =>
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("demo");

const getLocal = (): Pemasukan[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocal = (data: Pemasukan[]): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("localStorage error:", e);
    }
  }
};

// Seed data demo
const seedPemasukan = (): Pemasukan[] => [
  {
    id: "pms-1",
    tanggal: "2026-07-10",
    tahunAnggaranId: "ta-2",
    tahunAnggaranNama: "2026-2027",
    unitId: "u-2",
    unitNama: "MI Al-Hikmah",
    rapbsId: "rapbs-1",
    rapbsNama: "SPP Siswa MI 2026-2027",
    sumberDanaId: "sd-1",
    sumberDanaNama: "SPP",
    nominal: 10000000,
    keterangan: "SPP Juli 2026 - 50 siswa",
    statusDana: "DI_BANK",
    inputBy: "u-tu",
    inputByNama: "Budi Santoso",
    diserahkanAt: "2026-07-11T08:00:00.000Z",
    diserahkanBy: "u-tu",
    diserahkanByNama: "Budi Santoso",
    diterimaBy: "u-bendahara",
    diterimaByNama: "Siti Rahmah",
    disetorAt: "2026-07-12T09:00:00.000Z",
    disetorBy: "u-bendahara",
    disetorByNama: "Siti Rahmah",
    namaBank: "Bank BRI",
    nomorReferensi: "TRF202607120001",
    createdBy: "u-tu",
    createdAt: "2026-07-10T07:00:00.000Z",
    updatedAt: "2026-07-12T09:00:00.000Z",
    deletedAt: null,
  },
  {
    id: "pms-2",
    tanggal: "2026-07-15",
    tahunAnggaranId: "ta-2",
    tahunAnggaranNama: "2026-2027",
    unitId: "u-3",
    unitNama: "MTs Al-Hikmah",
    sumberDanaId: "sd-2",
    sumberDanaNama: "BOS",
    nominal: 8500000,
    keterangan: "Dana BOS Triwulan III",
    statusDana: "DI_BENDAHARA",
    inputBy: "u-tu",
    inputByNama: "Budi Santoso",
    diserahkanAt: "2026-07-16T08:30:00.000Z",
    diserahkanBy: "u-tu",
    diserahkanByNama: "Budi Santoso",
    diterimaBy: "u-bendahara",
    diterimaByNama: "Siti Rahmah",
    createdBy: "u-tu",
    createdAt: "2026-07-15T07:00:00.000Z",
    updatedAt: "2026-07-16T08:30:00.000Z",
    deletedAt: null,
  },
  {
    id: "pms-3",
    tanggal: "2026-07-20",
    tahunAnggaranId: "ta-2",
    tahunAnggaranNama: "2026-2027",
    unitId: "u-1",
    unitNama: "RA Perwanida",
    sumberDanaId: "sd-3",
    sumberDanaNama: "LKS",
    nominal: 3200000,
    keterangan: "Penjualan LKS semester ganjil",
    statusDana: "DI_TU",
    inputBy: "u-tu",
    inputByNama: "Budi Santoso",
    createdBy: "u-tu",
    createdAt: "2026-07-20T07:30:00.000Z",
    updatedAt: "2026-07-20T07:30:00.000Z",
    deletedAt: null,
  },
];

export const pemasukanService = {
  // Fetch all pemasukan (not deleted)
  async getPemasukanList(filters?: {
    tahunAnggaranId?: string;
    statusDana?: StatusDana;
    unitId?: string;
  }): Promise<Pemasukan[]> {
    if (isDemoEnv()) {
      let local = getLocal();
      if (local.length === 0) {
        local = seedPemasukan();
        setLocal(local);
      }
      let result = local.filter((p) => !p.deletedAt);
      if (filters?.tahunAnggaranId) {
        result = result.filter((p) => p.tahunAnggaranId === filters.tahunAnggaranId);
      }
      if (filters?.statusDana) {
        result = result.filter((p) => p.statusDana === filters.statusDana);
      }
      if (filters?.unitId) {
        result = result.filter((p) => p.unitId === filters.unitId);
      }
      return result.sort((a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }

    try {
      const constraints: any[] = [where("deletedAt", "==", null)];
      if (filters?.tahunAnggaranId) {
        constraints.push(where("tahunAnggaranId", "==", filters.tahunAnggaranId));
      }
      if (filters?.statusDana) {
        constraints.push(where("statusDana", "==", filters.statusDana));
      }
      constraints.push(orderBy("createdAt", "desc"));
      const q = query(collection(db, "pemasukan"), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Pemasukan));
    } catch (error) {
      console.warn("Firestore offline, fallback to local pemasukan");
      let local = getLocal();
      if (local.length === 0) {
        local = seedPemasukan();
        setLocal(local);
      }
      return local.filter((p) => !p.deletedAt);
    }
  },

  // Get single pemasukan by ID
  async getPemasukanById(id: string): Promise<Pemasukan | null> {
    const local = getLocal();
    const found = local.find((p) => p.id === id);
    if (found) return found;

    if (!isDemoEnv()) {
      try {
        const docSnap = await getDoc(doc(db, "pemasukan", id));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Pemasukan;
        }
      } catch (e) {
        console.warn("Firestore offline:", e);
      }
    }
    return null;
  },

  // Add new pemasukan (status awal selalu DI_TU sesuai workflow)
  async addPemasukan(
    data: Omit<Pemasukan, "id" | "statusDana" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy">,
    userId: string,
    userName?: string
  ): Promise<string> {
    const newId = `pms-${Date.now()}`;
    const newDoc: Pemasukan = {
      ...data,
      id: newId,
      statusDana: "DI_TU", // selalu dimulai dari DI_TU
      inputBy: userId,
      inputByNama: userName || null,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      deletedBy: null,
    };

    const local = getLocal();
    local.unshift(newDoc);
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        const newRef = doc(collection(db, "pemasukan"));
        await setDoc(newRef, {
          ...newDoc,
          id: newRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline addPemasukan:", e);
      }
    }
    return newId;
  },

  // Serah terima TU → Bendahara (DI_TU → DI_BENDAHARA)
  async serahKerinaBendahara(
    id: string,
    userId: string,
    userName: string,
    penerimaNama: string,
    catatan?: string
  ): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pemasukan tidak ditemukan");
    if (local[idx].statusDana !== "DI_TU") {
      throw new Error("Dana harus berstatus DI_TU untuk diserahterimakan");
    }

    local[idx] = {
      ...local[idx],
      statusDana: "DI_BENDAHARA",
      diserahkanAt: new Date().toISOString(),
      diserahkanBy: userId,
      diserahkanByNama: userName,
      diterimaByNama: penerimaNama,
      catatanSerahTerima: catatan || null,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pemasukan", id), {
          statusDana: "DI_BENDAHARA",
          diserahkanAt: serverTimestamp(),
          diserahkanBy: userId,
          diserahkanByNama: userName,
          diterimaByNama: penerimaNama,
          catatanSerahTerima: catatan || null,
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline serahKerinaBendahara:", e);
      }
    }
  },

  // Setor Bank (DI_BENDAHARA → DI_BANK)
  async setorKeBank(
    id: string,
    userId: string,
    userName: string,
    namaBank: string,
    nomorReferensi?: string,
    catatan?: string
  ): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pemasukan tidak ditemukan");
    if (local[idx].statusDana !== "DI_BENDAHARA") {
      throw new Error("Dana harus berstatus DI_BENDAHARA untuk disetor ke Bank");
    }

    local[idx] = {
      ...local[idx],
      statusDana: "DI_BANK",
      disetorAt: new Date().toISOString(),
      disetorBy: userId,
      disetorByNama: userName,
      namaBank,
      nomorReferensi: nomorReferensi || null,
      catatanSetoran: catatan || null,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pemasukan", id), {
          statusDana: "DI_BANK",
          disetorAt: serverTimestamp(),
          disetorBy: userId,
          disetorByNama: userName,
          namaBank,
          nomorReferensi: nomorReferensi || null,
          catatanSetoran: catatan || null,
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline setorKeBank:", e);
      }
    }
  },

  // Soft delete (hanya DI_TU yang dapat dihapus)
  async deletePemasukan(id: string, userId: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pemasukan tidak ditemukan");
    if (local[idx].statusDana !== "DI_TU") {
      throw new Error("Hanya pemasukan berstatus DI_TU yang dapat dihapus");
    }

    local[idx] = {
      ...local[idx],
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pemasukan", id), {
          deletedAt: serverTimestamp(),
          deletedBy: userId,
        });
      } catch (e) {
        console.warn("Firestore offline deletePemasukan:", e);
      }
    }
  },

  // Summary for Dashboard calculations
  async getSaldoSummary(tahunAnggaranId?: string): Promise<{
    saldoTU: number;
    saldoBendahara: number;
    saldoBank: number;
    totalPemasukan: number;
  }> {
    const all = await this.getPemasukanList({ tahunAnggaranId });
    const saldoTU = all
      .filter((p) => p.statusDana === "DI_TU")
      .reduce((s, p) => s + p.nominal, 0);
    const saldoBendahara = all
      .filter((p) => p.statusDana === "DI_BENDAHARA")
      .reduce((s, p) => s + p.nominal, 0);
    const saldoBank = all
      .filter((p) => p.statusDana === "DI_BANK" || p.statusDana === "SELESAI")
      .reduce((s, p) => s + p.nominal, 0);
    const totalPemasukan = all.reduce((s, p) => s + p.nominal, 0);

    return { saldoTU, saldoBendahara, saldoBank, totalPemasukan };
  },

  // Get pending untuk Bendahara (DI_TU siap diserahkan)
  async getPendingSerahTerima(): Promise<Pemasukan[]> {
    return this.getPemasukanList({ statusDana: "DI_TU" });
  },

  // Get pending untuk Setor Bank (DI_BENDAHARA)
  async getPendingSetorBank(): Promise<Pemasukan[]> {
    return this.getPemasukanList({ statusDana: "DI_BENDAHARA" });
  },
};
