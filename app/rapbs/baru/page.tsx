"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { rapbsService } from "@/services/rapbsService";
import { masterService } from "@/services/masterService";
import { Rapbs, JenisRapbs } from "@/types/rapbs";
import { TahunAnggaran, UnitYayasan, SumberDana, KategoriPengeluaran } from "@/types/master";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  tahunAnggaranId: z.string().min(1, "Tahun Anggaran wajib dipilih"),
  unitId: z.string().min(1, "Unit wajib dipilih"),
  jenis: z.enum(["PEMASUKAN", "PENGELUARAN"]),
  sumberDanaId: z.string().optional(),
  kategoriPengeluaranId: z.string().optional(),
  namaProgram: z.string().min(3, "Nama Program minimal 3 karakter"),
  target: z.coerce.number().min(1, "Target harus lebih dari 0"),
  keterangan: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const formatRupiahInput = (value: number) =>
  value > 0 ? new Intl.NumberFormat("id-ID").format(value) : "";

export default function RapbsBaruPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);
  const [unitList, setUnitList] = useState<UnitYayasan[]>([]);
  const [sumberDanaList, setSumberDanaList] = useState<SumberDana[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriPengeluaran[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      jenis: "PEMASUKAN",
      target: 0,
    },
  });

  const jenis = watch("jenis");

  useEffect(() => {
    const load = async () => {
      const [ta, unit, sd, kp] = await Promise.all([
        masterService.getTahunAnggaranList(),
        masterService.getUnitList(),
        masterService.getSumberDanaList(),
        masterService.getKategoriPengeluaranList(),
      ]);
      setTahunList(ta.filter((t) => t.isActive));
      setUnitList(unit.filter((u) => u.isActive));
      setSumberDanaList(sd.filter((s) => s.isActive));
      setKategoriList(kp);

      // Set active tahun anggaran as default
      const active = ta.find((t) => t.isActive);
      if (active) setValue("tahunAnggaranId", active.id);
    };
    load();
  }, [setValue]);

  if (profile && profile.role !== "ADMIN") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm my-8">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Akses Dibatasi</h2>
          <p className="text-xs text-gray-500 mt-1">
            Hanya Admin yang dapat membuat RAPBS baru.
          </p>
        </div>
      </AppLayout>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      // Resolve denormalized names
      const tahun = tahunList.find((t) => t.id === values.tahunAnggaranId);
      const unit = unitList.find((u) => u.id === values.unitId);
      const sumberDana = sumberDanaList.find((s) => s.id === values.sumberDanaId);
      const kategori = kategoriList.find((k) => k.id === values.kategoriPengeluaranId);

      const payload: Omit<Rapbs, "id" | "status" | "createdAt" | "updatedAt" | "deletedAt" | "deletedBy"> = {
        tahunAnggaranId: values.tahunAnggaranId,
        tahunAnggaranNama: tahun?.nama || "",
        unitId: values.unitId,
        unitNama: unit?.nama || "",
        jenis: values.jenis as JenisRapbs,
        sumberDanaId: values.jenis === "PEMASUKAN" ? values.sumberDanaId || null : null,
        sumberDanaNama: values.jenis === "PEMASUKAN" ? sumberDana?.nama || null : null,
        kategoriPengeluaranId: values.jenis === "PENGELUARAN" ? values.kategoriPengeluaranId || null : null,
        kategoriPengeluaranNama: values.jenis === "PENGELUARAN" ? kategori?.nama || null : null,
        namaProgram: values.namaProgram,
        target: values.target,
        keterangan: values.keterangan || null,
      };

      const newId = await rapbsService.addRapbs(payload, profile?.uid || "u-admin");
      router.push(`/rapbs/${newId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan RAPBS");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white";

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/rapbs"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Buat RAPBS Baru
            </h1>
            <p className="text-xs text-gray-500">
              RAPBS baru akan dimulai dengan status{" "}
              <span className="font-semibold text-gray-700">DRAFT</span>
            </p>
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Jenis */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                Jenis RAPBS *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label
                  className={`flex items-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                    jenis === "PEMASUKAN"
                      ? "border-emerald-600 bg-emerald-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    {...register("jenis")}
                    value="PEMASUKAN"
                    className="sr-only"
                  />
                  <span className="text-sm font-bold text-gray-800">📥 Pemasukan</span>
                </label>
                <label
                  className={`flex items-center gap-2 rounded-xl border-2 p-3 cursor-pointer transition-all ${
                    jenis === "PENGELUARAN"
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    {...register("jenis")}
                    value="PENGELUARAN"
                    className="sr-only"
                  />
                  <span className="text-sm font-bold text-gray-800">📤 Pengeluaran</span>
                </label>
              </div>
            </div>

            {/* Tahun Anggaran */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Tahun Anggaran *
              </label>
              <select {...register("tahunAnggaranId")} className={inputClass}>
                <option value="">-- Pilih Tahun Anggaran --</option>
                {tahunList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
              {errors.tahunAnggaranId && (
                <p className="mt-1 text-xs text-red-600">{errors.tahunAnggaranId.message}</p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Unit Yayasan *
              </label>
              <select {...register("unitId")} className={inputClass}>
                <option value="">-- Pilih Unit --</option>
                {unitList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.nama}
                  </option>
                ))}
              </select>
              {errors.unitId && (
                <p className="mt-1 text-xs text-red-600">{errors.unitId.message}</p>
              )}
            </div>

            {/* Sumber Dana (PEMASUKAN) */}
            {jenis === "PEMASUKAN" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Sumber Dana *
                </label>
                <select {...register("sumberDanaId")} className={inputClass}>
                  <option value="">-- Pilih Sumber Dana --</option>
                  {sumberDanaList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Kategori Pengeluaran (PENGELUARAN) */}
            {jenis === "PENGELUARAN" && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  Kategori Pengeluaran *
                </label>
                <select {...register("kategoriPengeluaranId")} className={inputClass}>
                  <option value="">-- Pilih Kategori --</option>
                  {kategoriList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Nama Program */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Nama Program / Kegiatan *
              </label>
              <input
                type="text"
                placeholder="Contoh: SPP Siswa MI 2026-2027"
                {...register("namaProgram")}
                className={inputClass}
              />
              {errors.namaProgram && (
                <p className="mt-1 text-xs text-red-600">{errors.namaProgram.message}</p>
              )}
            </div>

            {/* Target */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Target Anggaran (Rp) *
              </label>
              <input
                type="number"
                placeholder="Contoh: 120000000"
                {...register("target")}
                className={inputClass}
                min={0}
              />
              {errors.target && (
                <p className="mt-1 text-xs text-red-600">{errors.target.message}</p>
              )}
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Keterangan
              </label>
              <textarea
                placeholder="Opsional — tambahkan detail atau perhitungan anggaran"
                {...register("keterangan")}
                rows={3}
                className={inputClass}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Link
                href="/rapbs"
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Simpan sebagai Draft</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
