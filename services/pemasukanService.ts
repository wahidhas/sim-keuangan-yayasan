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
import { pengeluaranService } from "@/services/pengeluaranService";

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

export const pemasukanService = {
  // Fetch all pemasukan (not deleted)
  async getPemasukanList(filters?: {
    tahunAnggaranId?: string;
    statusDana?: StatusDana;
    unitId?: string;
  }): Promise<Pemasukan[]> {
    let result: Pemasukan[] = [];
    if (isDemoEnv()) {
      result = getLocal();
    } else {
      try {
        const snap = await getDocs(collection(db, "pemasukan"));
        result = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pemasukan));
      } catch (e) {
        console.warn("Firestore offline, fallback to local pemasukan:", e);
        result = getLocal();
      }
    }

    result = result.filter((p) => !p.deletedAt);
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
  },

  // Get single by ID
  async getPemasukanById(id: string): Promise<Pemasukan | null> {
    const local = getLocal();
    const found = local.find((p) => p.id === id);
    if (found) return found;

    if (!isDemoEnv()) {
      try {
        const snap = await getDoc(doc(db, "pemasukan", id));
        if (snap.exists()) {
          return { id: snap.id, ...snap.data() } as Pemasukan;
        }
      } catch (e) {
        console.warn("Firestore error getPemasukanById:", e);
      }
    }
    return null;
  },

  // Add new Pemasukan (Status default: DI_BENDAHARA)
  async addPemasukan(
    data: Omit<
      Pemasukan,
      | "id"
      | "statusDana"
      | "createdAt"
      | "updatedAt"
      | "deletedAt"
      | "deletedBy"
    > & { statusDana?: StatusDana },
    userId: string,
    userName?: string
  ): Promise<string> {
    const newId = `pms-${Date.now()}`;
    const newDoc: Pemasukan = {
      ...data,
      id: newId,
      statusDana: data.statusDana || "DI_BENDAHARA",
      inputBy: userId,
      inputByNama: userName || null,
      createdBy: userId,
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
        const ref = doc(collection(db, "pemasukan"));
        await setDoc(ref, {
          ...newDoc,
          id: ref.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline addPemasukan:", e);
      }
    }
    return newId;
  },

  // Edit Pemasukan (hanya jika status DI_TU)
  // Edit Pemasukan
  async updatePemasukan(
    id: string,
    data: Partial<Pemasukan>,
    userId: string
  ): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx !== -1) {
      local[idx] = {
        ...local[idx],
        ...data,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      };
      setLocal(local);
    }

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pemasukan", id), {
          ...data,
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore updatePemasukan error:", e);
      }
    }
  },

  // State Transition 1: DI_TU → DI_BENDAHARA (Serah Terima)
  async serahTerimaKeBendahara(
    pemasukanId: string,
    userId: string,
    userName: string
  ): Promise<void> {
    const nowIso = new Date().toISOString();

    const local = getLocal();
    const idx = local.findIndex((p) => p.id === pemasukanId);
    if (idx !== -1) {
      local[idx] = {
        ...local[idx],
        statusDana: "DI_BENDAHARA",
        diserahkanAt: nowIso,
        diterimaBy: userId,
        diterimaByNama: userName,
        updatedAt: nowIso,
      };
      setLocal(local);
    }

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pemasukan", pemasukanId), {
          statusDana: "DI_BENDAHARA",
          diserahkanAt: serverTimestamp(),
          diterimaBy: userId,
          diterimaByNama: userName,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore serahTerimaKeBendahara error:", e);
      }
    }
  },

  // State Transition 2: DI_BENDAHARA → DI_BANK (Setor Bank)
  async setorKeBank(
    pemasukanId: string,
    namaBank: string,
    nomorReferensi: string,
    userId: string,
    userName: string
  ): Promise<void> {
    const nowIso = new Date().toISOString();

    const local = getLocal();
    const idx = local.findIndex((p) => p.id === pemasukanId);
    if (idx !== -1) {
      local[idx] = {
        ...local[idx],
        statusDana: "DI_BANK",
        namaBank: namaBank || "Bank Yayasan",
        nomorReferensi: nomorReferensi || null,
        disetorAt: nowIso,
        disetorBy: userId,
        disetorByNama: userName,
        updatedAt: nowIso,
      };
      setLocal(local);
    }

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pemasukan", pemasukanId), {
          statusDana: "DI_BANK",
          namaBank: namaBank || "Bank Yayasan",
          nomorReferensi: nomorReferensi || null,
          disetorAt: serverTimestamp(),
          disetorBy: userId,
          disetorByNama: userName,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore setorKeBank error:", e);
      }
    }
  },

  // Soft delete
  async deletePemasukan(id: string, userId: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx !== -1) {
      local[idx] = {
        ...local[idx],
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
      };
      setLocal(local);
    }

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pemasukan", id), {
          deletedAt: serverTimestamp(),
          deletedBy: userId,
        });
      } catch (e) {
        console.warn("Firestore deletePemasukan error:", e);
      }
    }
  },

  // Single Source of Truth for Ledger & Balances
  async getSaldoSummary(tahunAnggaranId?: string): Promise<{
    saldoTU: number;
    saldoBendahara: number;
    saldoBank: number;
    totalPemasukan: number;
    isBalanced: boolean;
    imbalanceAmount: number;
  }> {
    // Always fetch complete ledger for physical cash position consistency
    const [allPemasukan, pengeluaranList] = await Promise.all([
      this.getPemasukanList(),
      pengeluaranService.getPengajuanList(),
    ]);

    // Level 2: Kas TU (Penerimaan TU yang belum disetor ke Bendahara)
    const tuReceipts = allPemasukan.filter(
      (p) =>
        p.transactionType === "TU_RECEIPT" ||
        (p.statusDana === "DI_TU" && p.transactionType !== "BANK_TRANSFER")
    );
    const saldoTU = tuReceipts.reduce((sum, p) => sum + p.nominal, 0);

    // Actual Income (Pemasukan Yayasan + Setoran TU)
    const actualIncome = allPemasukan.filter(
      (p) =>
        p.transactionType === "INCOME" ||
        p.transactionType === "TU_DEPOSIT" ||
        p.transactionType === "OPENING_BALANCE" ||
        (p.sumberDanaId !== "sd-bank" &&
          !p.sumberDanaNama?.startsWith("Setoran Bank:") &&
          p.statusDana !== "SETORAN_BANK")
    );

    // Internal Bank Transfers (Setor ke Bank)
    const bankDeposits = allPemasukan.filter(
      (p) =>
        p.transactionType === "BANK_TRANSFER" ||
        p.sumberDanaId === "sd-bank" ||
        p.sumberDanaNama?.startsWith("Setoran Bank:") ||
        p.statusDana === "SETORAN_BANK"
    );

    // Total Actual Income (Realisasi Pendapatan)
    const totalPemasukan = actualIncome.reduce((sum, p) => sum + p.nominal, 0);

    // Total Bank Transfers
    const totalSetoranBank = bankDeposits.reduce((sum, p) => sum + p.nominal, 0);

    // Realized Expenses
    const realizedPengeluaran = pengeluaranList.filter(
      (p) => p.status === "DIREALISASIKAN" || p.status === "SELESAI"
    );

    const pengeluaranBendahara = realizedPengeluaran
      .filter((p) => p.metodePembayaran === "TUNAI")
      .reduce((sum, p) => sum + p.nominal, 0);

    const pengeluaranBank = realizedPengeluaran
      .filter((p) => p.metodePembayaran !== "TUNAI")
      .reduce((sum, p) => sum + p.nominal, 0);

    const totalPengeluaran = pengeluaranBendahara + pengeluaranBank;

    // Saldo Kas Bendahara = Total Income - Total Setor Bank - Pengeluaran Kas Bendahara
    let saldoBendahara = totalPemasukan - totalSetoranBank - pengeluaranBendahara;
    if (saldoBendahara < 0) saldoBendahara = 0;

    // Saldo Rekening Bank = Total Setor Bank - Pengeluaran Rekening Bank
    let saldoBank = totalSetoranBank - pengeluaranBank;
    if (saldoBank < 0) saldoBank = 0;

    // Ledger Integrity Check: Net Asset = Total Income - Total Expense
    const netAsset = saldoBendahara + saldoBank + saldoTU;
    const expectedNetAsset = totalPemasukan - totalPengeluaran;
    const imbalanceAmount = Math.abs(netAsset - expectedNetAsset);
    const isBalanced = imbalanceAmount < 10;

    return {
      saldoTU,
      saldoBendahara,
      saldoBank,
      totalPemasukan,
      isBalanced,
      imbalanceAmount,
    };
  },

  async calculateCashBalance(): Promise<number> {
    const summary = await this.getSaldoSummary();
    return summary.saldoBendahara;
  },

  async calculateBankBalance(): Promise<number> {
    const summary = await this.getSaldoSummary();
    return summary.saldoBank;
  },

  // Global Rebuild Ledger & Recalculate All Balances Tool
  async recalculateGlobalLedger(): Promise<{
    saldoTU: number;
    saldoBendahara: number;
    saldoBank: number;
    totalPemasukan: number;
    isBalanced: boolean;
    imbalanceAmount: number;
    message: string;
  }> {
    const summary = await this.getSaldoSummary();
    return {
      ...summary,
      message: summary.isBalanced
        ? "Ledger berhasil dihitung ulang dan 100% SEIMBANG."
        : `Ledger dihitung ulang. Terdapat selisih ketidakseimbangan sebesar Rp ${new Intl.NumberFormat("id-ID").format(summary.imbalanceAmount)}`,
    };
  },

  async getPendingSerahTerima(): Promise<Pemasukan[]> {
    return this.getPemasukanList({ statusDana: "DI_TU" });
  },

  async getPendingSetorBank(): Promise<Pemasukan[]> {
    return this.getPemasukanList({ statusDana: "DI_BENDAHARA" });
  },

  async getSelesaiDiBank(): Promise<Pemasukan[]> {
    const list = await this.getPemasukanList();
    return list.filter(
      (p) =>
        p.transactionType === "BANK_TRANSFER" ||
        p.sumberDanaId === "sd-bank" ||
        p.sumberDanaNama?.startsWith("Setoran Bank:") ||
        p.statusDana === "SETORAN_BANK" ||
        p.statusDana === "DI_BANK"
    );
  },
};
