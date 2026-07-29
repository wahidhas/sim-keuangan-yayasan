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
import { Rapbs, StatusRapbs, RAPBS_TRANSITIONS } from "@/types/rapbs";

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

export const rapbsService = {
  // Fetch all (not deleted)
  async getRapbsList(tahunAnggaranId?: string): Promise<Rapbs[]> {
    if (isDemoEnv()) {
      let local = getLocal();
      let result = local.filter((r) => !r.deletedAt);
      if (tahunAnggaranId) {
        result = result.filter((r) => r.tahunAnggaranId === tahunAnggaranId);
      }
      return result.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
    }

    try {
      const constraints: any[] = [where("deletedAt", "==", null)];
      if (tahunAnggaranId) {
        constraints.push(where("tahunAnggaranId", "==", tahunAnggaranId));
      }
      constraints.push(orderBy("createdAt", "desc"));
      const q = query(collection(db, "rapbs"), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Rapbs));
    } catch (e) {
      console.warn("Firestore error getRapbsList, fallback to local");
      let local = getLocal();
      return local.filter((r) => !r.deletedAt);
    }
  },

  // Get single by ID
  async getRapbsById(id: string): Promise<Rapbs | null> {
    const local = getLocal();
    const found = local.find((r) => r.id === id);
    if (found) return found;

    if (!isDemoEnv()) {
      try {
        const snap = await getDoc(doc(db, "rapbs", id));
        if (snap.exists()) return { id: snap.id, ...snap.data() } as Rapbs;
      } catch (e) {
        console.warn("Firestore error getRapbsById:", e);
      }
    }
    return null;
  },

  // Create new (always starts as DRAFT)
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
        const ref = doc(collection(db, "rapbs"));
        await setDoc(ref, {
          ...newDoc,
          id: ref.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline addRapbs:", e);
      }
    }
    return newId;
  },

  // Submit for approval: DRAFT → MENUNGGU_APPROVAL
  async submitForApproval(id: string, userId: string): Promise<void> {
    await this._transition(id, "MENUNGGU_APPROVAL", userId);
  },

  // Approve: MENUNGGU_APPROVAL → APPROVED (oleh Ketua)
  async approve(id: string, userId: string, userName?: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("RAPBS tidak ditemukan");
    if (local[idx].status !== "MENUNGGU_APPROVAL") {
      throw new Error("Hanya RAPBS status MENUNGGU_APPROVAL yang dapat di-approve");
    }

    local[idx] = {
      ...local[idx],
      status: "APPROVED",
      approvedBy: userId,
      approvedByNama: userName || null,
      approvedAt: new Date().toISOString(),
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "rapbs", id), {
          status: "APPROVED",
          approvedBy: userId,
          approvedByNama: userName || null,
          approvedAt: serverTimestamp(),
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline approve RAPBS:", e);
      }
    }
  },

  // Reject: MENUNGGU_APPROVAL → REJECTED (oleh Ketua)
  async reject(id: string, userId: string, note?: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("RAPBS tidak ditemukan");
    if (local[idx].status !== "MENUNGGU_APPROVAL") {
      throw new Error("Hanya RAPBS status MENUNGGU_APPROVAL yang dapat di-reject");
    }

    local[idx] = {
      ...local[idx],
      status: "REJECTED",
      rejectionNote: note || null,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "rapbs", id), {
          status: "REJECTED",
          rejectionNote: note || null,
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline reject RAPBS:", e);
      }
    }
  },

  // Close RAPBS: APPROVED → DITUTUP
  async close(id: string, userId: string): Promise<void> {
    await this._transition(id, "DITUTUP", userId);
  },

  // Soft delete (hanya DRAFT atau REJECTED)
  async deleteRapbs(id: string, userId: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("RAPBS tidak ditemukan");
    const s = local[idx].status;
    if (s !== "DRAFT" && s !== "REJECTED") {
      throw new Error("Hanya RAPBS berstatus DRAFT atau REJECTED yang dapat dihapus");
    }

    local[idx] = {
      ...local[idx],
      deletedAt: new Date().toISOString(),
      deletedBy: userId,
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "rapbs", id), {
          deletedAt: serverTimestamp(),
          deletedBy: userId,
        });
      } catch (e) {
        console.warn("Firestore offline delete RAPBS:", e);
      }
    }
  },

  // Public transition helper
  async transitionStatus(
    id: string,
    toStatus: StatusRapbs,
    userId: string,
    noteText?: string
  ): Promise<void> {
    if (toStatus === "APPROVED") {
      await this.approve(id, userId);
    } else if (toStatus === "REJECTED") {
      await this.reject(id, userId, noteText);
    } else if (toStatus === "MENUNGGU_APPROVAL") {
      await this.submitForApproval(id, userId);
    } else if (toStatus === "DITUTUP") {
      await this.close(id, userId);
    } else {
      await this._transition(id, toStatus, userId);
    }
  },

  // Internal generic transition
  async _transition(id: string, toStatus: StatusRapbs, userId: string): Promise<void> {
    const local = getLocal();
    const idx = local.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("RAPBS tidak ditemukan");
    const allowed = RAPBS_TRANSITIONS[local[idx].status];
    if (!allowed.includes(toStatus)) {
      throw new Error(`Transisi status dari ${local[idx].status} ke ${toStatus} tidak diizinkan`);
    }

    local[idx] = {
      ...local[idx],
      status: toStatus,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };
    setLocal(local);

    if (!isDemoEnv()) {
      try {
        await updateDoc(doc(db, "rapbs", id), {
          status: toStatus,
          updatedBy: userId,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline transition RAPBS:", e);
      }
    }
  },

  // Pending approval list (untuk Ketua Yayasan)
  async getPendingApproval(): Promise<Rapbs[]> {
    return this.getRapbsList().then((list) =>
      list.filter((r) => r.status === "MENUNGGU_APPROVAL")
    );
  },

  // Get APPROVED RAPBS
  async getApprovedRapbs(tahunAnggaranId: string): Promise<Rapbs[]> {
    return this.getRapbsList(tahunAnggaranId).then((list) =>
      list.filter((r) => r.status === "APPROVED")
    );
  },
};
