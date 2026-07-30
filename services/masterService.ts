import { db, firebaseConfig } from "@/firebase/config";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  TahunAnggaran,
  UnitYayasan,
  SumberDana,
  KategoriPengeluaran,
} from "@/types/master";
import { UserProfile, UserRole } from "@/types/user";

// Local Storage Keys for offline/demo persistence
const STORAGE_TA = "sim_master_tahun_anggaran";
const STORAGE_UNIT = "sim_master_unit";
const STORAGE_SD = "sim_master_sumber_dana";
const STORAGE_KP = "sim_master_kategori_pengeluaran";
const STORAGE_USERS = "sim_master_users";

// Helper for local storage
const getLocalData = <T>(key: string): T[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const setLocalData = <T>(key: string, data: T[]): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Local storage error:", e);
    }
  }
};

const isDemoEnv = (): boolean => {
  return (
    !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("demo")
  );
};

// Initial Seed Generators
const seedTahunAnggaran = (): TahunAnggaran[] => [
  { id: "ta-1", nama: "2025-2026", isActive: false, keterangan: "Tahun Lalu", deletedAt: null },
  { id: "ta-2", nama: "2026-2027", isActive: true, keterangan: "Tahun Anggaran Aktif", deletedAt: null },
];

const seedUnit = (): UnitYayasan[] => [
  { id: "u-1", kode: "RA", nama: "RA Perwanida", isActive: true, deletedAt: null },
  { id: "u-2", kode: "MI", nama: "MI Al-Hikmah", isActive: true, deletedAt: null },
  { id: "u-3", kode: "MTS", nama: "MTs Al-Hikmah", isActive: true, deletedAt: null },
  { id: "u-4", kode: "UU", nama: "Unit Usaha Yayasan", isActive: true, deletedAt: null },
];

const seedSumberDana = (): SumberDana[] => [
  { id: "sd-1", nama: "SPP", isActive: true, deletedAt: null },
  { id: "sd-2", nama: "BOS", isActive: true, deletedAt: null },
  { id: "sd-3", nama: "LKS", isActive: true, deletedAt: null },
  { id: "sd-4", nama: "Seragam", isActive: true, deletedAt: null },
  { id: "sd-5", nama: "Unit Usaha", isActive: true, deletedAt: null },
  { id: "sd-6", nama: "Dana Infaq", isActive: true, deletedAt: null },
];

const seedKategoriPengeluaran = (): KategoriPengeluaran[] => [
  { id: "kp-1", nama: "Honor", deletedAt: null },
  { id: "kp-2", nama: "ATK", deletedAt: null },
  { id: "kp-3", nama: "Operasional", deletedAt: null },
  { id: "kp-4", nama: "Sarana", deletedAt: null },
  { id: "kp-5", nama: "Transport", deletedAt: null },
  { id: "kp-6", nama: "Listrik", deletedAt: null },
  { id: "kp-7", nama: "Air", deletedAt: null },
  { id: "kp-8", nama: "Internet", deletedAt: null },
  { id: "kp-9", nama: "Program", deletedAt: null },
  { id: "kp-10", nama: "Lainnya", deletedAt: null },
];

