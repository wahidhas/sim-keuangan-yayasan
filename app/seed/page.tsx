"use client";

import React, { useState } from "react";
import { db, auth } from "@/firebase/config";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Database, CheckCircle2, AlertCircle, Loader2, Key, ShieldCheck, Trash2, RefreshCw } from "lucide-react";

export default function SeedPage() {
  const [email, setEmail] = useState("admin@yayasan.sch.id");
  const [password, setPassword] = useState("Admin123456!");
  const [nama, setNama] = useState("Administrator Utama");
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleClearCache = () => {
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
      alert("✓ Cache browser (localStorage & demo data) berhasil dibersihkan! Silakan refresh halaman.");
    }
  };

  const handleSeedDatabase = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);
    setLogs([]);

    addLog("Memulai inisialisasi database Firestore...");

    try {
      // Clear local storage first
      if (typeof window !== "undefined") {
        localStorage.clear();
        addLog("✓ Cache local storage dibersihkan.");
      }

      // 1. Inisialisasi User Admin Pertama di Auth & Firestore
      addLog(`Membuat user Authentication: ${email}...`);
      let uid = "u-admin-default";
      try {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        uid = userCred.user.uid;
        addLog(`User Auth berhasil dibuat! UID: ${uid}`);
      } catch (authErr: any) {
        if (authErr.code === "auth/email-already-in-use") {
          addLog(`Email ${email} sudah ada di Auth. Menggunakan UID default untuk dokumen users...`);
          uid = auth.currentUser?.uid || "u-admin-default";
        } else {
          addLog(`Peringatan Auth: ${authErr.message}`);
        }
      }

      addLog(`Menulis dokumen koleksi 'users/${uid}'...`);
      await setDoc(doc(db, "users", uid), {
        uid: uid,
        email: email,
        nama: nama,
        name: nama,
        role: "ADMIN",
        isActive: true,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      addLog("✓ Koleksi 'users' berhasil dibuat!");

      // 2. Koleksi tahun_anggaran
      addLog("Menulis koleksi 'tahun_anggaran'...");
      await setDoc(doc(db, "tahun_anggaran", "ta-1"), {
        id: "ta-1",
        nama: "2025-2026",
        isActive: false,
        keterangan: "Tahun Lalu",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null,
      });
      await setDoc(doc(db, "tahun_anggaran", "ta-2"), {
        id: "ta-2",
        nama: "2026-2027",
        isActive: true,
        keterangan: "Tahun Anggaran Aktif",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        deletedAt: null,
      });
      addLog("✓ Koleksi 'tahun_anggaran' berhasil dibuat (2 dokumen)!");

      // 3. Koleksi unit
      addLog("Menulis koleksi 'unit'...");
      const units = [
        { id: "u-1", kode: "RA", nama: "RA Perwanida", isActive: true },
        { id: "u-2", kode: "MI", nama: "MI Al-Hikmah", isActive: true },
        { id: "u-3", kode: "MTS", nama: "MTs Al-Hikmah", isActive: true },
        { id: "u-4", kode: "UU", nama: "Unit Usaha Yayasan", isActive: true },
      ];
      for (const u of units) {
        await setDoc(doc(db, "unit", u.id), {
          ...u,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deletedAt: null,
        });
      }
      addLog("✓ Koleksi 'unit' berhasil dibuat (4 unit yayasan)!");

      // 4. Koleksi sumber_dana
      addLog("Menulis koleksi 'sumber_dana'...");
      const sumberDana = [
        { id: "sd-1", nama: "SPP", isActive: true },
        { id: "sd-2", nama: "BOS", isActive: true },
        { id: "sd-3", nama: "LKS", isActive: true },
        { id: "sd-4", nama: "Seragam", isActive: true },
        { id: "sd-5", nama: "Unit Usaha", isActive: true },
        { id: "sd-6", nama: "Dana Infaq", isActive: true },
      ];
      for (const s of sumberDana) {
        await setDoc(doc(db, "sumber_dana", s.id), {
          ...s,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deletedAt: null,
        });
      }
      addLog("✓ Koleksi 'sumber_dana' berhasil dibuat (6 sumber dana)!");

      // 5. Koleksi kategori_pengeluaran
      addLog("Menulis koleksi 'kategori_pengeluaran'...");
      const kategori = [
        { id: "kp-1", nama: "Honor" },
        { id: "kp-2", nama: "ATK" },
        { id: "kp-3", nama: "Operasional" },
        { id: "kp-4", nama: "Sarana" },
        { id: "kp-5", nama: "Transport" },
        { id: "kp-6", nama: "Listrik" },
        { id: "kp-7", nama: "Air" },
        { id: "kp-8", nama: "Internet" },
        { id: "kp-9", nama: "Program" },
        { id: "kp-10", nama: "Lainnya" },
      ];
      for (const k of kategori) {
        await setDoc(doc(db, "kategori_pengeluaran", k.id), {
          ...k,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deletedAt: null,
        });
      }
      addLog("✓ Koleksi 'kategori_pengeluaran' berhasil dibuat (10 kategori)!");

      // 6. Koleksi settings / profile_yayasan
      addLog("Menulis koleksi 'settings/profile_yayasan'...");
      await setDoc(doc(db, "settings", "profile_yayasan"), {
        id: "profile_yayasan",
        namaYayasan: "Yayasan Pendidikan Al-Hikmah",
        namaKetua: "H. Ahmad Fauzi, S.Pd.I",
        namaBendahara: "Siti Rahmah, S.E.",
        alamat: "Jl. Pendidikan No. 45, Kecamatan Lowokwaru",
        kota: "Kota Malang, Jawa Timur",
        telepon: "(0341) 554321",
        email: "info@alhikmah-yayasan.sch.id",
        updatedAt: serverTimestamp(),
      });
      addLog("✓ Koleksi 'settings' berhasil dibuat!");

      addLog("🎉 SELURUH KOLEKSI FIRESTORE BERHASIL DIINISIALISASI!");
      setSuccess(true);
    } catch (err: any) {
      console.error("Seed error:", err);
      setError(err.message || "Gagal melakukan inisialisasi Firestore");
      addLog(`❌ ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white text-2xl shadow-lg">
            <Database className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            Inisialisasi Database Firestore
          </h1>
          <p className="text-xs text-gray-600">
            Halaman ini akan membuat otomatis seluruh Koleksi Firestore (users, tahun_anggaran, unit, sumber_dana, kategori_pengeluaran, settings)
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-xl space-y-5">
          {success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Berhasil diinisialisasi!</span>
              </div>
              <p>
                Silakan refresh halaman Firebase Console Anda. Semua Koleksi sekarang sudah muncul.
              </p>
              <p className="pt-2 font-bold">
                Akun Admin Pertama:
              </p>
              <p className="font-mono bg-white p-2 rounded border border-emerald-200">
                Email: {email}<br />
                Password: {password}
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSeedDatabase} className="space-y-4">
            <div className="rounded-xl bg-gray-50 border border-gray-200 p-3.5 space-y-3">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5 text-emerald-600" />
                Akun Admin Pertama Yang Akan Dibuat
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Nama Admin</label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email Admin</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password Admin</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs bg-white focus:border-emerald-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Membuat Koleksi Firestore...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  <span>Buat Semua Koleksi Firestore Sekarang</span>
                </>
              )}
            </button>
          </form>

          {/* Clean Cache Button */}
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={handleClearCache}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Bersihkan Cache Browser &amp; Data Demo Lokal
            </button>
          </div>

          {/* Log Window */}
          {logs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-gray-700">Progres Pembuatan:</p>
              <div className="max-h-40 overflow-y-auto rounded-xl bg-gray-900 p-3 text-xs font-mono text-emerald-400 space-y-1">
                {logs.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
