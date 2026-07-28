/**
 * Seed Admin Utility
 * Run this script to create the initial ADMIN user in Firebase Authentication & Firestore.
 * 
 * Usage via ts-node / npx:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-admin.ts
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function seedAdminUser() {
  console.log("Starting Initial Admin Seeding...");

  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("demo")) {
    console.error("Error: Environment variable NEXT_PUBLIC_FIREBASE_API_KEY is not set or contains demo key.");
    process.exit(1);
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@yayasan.sch.id";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "Admin123456!";
  const adminName = "Administrator Utama";

  let uid: string;

  try {
    // 1. Create User in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    uid = userCredential.user.uid;
    console.log(`Successfully created Firebase Auth user: ${adminEmail} (UID: ${uid})`);
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      console.log(`User ${adminEmail} already exists in Firebase Auth. Attempting login to get UID...`);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        uid = userCredential.user.uid;
        console.log(`Logged in as existing user: ${adminEmail} (UID: ${uid})`);
      } catch (loginErr: any) {
        console.error("Failed to login to existing user. Check password in script or environment variables.");
        process.exit(1);
      }
    } else {
      console.error("Firebase Auth creation error:", error);
      process.exit(1);
    }
  }

  // 2. Create User Document in Firestore collection "users", document ID = UID
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      uid: uid,
      email: adminEmail,
      nama: adminName,
      name: adminName,
      role: "ADMIN",
      isActive: true,
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log(`Successfully created Firestore document 'users/${uid}':`);
    console.log(JSON.stringify({
      uid,
      email: adminEmail,
      name: adminName,
      role: "ADMIN",
      active: true,
    }, null, 2));

    console.log("\n✅ INITIAL ADMIN USER CREATED SUCCESSFULLY!");
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
  } catch (dbErr: any) {
    console.error("Firestore document creation error:", dbErr);
    process.exit(1);
  }
}

seedAdminUser();