export const masterService = {
  // ================= TAHUN ANGGARAN =================
  async getTahunAnggaranList(): Promise<TahunAnggaran[]> {
    if (isDemoEnv()) {
      let local = getLocalData<TahunAnggaran>(STORAGE_TA);
      if (local.length === 0) {
        local = seedTahunAnggaran();
        setLocalData(STORAGE_TA, local);
      }
      return local.filter((item) => !item.deletedAt);
    }

    try {
      const snap = await getDocs(collection(db, "tahun_anggaran"));
      const list = snap.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as TahunAnggaran)
      );
      return list.filter((item) => !item.deletedAt);
    } catch (error) {
      console.warn("Firestore offline, fallback to local storage for tahun_anggaran");
      let local = getLocalData<TahunAnggaran>(STORAGE_TA);
      if (local.length === 0) {
        local = seedTahunAnggaran();
        setLocalData(STORAGE_TA, local);
      }
      return local.filter((item) => !item.deletedAt);
    }
  },

  async addTahunAnggaran(
    data: Omit<TahunAnggaran, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy">,
    userId: string
  ): Promise<string> {
    const newId = `ta-${Date.now()}`;
    const newDoc: TahunAnggaran = {
      id: newId,
      nama: data.nama,
      isActive: data.isActive,
      keterangan: data.keterangan || "",
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      deletedBy: null,
    };

    const local = getLocalData<TahunAnggaran>(STORAGE_TA);
    local.push(newDoc);
    setLocalData(STORAGE_TA, local);

    if (!isDemoEnv()) {
      try {
        const newRef = doc(collection(db, "tahun_anggaran"));
        await setDoc(newRef, {
          ...newDoc,
          id: newRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore setDoc offline:", e);
      }
    }
    return newId;
  },

  async deleteTahunAnggaran(id: string, userId: string): Promise<void> {
    let local = getLocalData<TahunAnggaran>(STORAGE_TA);
    if (local.length === 0) {
      local = seedTahunAnggaran();
    }
    const updated = local.map((item) =>
      item.id === id
        ? { ...item, deletedAt: new Date().toISOString(), deletedBy: userId }
        : item
    );
    setLocalData(STORAGE_TA, updated);

    if (!isDemoEnv()) {
      try {
        const docRef = doc(db, "tahun_anggaran", id);
        await updateDoc(docRef, {
          deletedAt: serverTimestamp(),
          deletedBy: userId,
        });
      } catch (e) {
        console.warn("Firestore updateDoc offline:", e);
      }
    }
  },

  // ================= UNIT YAYASAN =================
  async getUnitList(): Promise<UnitYayasan[]> {
    if (isDemoEnv()) {
      let local = getLocalData<UnitYayasan>(STORAGE_UNIT);
      if (local.length === 0) {
        local = seedUnit();
        setLocalData(STORAGE_UNIT, local);
      }
      return local.filter((item) => !item.deletedAt);
    }

    try {
      const snap = await getDocs(collection(db, "unit"));
      const list = snap.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as UnitYayasan)
      );
      return list.filter((item) => !item.deletedAt);
    } catch (error) {
      let local = getLocalData<UnitYayasan>(STORAGE_UNIT);
      if (local.length === 0) {
        local = seedUnit();
        setLocalData(STORAGE_UNIT, local);
      }
      return local.filter((item) => !item.deletedAt);
    }
  },

  async addUnit(
    data: Omit<UnitYayasan, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy">,
    userId: string
  ): Promise<string> {
    const newId = `u-${Date.now()}`;
    const newDoc: UnitYayasan = {
      id: newId,
      kode: data.kode,
      nama: data.nama,
      isActive: data.isActive,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      deletedBy: null,
    };

    const local = getLocalData<UnitYayasan>(STORAGE_UNIT);
    local.push(newDoc);
    setLocalData(STORAGE_UNIT, local);

    if (!isDemoEnv()) {
      try {
        const newRef = doc(collection(db, "unit"));
        await setDoc(newRef, {
          ...newDoc,
          id: newRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore setDoc offline:", e);
      }
    }
    return newId;
  },

  async deleteUnit(id: string, userId: string): Promise<void> {
    let local = getLocalData<UnitYayasan>(STORAGE_UNIT);
    if (local.length === 0) {
      local = seedUnit();
    }
    const updated = local.map((item) =>
      item.id === id
        ? { ...item, deletedAt: new Date().toISOString(), deletedBy: userId }
        : item
    );
    setLocalData(STORAGE_UNIT, updated);

    if (!isDemoEnv()) {
      try {
        const docRef = doc(db, "unit", id);
        await updateDoc(docRef, {
          deletedAt: serverTimestamp(),
          deletedBy: userId,
        });
      } catch (e) {
        console.warn("Firestore updateDoc offline:", e);
      }
    }
  },

  // ================= SUMBER DANA =================
  async getSumberDanaList(): Promise<SumberDana[]> {
    if (isDemoEnv()) {
      let local = getLocalData<SumberDana>(STORAGE_SD);
      if (local.length === 0) {
        local = seedSumberDana();
        setLocalData(STORAGE_SD, local);
      }
      return local.filter((item) => !item.deletedAt);
    }

    try {
      const snap = await getDocs(collection(db, "sumber_dana"));
      const list = snap.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as SumberDana)
      );
      return list.filter((item) => !item.deletedAt);
    } catch (error) {
      let local = getLocalData<SumberDana>(STORAGE_SD);
      if (local.length === 0) {
        local = seedSumberDana();
        setLocalData(STORAGE_SD, local);
      }
      return local.filter((item) => !item.deletedAt);
    }
  },

  async addSumberDana(
    data: Omit<SumberDana, "id" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy">,
    userId: string
  ): Promise<string> {
    const newId = `sd-${Date.now()}`;
    const newDoc: SumberDana = {
      id: newId,
      nama: data.nama,
      isActive: data.isActive,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      deletedBy: null,
    };

    const local = getLocalData<SumberDana>(STORAGE_SD);
    local.push(newDoc);
    setLocalData(STORAGE_SD, local);

    if (!isDemoEnv()) {
      try {
        const newRef = doc(collection(db, "sumber_dana"));
        await setDoc(newRef, {
          ...newDoc,
          id: newRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore setDoc offline:", e);
      }
    }
    return newId;
  },

  async deleteSumberDana(id: string, userId: string): Promise<void> {
    let local = getLocalData<SumberDana>(STORAGE_SD);
    if (local.length === 0) {
      local = seedSumberDana();
    }
    const updated = local.map((item) =>
      item.id === id
        ? { ...item, deletedAt: new Date().toISOString(), deletedBy: userId }
        : item
    );
    setLocalData(STORAGE_SD, updated);

    if (!isDemoEnv()) {
      try {
        const docRef = doc(db, "sumber_dana", id);
        await updateDoc(docRef, {
          deletedAt: serverTimestamp(),
          deletedBy: userId,
        });
      } catch (e) {
        console.warn("Firestore updateDoc offline:", e);
      }
    }
  },

  // ================= KATEGORI PENGELUARAN =================
  async getKategoriPengeluaranList(): Promise<KategoriPengeluaran[]> {
    if (isDemoEnv()) {
      let local = getLocalData<KategoriPengeluaran>(STORAGE_KP);
      if (local.length === 0) {
        local = seedKategoriPengeluaran();
        setLocalData(STORAGE_KP, local);
      }
      return local.filter((item) => !item.deletedAt);
    }

    try {
      const snap = await getDocs(collection(db, "kategori_pengeluaran"));
      const list = snap.docs.map(
        (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as KategoriPengeluaran)
      );
      return list.filter((item) => !item.deletedAt);
    } catch (error) {
      let local = getLocalData<KategoriPengeluaran>(STORAGE_KP);
      if (local.length === 0) {
        local = seedKategoriPengeluaran();
        setLocalData(STORAGE_KP, local);
      }
      return local.filter((item) => !item.deletedAt);
    }
  },

  async addKategoriPengeluaran(
    data: { nama: string },
    userId: string
  ): Promise<string> {
    const newId = `kp-${Date.now()}`;
    const newDoc: KategoriPengeluaran = {
      id: newId,
      nama: data.nama,
      createdBy: userId,
      updatedBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      deletedBy: null,
    };

    const local = getLocalData<KategoriPengeluaran>(STORAGE_KP);
    local.push(newDoc);
    setLocalData(STORAGE_KP, local);

    if (!isDemoEnv()) {
      try {
        const newRef = doc(collection(db, "kategori_pengeluaran"));
        await setDoc(newRef, {
          ...newDoc,
          id: newRef.id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore setDoc offline:", e);
      }
    }
    return newId;
  },

  async deleteKategoriPengeluaran(id: string, userId: string): Promise<void> {
    let local = getLocalData<KategoriPengeluaran>(STORAGE_KP);
    if (local.length === 0) {
      local = seedKategoriPengeluaran();
    }
    const updated = local.map((item) =>
      item.id === id
        ? { ...item, deletedAt: new Date().toISOString(), deletedBy: userId }
        : item
    );
    setLocalData(STORAGE_KP, updated);

    if (!isDemoEnv()) {
      try {
        const docRef = doc(db, "kategori_pengeluaran", id);
        await updateDoc(docRef, {
          deletedAt: serverTimestamp(),
          deletedBy: userId,
        });
      } catch (e) {
        console.warn("Firestore updateDoc offline:", e);
      }
    }
  },

  // ================= USER MANAGEMENT (FIREBASE AUTH & FIRESTORE) =================
  async getUsersList(): Promise<UserProfile[]> {
    if (isDemoEnv()) {
      return getLocalData<UserProfile>(STORAGE_USERS);
    }

    try {
      const snap = await getDocs(collection(db, "users"));
      const users = snap.docs.map(
        (docSnap) => ({ uid: docSnap.id, ...docSnap.data() } as UserProfile)
      );
      return users.filter((u) => u.deletedAt !== true);
    } catch (error) {
      console.warn("Firestore getUsersList error, fallback to local:", error);
      return getLocalData<UserProfile>(STORAGE_USERS);
    }
  },

  async createUser(data: {
    nama: string;
    email: string;
    password?: string;
    role: UserRole;
    unitId?: string | null;
  }): Promise<UserProfile> {
    const password = data.password || "123456";
    let newUid = `user-${Date.now()}`;

    if (!isDemoEnv()) {
      try {
        // Use Secondary Auth App so current logged-in admin session is NOT logged out
        const secondaryApp =
          getApps().find((a) => a.name === "SecondaryAuthApp") ||
          initializeApp(firebaseConfig, "SecondaryAuthApp");
        const secondaryAuth = getAuth(secondaryApp);
        const userCred = await createUserWithEmailAndPassword(
          secondaryAuth,
          data.email.trim(),
          password
        );
        newUid = userCred.user.uid;
        await signOut(secondaryAuth);
      } catch (authError: any) {
        console.warn("Secondary Firebase Auth create user error:", authError);
        if (authError.code === "auth/email-already-in-use") {
          throw new Error("Email ini sudah terdaftar di Firebase Authentication.");
        }
        if (authError.code === "auth/weak-password") {
          throw new Error("Password minimal 6 karakter.");
        }
      }
    }

    const newUser: UserProfile = {
      uid: newUid,
      email: data.email.trim(),
      nama: data.nama.trim(),
      role: data.role,
      unitId: data.unitId || null,
      isActive: true,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    };

    // Save to local storage for offline fallback
    const local = getLocalData<UserProfile>(STORAGE_USERS);
    local.unshift(newUser);
    setLocalData(STORAGE_USERS, local);

    if (!isDemoEnv()) {
      try {
        const userRef = doc(db, "users", newUid);
        await setDoc(userRef, {
          ...newUser,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore setDoc user offline:", e);
      }
    }

    return newUser;
  },

  async updateUserRoleAndUnit(
    uid: string,
    role: UserRole,
    unitId?: string | null,
    isActive: boolean = true
  ): Promise<void> {
    const local = getLocalData<UserProfile>(STORAGE_USERS);
    const updated = local.map((u) =>
      u.uid === uid ? { ...u, role, unitId: unitId || null, isActive, active: isActive } : u
    );
    setLocalData(STORAGE_USERS, updated);

    if (!isDemoEnv()) {
      try {
        const userRef = doc(db, "users", uid);
        await setDoc(
          userRef,
          {
            role,
            unitId: unitId || null,
            isActive,
            active: isActive,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (e) {
        console.warn("Firestore updateDoc user offline:", e);
      }
    }
  },
};
