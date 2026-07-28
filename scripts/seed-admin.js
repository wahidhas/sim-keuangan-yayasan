/**
 * Seed Admin Utility (Plain Node.js JavaScript version)
 * Run with standard Node.js:
 *   node scripts/seed-admin.js
 */

const fs = require("fs");
const path = require("path");
const { initializeApp, getApps, getApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const { getFirestore, doc, setDoc, serverTimestamp } = require("firebase/firestore");

// Manually parse .env.local if present
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

async function seedAdminUser() {
  console.log("Memulai Inisialisasi Admin Pertama...");

  if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("demo")) {
    console.error("❌ ERROR: Variable NEXT_PUBLIC_FIREBASE_API_KEY belum dikonfigurasi di .env.local!");
    console.error("Pastikan file .env.local sudah berisi kunci Firebase Production Anda.");
    process.exit(1);
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@yayasan.sch.id";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "Admin123456!";
  const adminName = "Administrator Utama";

  let uid;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
    uid = userCredential.user.uid;
    console.log(`✓ User Auth berhasil dibuat: ${adminEmail} (UID: ${uid})`);
  } catch (error) {
    if (error.code === "auth/email-already-in-use") {
      console.log(`User ${adminEmail} sudah terdaftar di Firebase Auth. Melakukan login...`);
      try {
        const userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        uid = userCredential.user.uid;
        console.log(`✓ Login berhasil (UID: ${uid})`);
      } catch (loginErr) {
        console.error("❌ Gagal login:", loginErr.message);
        process.exit(1);
      }
    } else {
      console.error("❌ Error Firebase Auth:", error.message);
      process.exit(1);
    }
  }

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

    console.log("✓ Dokumen Firestore 'users/" + uid + "' berhasil ditulis!");
    console.log("\n🎉 SELAMAT! AKUN ADMIN PERTAMA BERHASIL DIBUAT!");
    console.log("Email: " + adminEmail);
    console.log("Password: " + adminPassword);
  } catch (dbErr) {
    console.error("❌ Error Firestore:", dbErr.message);
    process.exit(1);
  }
}

seedAdminUser();
