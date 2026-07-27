import { db } from "@/firebase/config";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { ActivityLog } from "@/types/audit";

const STORAGE_KEY = "sim_activity_logs";

const isDemoEnv = (): boolean =>
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("demo");

const getLocal = (): ActivityLog[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocal = (data: ActivityLog[]): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("localStorage error:", e);
    }
  }
};

const seedData = (): ActivityLog[] => [
  {
    id: "log-1",
    userId: "u-admin",
    userNama: "Administrator",
    userRole: "ADMIN",
    action: "CREATE",
    collectionName: "rapbs",
    documentId: "rapbs-1",
    documentSummary: "Membuat RAPBS SPP Siswa MI 2026-2027 (Rp 120.000.000)",
    details: "RAPBS baru dibuat dengan status DRAFT",
    createdAt: "2026-07-26T10:00:00.000Z",
  },
  {
    id: "log-2",
    userId: "u-ketua",
    userNama: "H. Ahmad Fauzi",
    userRole: "KETUA_YAYASAN",
    action: "APPROVE",
    collectionName: "rapbs",
    documentId: "rapbs-1",
    documentSummary: "Menyetujui RAPBS SPP Siswa MI 2026-2027",
    details: "Status berubah dari MENUNGGU_APPROVAL menjadi APPROVED",
    createdAt: "2026-07-26T14:30:00.000Z",
  },
  {
    id: "log-3",
    userId: "u-tu",
    userNama: "Budi Santoso",
    userRole: "STAF_TU",
    action: "CREATE",
    collectionName: "pemasukan",
    documentId: "pms-1",
    documentSummary: "Input Pemasukan SPP Juli (Rp 10.000.000)",
    details: "Status awal: DI_TU",
    createdAt: "2026-07-27T08:00:00.000Z",
  },
  {
    id: "log-4",
    userId: "u-tu",
    userNama: "Budi Santoso",
    userRole: "STAF_TU",
    action: "TRANSITION",
    collectionName: "pemasukan",
    documentId: "pms-1",
    documentSummary: "Serah Terima Dana Pemasukan SPP ke Bendahara",
    details: "Status berubah dari DI_TU ke DI_BENDAHARA (Diterima Siti Rahmah)",
    createdAt: "2026-07-27T09:15:00.000Z",
  },
  {
    id: "log-5",
    userId: "u-bendahara",
    userNama: "Siti Rahmah",
    userRole: "BENDAHARA_YAYASAN",
    action: "TRANSITION",
    collectionName: "pemasukan",
    documentId: "pms-1",
    documentSummary: "Setor Bank BRI Pemasukan SPP (Rp 10.000.000)",
    details: "Status berubah dari DI_BENDAHARA ke DI_BANK (Ref: TRF202607120001)",
    createdAt: "2026-07-27T10:30:00.000Z",
  },
  {
    id: "log-6",
    userId: "u-bendahara",
    userNama: "Siti Rahmah",
    userRole: "BENDAHARA_YAYASAN",
    action: "CREATE",
    collectionName: "pengajuan_pengeluaran",
    documentId: "pgj-1",
    documentSummary: "Pengajuan Pengeluaran Honor Guru MI (Rp 6.000.000)",
    details: "Status awal: DRAFT",
    createdAt: "2026-07-27T11:00:00.000Z",
  },
  {
    id: "log-7",
    userId: "u-ketua",
    userNama: "H. Ahmad Fauzi",
    userRole: "KETUA_YAYASAN",
    action: "APPROVE",
    collectionName: "pengajuan_pengeluaran",
    documentId: "pgj-1",
    documentSummary: "Menyetujui Pengeluaran Honor Guru MI (Rp 6.000.000)",
    details: "Status berubah ke APPROVED",
    createdAt: "2026-07-27T13:00:00.000Z",
  },
  {
    id: "log-8",
    userId: "u-bendahara",
    userNama: "Siti Rahmah",
    userRole: "BENDAHARA_YAYASAN",
    action: "TRANSITION",
    collectionName: "pengajuan_pengeluaran",
    documentId: "pgj-1",
    documentSummary: "Realisasi Pembayaran Honor Guru MI (Rp 6.000.000)",
    details: "Status berubah ke DIREALISASIKAN (Kwitansi: TRF202607200001)",
    createdAt: "2026-07-27T14:20:00.000Z",
  },
];

export const auditService = {
  // Record a new activity log
  async logActivity(log: Omit<ActivityLog, "id" | "createdAt">): Promise<void> {
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    const local = getLocal();
    local.unshift(newLog);
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        const ref = doc(collection(db, "activity_logs"));
        await setDoc(ref, {
          ...newLog,
          id: ref.id,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline logActivity:", e);
      }
    }
  },

  // Fetch activity logs with optional filters
  async getLogs(filters?: {
    collectionName?: string;
    action?: string;
    maxResults?: number;
  }): Promise<ActivityLog[]> {
    if (isDemoEnv()) {
      let local = getLocal();
      if (local.length === 0) {
        local = seedData();
        setLocal(local);
      }
      let res = local;
      if (filters?.collectionName) {
        res = res.filter((l) => l.collectionName === filters.collectionName);
      }
      if (filters?.action) {
        res = res.filter((l) => l.action === filters.action);
      }
      if (filters?.maxResults) {
        res = res.slice(0, filters.maxResults);
      }
      return res;
    }

    try {
      const q = query(
        collection(db, "activity_logs"),
        orderBy("createdAt", "desc"),
        limit(filters?.maxResults || 100)
      );
      const snap = await getDocs(q);
      let logs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ActivityLog));
      if (filters?.collectionName) {
        logs = logs.filter((l) => l.collectionName === filters.collectionName);
      }
      if (filters?.action) {
        logs = logs.filter((l) => l.action === filters.action);
      }
      return logs;
    } catch (e) {
      console.warn("Firestore offline getLogs fallback");
      let local = getLocal();
      if (local.length === 0) {
        local = seedData();
        setLocal(local);
      }
      return local;
    }
  },
};
