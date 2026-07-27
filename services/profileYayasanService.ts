import { db } from "@/firebase/config";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ProfileYayasan } from "@/types/profileYayasan";

const STORAGE_KEY = "sim_profile_yayasan";

const isDemoEnv = (): boolean =>
  !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("demo");

const defaultProfile: ProfileYayasan = {
  id: "default-yayasan",
  namaYayasan: "Yayasan Pendidikan Al-Hikmah",
  namaKetua: "H. Ahmad Fauzi, S.Pd.I",
  namaBendahara: "Siti Rahmah, S.E.",
  alamat: "Jl. Pendidikan No. 45, Kecamatan Lowokwaru",
  kota: "Kota Malang, Jawa Timur",
  telepon: "(0341) 554321",
  email: "info@alhikmah-yayasan.sch.id",
  updatedAt: new Date().toISOString(),
};

const getLocal = (): ProfileYayasan => {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : defaultProfile;
  } catch {
    return defaultProfile;
  }
};

const setLocal = (data: ProfileYayasan): void => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error("localStorage error:", e);
    }
  }
};

export const profileYayasanService = {
  async getProfile(): Promise<ProfileYayasan> {
    if (isDemoEnv()) {
      return getLocal();
    }

    try {
      const snap = await getDoc(doc(db, "settings", "profile_yayasan"));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as ProfileYayasan;
      }
    } catch (e) {
      console.warn("Firestore offline getProfile fallback:", e);
    }
    return getLocal();
  },

  async updateProfile(
    data: Partial<ProfileYayasan>,
    userId: string
  ): Promise<ProfileYayasan> {
    const current = await this.getProfile();
    const updated: ProfileYayasan = {
      ...current,
      ...data,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    };

    setLocal(updated);

    if (!isDemoEnv()) {
      try {
        await setDoc(doc(db, "settings", "profile_yayasan"), {
          ...updated,
          updatedAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("Firestore offline updateProfile:", e);
      }
    }
    return updated;
  },
};
