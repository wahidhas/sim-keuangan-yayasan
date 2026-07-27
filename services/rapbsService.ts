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
  Rapbs,
  StatusRapbs,
  RAPBS_TRANSITIONS,
} from "@/types/rapbs";

const STORAGE_KEY = "sim_rapbs";

const isDemoEnv = (): boolean =>
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("demo");

const getLocal = (): Rapbs[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocal = (data: Rapbs[]): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("localStorage error:", e);
    }
  }
};

// Seed demo data
const seedRapbs = (): Rapbs[] => [
  {
    id: "rapbs-1",
    tahunAnggaranId: "ta-2",
    tahunAnggaranNama: "2026-2027",
    unitId: "u-2",
    unitNama: "MI Al-Hikmah",
    jenis: "PEMASUKAN",
    sumberDanaId: "sd-1",
    sumberDanaNama: "SPP",
    namaProgram: "SPP Siswa MI 2026-2027",
    target: 120000000,
    keterangan: "SPP per siswa 200rb x 50 siswa x 12 bulan",
    status: "APPROVED",
    createdBy: "u-admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  },
  {
    id: "rapbs-2",
    tahunAnggaranId: "ta-2",
    tahunAnggaranNama: "2026-2027",
    unitId: "u-2",
    unitNama: "MI Al-Hikmah",
    jenis: "PENGELUARAN",
    kategoriPengeluaranId: "kp-1",
    kategoriPengeluaranNama: "Honor",
    namaProgram: "Honor Guru MI 2026-2027",
    target: 72000000,
    keterangan: "Honor 6 guru x 1jt x 12 bulan",
    status: "APPROVED",
    createdBy: "u-admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  },
  {
    id: "rapbs-3",
    tahunAnggaranId: "ta-2",
    tahunAnggaranNama: "2026-2027",
    unitId: "u-3",
    unitNama: "MTs Al-Hikmah",
    jenis: "PEMASUKAN",
    sumberDanaId: "sd-2",
    sumberDanaNama: "BOS",
    namaProgram: "Dana BOS MTs 2026-2027",
    target: 48000000,
    keterangan: "Dana BOS dari Pemerintah",
    status: "MENUNGGU_APPROVAL",
    createdBy: "u-admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  },
  {
    id: "rapbs-4",
    tahunAnggaranId: "ta-2",
    tahunAnggaranNama: "2026-2027",
    unitId: "u-1",
    unitNama: "RA Perwanida",
    jenis: "PENGELUARAN",
    kategoriPengeluaranId: "kp-3",
    kategoriPengeluaranNama: "Operasional",
    namaProgram: "Biaya Operasional RA 2026-2027",
    target: 24000000,
    keterangan: "ATK, fotocopy, dan keperluan harian",
    status: "DRAFT",
    createdBy: "u-admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
  },
];

export const rapbsService = {
  // Fetch all RAPBS (active/not deleted)
  async getRapbsList(tahunAnggaranId?: string): Promise<Rapbs[]> {
    if (isDemoEnv()) {
      let local = getLocal();
      if (local.length === 0) {
        local = seedRapbs();
        setLocal(local);
      }
      const active = local.filter((r) => !r.deletedAt);
      if (tahunAnggaranId) {
        return active.filter((r) => r.tahunAnggaranId === tahunAnggaranId);
      }
      return active;
    }

    try {
      const constraints: any[] = [where("deletedAt", "==", null)];
      if (tahunAnggaranId) {
        constraints.push(where("tahunAnggaranId", "==", tahunAnggaranId));
      }
      constraints.push(orderBy("createdAt", "desc"));
      const q = query(collection(db, "rapbs"), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Rapbs)
      );
    } catch (error) {
      console.warn("Firestore offline, fallback to local rapbs");
      let local = getLocal();
      if (local.length === 0) {
        local = seedRapbs();
        setLocal(local);
      }
      const active = local.filter((r) => !r.deletedAt);
      if (tahunAnggaranId) {
        return active.filter((r) => r.tahunAnggaranId === tahunAnggaranId);
      }
      return active;
    }
  },

  // Get single RAPBS by ID
  async getRapbsById(id: string): Promise<Rapbs | null> {
    const local = getLocal();
    const found = local.find((r) => r.id === id);
    if (found) return found;

    if (!isDemoEnv()) {
      try {
        const docSnap = await getDoc(doc(db, "rapbs", id));
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Rapbs;
        }
      } catch (e) {
        console.warn("Firestore offline:", e);
      }
    }
    return null;
  },

  // Add new RAPBS (starts as DRAFT)
  async addRapbs(
    data: Omit<Rapbs, "id" | "status" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy">,
    userId: string
  ): Promise<string> {
    const newId = `rapbs-${Date.now()}`;
    const newDoc: Rapbs = {
      ...data,
      id: newId,
      status: "DRAFT",
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
        const newRef = doc(collection(db, "rapbs"));
        await setDoc(newRef, {
          ...newDoc,
          id: newRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline addRapbs:", e);
      }
    }
    return newId;
  },

  // Transition state (validate before applying)
  async transitionStatus(
    id: string,
    toStatus: StatusRapbs,
    userId: string,
    note?: string
  ): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("RAPBS tidak ditemukan");

    const current = local[idx];
    const allowed = RAPBS_TRANSITIONS[current.status];
    if (!allowed.includes(toStatus)) {
      throw new Error(
        `Tidak dapat mengubah status dari ${current.status} ke ${toStatus}`
      );
    }

    const updates: Partial<Rapbs> = {
      status: toStatus,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };

    if (toStatus === "APPROVED") {
      updates.approvedBy = userId;
      updates.approvedAt = new Date().toISOString();
      updates.approvedNote = note || null;
    }
    if (toStatus === "REJECTED") {
      updates.rejectedBy = userId;
      updates.rejectedAt = new Date().toISOString();
      updates.rejectedNote = note || null;
    }

    local[idx] = { ...current, ...updates };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        const docRef = doc(db, "rapbs", id);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline transitionStatus:", e);
      }
    }
  },

  // Update RAPBS fields (only in DRAFT state)
  async updateRapbs(
    id: string,
    data: Partial<Rapbs>,
    userId: string
  ): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("RAPBS tidak ditemukan");
    if (local[idx].status !== "DRAFT") {
      throw new Error("Hanya RAPBS berstatus DRAFT yang dapat diubah");
    }

    local[idx] = {
      ...local[idx],
      ...data,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        const docRef = doc(db, "rapbs", id);
        await updateDoc(docRef, {
          ...data,
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline updateRapbs:", e);
      }
    }
  },

  // Soft delete (only in DRAFT or REJECTED)
  async deleteRapbs(id: string, userId: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("RAPBS tidak ditemukan");

    local[idx] = {
      ...local[idx],
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        const docRef = doc(db, "rapbs", id);
        await updateDoc(docRef, {
          deletedAt: serverTimestamp(),
          deletedBy: userId,
        });
      } catch (e) {
        console.warn("Firestore offline deleteRapbs:", e);
      }
    }
  },

  // Get only APPROVED/AKTIF RAPBS for transaction reference
  async getApprovedRapbs(tahunAnggaranId: string): Promise<Rapbs[]> {
    const all = await this.getRapbsList(tahunAnggaranId);
    return all.filter((r) => r.status === "APPROVED");
  },

  // Get pending approval list (MENUNGGU_APPROVAL)
  async getPendingApproval(): Promise<Rapbs[]> {
    const all = await this.getRapbsList();
    return all.filter((r) => r.status === "MENUNGGU_APPROVAL");
  },
};
