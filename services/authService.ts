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

export const authService = {
  // Real Production Firebase Login
  async loginWithEmail(email: string, pass: string): Promise<{ user: FirebaseUser; profile: UserProfile }> {
    // 1. Authenticate with Firebase Authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    const firebaseUser = userCredential.user;

    // 2. Fetch User Profile from Firestore collection "users", document ID = UID
    const profile = await this.getUserProfile(firebaseUser.uid);

    if (!profile) {
      // User is authenticated in Auth, but profile does not exist in Firestore
      await signOut(auth);
      throw new Error("USER_NOT_FOUND_FIRESTORE");
    }

    // 3. Check active status (supports both isActive and active fields)
    const isUserActive = profile.isActive !== undefined ? profile.isActive : (profile as any).active;
    if (isUserActive === false) {
      await signOut(auth);
      throw new Error("USER_DISABLED");
    }

    // 4. Update last login timestamp in Firestore
    await this.updateUserLastLogin(firebaseUser.uid);

    return { user: firebaseUser, profile };
  },

  // Logout user from Firebase Authentication
  async logout(): Promise<void> {
    await signOut(auth);
  },

  // Get user profile strictly from Firestore collection "users"
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          uid: data.uid || uid,
          nama: data.nama || data.name || data.email?.split("@")[0] || "User",
          email: data.email || "",
          role: data.role as UserRole,
          unitId: data.unitId || null,
          isActive: data.isActive !== undefined ? data.isActive : data.active !== false,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          deletedAt: data.deletedAt || null,
          deletedBy: data.deletedBy || null,
        } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile from Firestore:", error);
      throw error;
    }
  },

  // Update last login timestamp in Firestore
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

  // Create initial user profile in Firestore
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
    const newProfile = {
      uid,
      nama: data.nama,
      name: data.nama,
      email: data.email,
      role: data.role,
      unitId: data.unitId || null,
      isActive: true,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      deletedAt: null,
      deletedBy: null,
    };
    await setDoc(userRef, newProfile);
  },
};
