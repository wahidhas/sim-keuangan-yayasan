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
      return local;
    }
  },
};
