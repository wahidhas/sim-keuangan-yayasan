import { auth, db } from "@/firebase/config";
import {
  signInWithEmailAndPassword,
  signOut,
  User as FirebaseUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { UserProfile, UserRole } from "@/types/user";

// Local storage key for demo session fallback
const DEMO_USER_KEY = "sim_demo_user_profile";

// Map standard demo emails to roles
const DEMO_USERS_MAP: Record<string, UserProfile> = {
  "admin@yayasan.sch.id": {
    uid: "u-admin",
    nama: "Administrator Utama",
    email: "admin@yayasan.sch.id",
    role: "ADMIN",
    isActive: true,
  },
  "ketua@yayasan.sch.id": {
    uid: "u-ketua",
    nama: "H. Ahmad Fauzi (Ketua Yayasan)",
    email: "ketua@yayasan.sch.id",
    role: "KETUA_YAYASAN",
    isActive: true,
  },
  "bendahara@yayasan.sch.id": {
    uid: "u-bendahara",
    nama: "Siti Rahmah (Bendahara)",
    email: "bendahara@yayasan.sch.id",
    role: "BENDAHARA_YAYASAN",
    isActive: true,
  },
  "tu@yayasan.sch.id": {
    uid: "u-tu",
    nama: "Budi Santoso (Staf TU)",
    email: "tu@yayasan.sch.id",
    role: "STAF_TU",
    unitId: "u-1",
    isActive: true,
  },
  "infaq@yayasan.sch.id": {
    uid: "u-infaq",
    nama: "Ust. M. Rizky (PJ Infaq)",
    email: "infaq@yayasan.sch.id",
    role: "PJ_INFAQ",
    isActive: true,
  },
};

export const authService = {
  // Login with email and password (with automatic fallback to Demo Session if Firebase API Key is demo/unconfigured)
  async loginWithEmail(email: string, pass: string): Promise<any> {
    const isDemoKey =
      !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY.includes("demo");

    try {
      if (isDemoKey) {
        throw new Error("DEMO_MODE_API_KEY");
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      if (userCredential.user) {
        await this.updateUserLastLogin(userCredential.user.uid);
      }
      return userCredential.user;
    } catch (error: any) {
      // Fallback for demo API key or auth/api-key-not-valid
      if (
        error.message === "DEMO_MODE_API_KEY" ||
        error.code === "auth/api-key-not-valid" ||
        error.message?.includes("api-key-not-valid")
      ) {
        const demoProfile =
          DEMO_USERS_MAP[email.toLowerCase()] || {
            uid: `u-${Date.now()}`,
            nama: email.split("@")[0] || "User Demo",
            email: email,
            role: "STAF_TU",
            isActive: true,
          };

        if (typeof window !== "undefined") {
          localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoProfile));
          window.dispatchEvent(new Event("demo-auth-changed"));
        }
        return demoProfile;
      }
      throw error;
    }
  },

  // Logout user
  async logout(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(DEMO_USER_KEY);
      window.dispatchEvent(new Event("demo-auth-changed"));
    }
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
  },

  // Get current active profile (checks demo local storage first, then Firestore)
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        try {
          return JSON.parse(stored) as UserProfile;
        } catch (e) {
          // parse error
        }
      }
    }

    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  // Update last login timestamp
  async updateUserLastLogin(uid: string): Promise<void> {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  },

  // Create initial user profile
  async createUserProfile(
    uid: string,
    data: {
      nama: string;
      email: string;
      role: UserRole;
      unitId?: string | null;
    }
  ): Promise<void> {
    const userRef = doc(db, "users", uid);
    const newProfile: UserProfile = {
      uid,
      nama: data.nama,
      email: data.email,
      role: data.role,
      unitId: data.unitId || null,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
      deletedBy: null,
    };
    await setDoc(userRef, newProfile);
  },
};
