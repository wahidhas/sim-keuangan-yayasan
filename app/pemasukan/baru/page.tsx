"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { pemasukanService } from "@/services/pemasukanService";
import { masterService } from "@/services/masterService";
import { rapbsService } from "@/services/rapbsService";
import { TahunAnggaran, UnitYayasan, SumberDana } from "@/types/master";
import { Rapbs } from "@/types/rapbs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Save, Loader2, ShieldAlert, Info } from "lucide-react";

const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  tahunAnggaranId: z.string().min(1, "Tahun Anggaran wajib dipilih"),
  unitId: z.string().min(1, "Unit wajib dipilih"),
  rapbsId: z.string().optional(),
  sumberDanaId: z.string().min(1, "Sumber Dana wajib dipilih"),
  nominal: z.coerce.number().min(1, "Nominal harus lebih dari 0"),
  keterangan: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white";

export default function PemasukanBaruPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);
  const [unitList, setUnitList] = useState<UnitYayasan[]>([]);
  const [sumberDanaList, setSumberDanaList] = useState<SumberDana[]>([]);
  const [rapbsList, setRapbsList] = useState<Rapbs[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate =
    profile?.role === "ADMIN" || profile?.role === "STAF_TU";

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      nominal: 0,
    },
  });

  const selectedTahun = watch("tahunAnggaranId");
  const selectedUnit = watch("unitId");

  useEffect(() => {
    const load = async () => {
      const [ta, unit, sd] = await Promise.all([
        masterService.getTahunAnggaranList(),
        masterService.getUnitList(),
        masterService.getSumberDanaList(),
      ]);
      setTahunList(ta.filter((t) => t.isActive));
      setUnitList(unit.filter((u) => u.isActive));
      setSumberDanaList(sd.filter((s) => s.isActive));
      const active = ta.find((t) => t.isActive);
      if (active) setValue("tahunAnggaranId", active.id);
    };
    load();
  }, [setValue]);

  // Load RAPBS saat tahun anggaran berubah
  useEffect(() => {
    const loadRapbs = async () => {
      if (selectedTahun) {
        const approved = await rapbsService.getApprovedRapbs(selectedTahun);
        setRapbsList(approved.filter((r) => r.jenis === "PEMASUKAN"));
      }
    };
    loadRapbs();
  }, [selectedTahun]);

  if (!canCreate) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm my-8">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Akses Dibatasi</h2>
          <p className="text-xs text-gray-500 mt-1">
            Hanya Staf TU dan Admin yang dapat menginput pemasukan baru.
          </p>
        </div>
      </AppLayout>
    );
  }

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const tahun = tahunList.find((t) => t.id === values.tahunAnggaranId);
      const unit = unitList.find((u) => u.id === values.unitId);
      const sumber = sumberDanaList.find((s) => s.id === values.sumberDanaId);
      const rapbs = rapbsList.find((r) => r.id === values.rapbsId);

      const newId = await pemasukanService.addPemasukan(
        {
          tanggal: values.tanggal,
          tahunAnggaranId: values.tahunAnggaranId,
          tahunAnggaranNama: tahun?.nama || "",
          unitId: values.unitId,
          unitNama: unit?.nama || "",
          rapbsId: values.rapbsId || null,
          rapbsNama: rapbs?.namaProgram || null,
          sumberDanaId: values.sumberDanaId,
          sumberDanaNama: sumber?.nama || "",
          nominal: values.nominal,
          keterangan: values.keterangan || null,
          statusDana: "DI_BENDAHARA",
          transactionType: "INCOME",
        },
        profile?.uid || "u-demo",
        profile?.nama
      );
      router.push(`/pemasukan/${newId}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan pemasukan");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/pemasukan"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Input Pemasukan
            </h1>
            <p className="text-xs text-gray-500">
              Status awal:{" "}
              <span className="font-semibold text-orange-600">DI TU</span>
            </p>
          </div>
        </div>

        {/* Info box */}
        <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50 p-3.5 text-xs text-blue-800">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
          <p>
            Dana yang diinput akan dicatat dengan status{" "}
            <strong>DI TU</strong>. Setelah diserahkan ke Bendahara, status
            otomatis berubah menjadi <strong>DI BENDAHARA</strong>, lalu{" "}
            <strong>DI BANK</strong> setelah disetorkan.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 md:p-6 shadow-sm">
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Tanggal Penerimaan *
              </label>
              <input type="date" {...register("tanggal")} className={inputClass} />
              {errors.tanggal && (
                <p className="mt-1 text-xs text-red-600">{errors.tanggal.message}</p>
              )}
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

            {/* Sumber Dana */}
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
              {errors.sumberDanaId && (
                <p className="mt-1 text-xs text-red-600">{errors.sumberDanaId.message}</p>
              )}
            </div>

            {/* RAPBS (opsional, hanya yang APPROVED) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Alokasi RAPBS{" "}
                <span className="text-gray-400 font-normal">(Opsional)</span>
              </label>
              <select {...register("rapbsId")} className={inputClass}>
                <option value="">-- Pilih RAPBS (jika ada) --</option>
                {rapbsList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.namaProgram} — {r.unitNama}
                  </option>
                ))}
              </select>
            </div>

            {/* Nominal */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Nominal (Rp) *
              </label>
              <input
                type="number"
                min={0}
                placeholder="Contoh: 5000000"
                {...register("nominal")}
                className={inputClass}
              />
              {errors.nominal && (
                <p className="mt-1 text-xs text-red-600">{errors.nominal.message}</p>
              )}
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Keterangan
              </label>
              <textarea
                placeholder="Opsional — tambahkan detail atau keterangan pemasukan"
                {...register("keterangan")}
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Link
                href="/pemasukan"
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan Pemasukan
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
