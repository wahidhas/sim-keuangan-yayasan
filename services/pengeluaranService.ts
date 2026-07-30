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
  PengajuanPengeluaran,
  StatusPengeluaran,
  PENGELUARAN_TRANSITIONS,
  MetodePembayaran,
} from "@/types/pengeluaran";

const STORAGE_KEY = "sim_pengajuan_pengeluaran";

const isDemoEnv = (): boolean =>
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("demo");

const getLocal = (): PengajuanPengeluaran[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocal = (data: PengajuanPengeluaran[]): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("localStorage error:", e);
    }
  }
};

export const pengeluaranService = {
  // Fetch all (not deleted)
  async getPengajuanList(filters?: {
    tahunAnggaranId?: string;
    status?: StatusPengeluaran;
    unitId?: string;
  }): Promise<PengajuanPengeluaran[]> {
    if (isDemoEnv()) {
      let local = getLocal();
      let result = local.filter((p) => !p.deletedAt);
      if (filters?.tahunAnggaranId) result = result.filter((p) => p.tahunAnggaranId === filters.tahunAnggaranId);
      if (filters?.status) result = result.filter((p) => p.status === filters.status);
      if (filters?.unitId) result = result.filter((p) => p.unitId === filters.unitId);
      return result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }

    try {
      const snap = await getDocs(collection(db, "pengajuan_pengeluaran"));
      let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as PengajuanPengeluaran));
      docs = docs.filter((p) => !p.deletedAt);
      if (filters?.tahunAnggaranId) docs = docs.filter((p) => p.tahunAnggaranId === filters.tahunAnggaranId);
      if (filters?.status) docs = docs.filter((p) => p.status === filters.status);
      if (filters?.unitId) docs = docs.filter((p) => p.unitId === filters.unitId);
      return docs.sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    } catch (e) {
      console.warn("Firestore offline getPengajuanList, fallback to local:", e);
      let local = getLocal();
      let result = local.filter((p) => !p.deletedAt);
      if (filters?.tahunAnggaranId) result = result.filter((p) => p.tahunAnggaranId === filters.tahunAnggaranId);
      if (filters?.status) result = result.filter((p) => p.status === filters.status);
      if (filters?.unitId) result = result.filter((p) => p.unitId === filters.unitId);
      return result;
    }
  },

  // Get single by ID
  async getPengajuanById(id: string): Promise<PengajuanPengeluaran | null> {
    const local = getLocal();
    const found = local.find((p) => p.id === id);
    if (found) return found;

    if (!isDemoEnv()) {
      try {
        const snap = await getDoc(doc(db, "pengajuan_pengeluaran", id));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as PengajuanPengeluaran;
      } catch (e) { console.warn("Firestore offline:", e); }
    }
    return null;
  },

  // Create new (dicatat langsung oleh Bendahara/Admin sebagai DIREALISASIKAN)
  async addPengajuan(
    data: Omit<PengajuanPengeluaran, "id" | "status" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy">,
    userId: string,
    userName?: string,
    initialStatus: StatusPengeluaran = "DIREALISASIKAN"
  ): Promise<string> {
    const newId = `pgj-${Date.now()}`;
    const newDoc: PengajuanPengeluaran = {
      ...data,
      id: newId,
      status: initialStatus,
      realisasiAt: new Date().toISOString(),
      dibayarOleh: userId,
      dibayarOlehNama: userName || null,
      createdBy: userId,
      createdByNama: userName || null,
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
        const ref = doc(collection(db, "pengajuan_pengeluaran"));
        await setDoc(ref, { ...newDoc, id: ref.id, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      } catch (e) { console.warn("Firestore offline addPengajuan:", e); }
    }
    return newId;
  },

  // Edit Pengajuan / Catatan Pengeluaran
  async updatePengajuan(
    id: string,
    data: Partial<PengajuanPengeluaran>,
    userId: string
  ): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pengajuan tidak ditemukan");

    local[idx] = {
      ...local[idx],
      ...data,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pengajuan_pengeluaran", id), {
          ...data,
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) { console.warn("Firestore offline updatePengajuan:", e); }
    }
  },

  // Submit for approval: DRAFT → MENUNGGU_APPROVAL
  async submitForApproval(id: string, userId: string): Promise<void> {
    await this._transition(id, "MENUNGGU_APPROVAL", userId);
  },

  // Approve: MENUNGGU_APPROVAL → APPROVED (saldo Bank BELUM berkurang)
  async approve(id: string, userId: string, userName: string, note?: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pengajuan tidak ditemukan");
    if (local[idx].status !== "MENUNGGU_APPROVAL") throw new Error("Status tidak valid untuk di-approve");

    local[idx] = {
      ...local[idx],
      status: "APPROVED",
      approvalBy: userId,
      approvalByNama: userName,
      approvalAt: new Date().toISOString(),
      approvalNote: note || "Disetujui",
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pengajuan_pengeluaran", id), {
          status: "APPROVED",
          approvalBy: userId,
          approvalByNama: userName,
          approvalAt: serverTimestamp(),
          approvalNote: note || "Disetujui",
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) { console.warn("Firestore offline approve:", e); }
    }
  },

  // Reject: MENUNGGU_APPROVAL → REJECTED
  async reject(id: string, userId: string, userName: string, note: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pengajuan tidak ditemukan");
    if (local[idx].status !== "MENUNGGU_APPROVAL") throw new Error("Status tidak valid untuk ditolak");

    local[idx] = {
      ...local[idx],
      status: "REJECTED",
      approvalBy: userId,
      approvalByNama: userName,
      approvalAt: new Date().toISOString(),
      approvalNote: note,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pengajuan_pengeluaran", id), {
          status: "REJECTED",
          approvalBy: userId,
          approvalByNama: userName,
          approvalAt: serverTimestamp(),
          approvalNote: note,
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) { console.warn("Firestore offline reject:", e); }
    }
  },

  // Realisasi: APPROVED → DIREALISASIKAN (saldo Bank BERKURANG saat ini)
  async realisasikan(
    id: string,
    userId: string,
    userName: string,
    nomorBukti?: string,
    catatan?: string
  ): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pengajuan tidak ditemukan");
    if (local[idx].status !== "APPROVED") throw new Error("Hanya pengajuan APPROVED yang dapat direalisasikan");

    local[idx] = {
      ...local[idx],
      status: "DIREALISASIKAN",
      realisasiAt: new Date().toISOString(),
      dibayarOleh: userId,
      dibayarOlehNama: userName,
      nomorBukti: nomorBukti || null,
      catatanRealisasi: catatan || null,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pengajuan_pengeluaran", id), {
          status: "DIREALISASIKAN",
          realisasiAt: serverTimestamp(),
          dibayarOleh: userId,
          dibayarOlehNama: userName,
          nomorBukti: nomorBukti || null,
          catatanRealisasi: catatan || null,
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) { console.warn("Firestore offline realisasikan:", e); }
    }
  },

  // Soft delete
  async deletePengajuan(id: string, userId: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pengajuan tidak ditemukan");

    local[idx] = { ...local[idx], deletedAt: new Date().toISOString(), deletedBy: userId };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pengajuan_pengeluaran", id), {
          deletedAt: serverTimestamp(), deletedBy: userId,
        });
      } catch (e) { console.warn("Firestore offline delete:", e); }
    }
  },

  // Internal generic transition
  async _transition(id: string, toStatus: StatusPengeluaran, userId: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Pengajuan tidak ditemukan");
    const allowed = PENGELUARAN_TRANSITIONS[local[idx].status];
    if (!allowed.includes(toStatus)) throw new Error(`Tidak dapat mengubah status ke ${toStatus}`);

    local[idx] = { ...local[idx], status: toStatus, updatedBy: userId, updatedAt: new Date().toISOString() };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "pengajuan_pengeluaran", id), {
          status: toStatus, updatedBy: userId, updatedAt: serverTimestamp(),
        });
      } catch (e) { console.warn("Firestore offline transition:", e); }
    }
  },

  // Get pending approval (untuk Ketua Yayasan)
  async getPendingApproval(): Promise<PengajuanPengeluaran[]> {
    return this.getPengajuanList({ status: "MENUNGGU_APPROVAL" });
  },

  // Get APPROVED ready to realisasi (untuk Bendahara)
  async getApproved(): Promise<PengajuanPengeluaran[]> {
    return this.getPengajuanList({ status: "APPROVED" });
  },

  // Total realisasi (untuk Dashboard saldo Bank)
  async getTotalRealisasi(tahunAnggaranId?: string): Promise<number> {
    const all = await this.getPengajuanList({ tahunAnggaranId });
    return all
      .filter((p) => p.status === "DIREALISASIKAN" || p.status === "SELESAI")
      .reduce((s, p) => s + p.nominal, 0);
  },
};
