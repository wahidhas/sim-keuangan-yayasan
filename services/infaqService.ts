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
import { Infaq, InfaqBulanGroup } from "@/types/infaq";

const STORAGE_KEY = "sim_infaq";

const isDemoEnv = (): boolean =>
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("demo");

const getLocal = (): Infaq[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocal = (data: Infaq[]): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("localStorage error:", e);
    }
  }
};

// Format nama bulan Indonesia
const getBulanLabel = (bulanKey: string): string => {
  const [tahun, bulan] = bulanKey.split("-");
  const names = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${names[parseInt(bulan) - 1]} ${tahun}`;
};

export const infaqService = {
  // Fetch all (not deleted)
  async getInfaqList(tahunAnggaranId?: string): Promise<Infaq[]> {
    if (isDemoEnv()) {
      let local = getLocal();
      let result = local.filter((i) => !i.deletedAt);
      if (tahunAnggaranId) {
        result = result.filter((i) => i.tahunAnggaranId === tahunAnggaranId);
      }
      return result.sort(
        (a, b) =>
          new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      );
    }

    try {
      const constraints: any[] = [where("deletedAt", "==", null)];
      if (tahunAnggaranId) {
        constraints.push(where("tahunAnggaranId", "==", tahunAnggaranId));
      }
      constraints.push(orderBy("tanggal", "desc"));
      const q = query(collection(db, "infaq"), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Infaq));
    } catch (e) {
      console.warn("Firestore offline, fallback to local infaq");
      let local = getLocal();
      return local
        .filter((i) => !i.deletedAt)
        .sort(
          (a, b) =>
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );
    }
  },

  // Get single by ID
  async getInfaqById(id: string): Promise<Infaq | null> {
    const local = getLocal();
    const found = local.find((i) => i.id === id);
    if (found) return found;

    if (!isDemoEnv()) {
      try {
        const snap = await getDoc(doc(db, "infaq", id));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Infaq;
      } catch (e) {
        console.warn("Firestore offline:", e);
      }
    }
    return null;
  },

  // Add new infaq
  async addInfaq(
    data: Omit<Infaq, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy">,
    userId: string,
    userName?: string
  ): Promise<string> {
    const newId = `infaq-${Date.now()}`;
    const newDoc: Infaq = {
      ...data,
      id: newId,
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
        const ref = doc(collection(db, "infaq"));
        await setDoc(ref, {
          ...newDoc,
          id: ref.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline addInfaq:", e);
      }
    }
    return newId;
  },

  // Soft delete
  async deleteInfaq(id: string, userId: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Data infaq tidak ditemukan");

    local[idx] = {
      ...local[idx],
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "infaq", id), {
          deletedAt: serverTimestamp(),
          deletedBy: userId,
        });
      } catch (e) {
        console.warn("Firestore offline deleteInfaq:", e);
      }
    }
  },

  // Total nominal infaq (untuk Dashboard)
  async getTotalInfaq(tahunAnggaranId?: string): Promise<number> {
    const all = await this.getInfaqList(tahunAnggaranId);
    return all.reduce((s, i) => s + i.nominal, 0);
  },

  // Group by bulan untuk grafik riwayat
  async getRekapBulanan(tahunAnggaranId?: string): Promise<InfaqBulanGroup[]> {
    const all = await this.getInfaqList(tahunAnggaranId);

    const grouped: Record<string, { total: number; jumlah: number }> = {};
    for (const item of all) {
      const bulan = item.tanggal.substring(0, 7); // "2026-07"
      if (!grouped[bulan]) grouped[bulan] = { total: 0, jumlah: 0 };
      grouped[bulan].total += item.nominal;
      grouped[bulan].jumlah++;
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([bulan, val]) => ({
        bulan,
        bulanLabel: getBulanLabel(bulan),
        total: val.total,
        jumlahTransaksi: val.jumlah,
      }));
  },
};
