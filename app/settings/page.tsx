"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { profileYayasanService } from "@/services/profileYayasanService";
import { ProfileYayasan } from "@/types/profileYayasan";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { pemasukanService } from "@/services/pemasukanService";
import { LedgerService } from "@/services/ledgerService";
import {
  Settings,
  Building2,
  UserCheck,
  Save,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
} from "lucide-react";

const schema = z.object({
  namaYayasan: z.string().min(3, "Nama Yayasan minimal 3 karakter"),
  namaKetua: z.string().min(3, "Nama Ketua Yayasan minimal 3 karakter"),
  namaBendahara: z.string().min(3, "Nama Bendahara Yayasan minimal 3 karakter"),
  alamat: z.string().min(5, "Alamat minimal 5 karakter"),
  kota: z.string().min(3, "Kota minimal 3 karakter"),
  telepon: z.string().optional(),
  email: z.string().email("Format email tidak valid").or(z.literal("")).optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white";

export default function SettingsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canAccess = profile?.role === "ADMIN";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await profileYayasanService.getProfile();
      setValue("namaYayasan", data.namaYayasan);
      setValue("namaKetua", data.namaKetua);
      setValue("namaBendahara", data.namaBendahara);
      setValue("alamat", data.alamat);
      setValue("kota", data.kota);
      setValue("telepon", data.telepon || "");
      setValue("email", data.email || "");
      setLoading(false);
    };
    load();
  }, [setValue]);

  if (profile && !canAccess) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm my-8">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Akses Dibatasi</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Pengaturan Profil Yayasan hanya dapat diubah oleh Administrator.
          </p>
        </div>
      </AppLayout>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await profileYayasanService.updateProfile(values, profile?.uid || "u-admin");
      setSuccessMsg("Profil Yayasan berhasil diperbarui! Nama Ketua & Bendahara akan otomatis muncul di seluruh Laporan.");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui profil yayasan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Pengaturan Profil Yayasan
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Kelola data resmi yayasan, nama Ketua, &amp; nama Bendahara untuk Laporan &amp; Kop Surat
          </p>
        </div>

        {successMsg && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs text-emerald-800">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <p>{successMsg}</p>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-200 p-4 text-xs text-red-800">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Nama Yayasan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Nama Yayasan Pendidikan *
                </label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Contoh: Yayasan Pendidikan Al-Hikmah"
                    {...register("namaYayasan")}
                    className={`${inputClass} pl-9`}
                  />
                </div>
                {errors.namaYayasan && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.namaYayasan.message}
                  </p>
                )}
              </div>

              {/* Pejabat Penandatangan Block */}
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-4">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Pejabat Penandatangan Laporan (Official Signatories)
                </p>

                {/* Nama Ketua */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nama Ketua Yayasan *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: H. Ahmad Fauzi, S.Pd.I"
                    {...register("namaKetua")}
                    className={inputClass}
                  />
                  {errors.namaKetua && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.namaKetua.message}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">
                    Nama ini akan muncul di blok tanda tangan Ketua Yayasan pada seluruh laporan keuangan PDF/Cetak.
                  </p>
                </div>

                {/* Nama Bendahara */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Nama Bendahara Yayasan *
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Siti Rahmah, S.E."
                    {...register("namaBendahara")}
                    className={inputClass}
                  />
                  {errors.namaBendahara && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.namaBendahara.message}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-gray-400">
                    Nama ini akan muncul di blok tanda tangan Bendahara Yayasan pada seluruh laporan keuangan PDF/Cetak.
                  </p>
                </div>
              </div>

              {/* Alamat & Kontak */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Alamat Lengkap Yayasan *
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute inset-y-0 left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    rows={2}
                    placeholder="Alamat jalan, nomor, kecamatan..."
                    {...register("alamat")}
                    className={`${inputClass} pl-9`}
                  />
                </div>
                {errors.alamat && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.alamat.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Kota / Kabupaten *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kota Malang, Jawa Timur"
                  {...register("kota")}
                  className={inputClass}
                />
                {errors.kota && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.kota.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Telepon
                  </label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="(0341) 554321"
                      {...register("telepon")}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                    Email Resmi
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="info@yayasan.sch.id"
                      {...register("email")}
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Simpan Profil Yayasan</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── System Tools & Ledger Rebuild ────────────────────────────── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
            <RefreshCw className="h-4 w-4 text-emerald-600" />
            <span>Tools & Pemeliharaan Sistem Ledger</span>
          </div>
          <p className="text-xs text-gray-500">
            Jalankan rekalkulasi global jika terjadi ketidakseimbangan buku besar atau penyesuaian transaksi masal.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={async () => {
                setLoading(true);
                try {
                  const res = await LedgerService.recalculateLedger();
                  alert(res.message);
                } catch (err: any) {
                  alert("Gagal melakukan rekalkulasi ledger: " + err.message);
                } finally {
                  setLoading(false);
                }
              }}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Rebuild Ledger & Recalculate All Balances</span>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
