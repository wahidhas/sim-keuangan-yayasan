"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { infaqService } from "@/services/infaqService";
import { masterService } from "@/services/masterService";
import { TahunAnggaran } from "@/types/master";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft, Save, Loader2, ShieldAlert,
  HeartHandshake, Info,
} from "lucide-react";

const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  tahunAnggaranId: z.string().min(1, "Tahun Anggaran wajib dipilih"),
  nominal: z.coerce.number().min(1, "Nominal harus lebih dari 0"),
  donatur: z.string().optional(),
  keterangan: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600 bg-white";

export default function InfaqBaruPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canCreate = profile?.role === "ADMIN" || profile?.role === "PJ_INFAQ";

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      nominal: 0,
    },
  });

  useEffect(() => {
    const load = async () => {
      const ta = await masterService.getTahunAnggaranList();
      setTahunList(ta.filter((t) => t.isActive));
      const active = ta.find((t) => t.isActive);
      if (active) setValue("tahunAnggaranId", active.id);
    };
    load();
  }, [setValue]);

  if (!canCreate) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm my-8">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Akses Dibatasi</h2>
          <p className="text-xs text-gray-500 mt-1">
            Hanya PJ Infaq dan Admin yang dapat menginput dana infaq.
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
      await infaqService.addInfaq(
        {
          tanggal: values.tanggal,
          tahunAnggaranId: values.tahunAnggaranId,
          tahunAnggaranNama: tahun?.nama || "",
          nominal: values.nominal,
          donatur: values.donatur?.trim() || null,
          keterangan: values.keterangan?.trim() || null,
        },
        profile?.uid || "u-demo",
        profile?.nama
      );
      router.push("/infaq");
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan data infaq");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/infaq"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Input Dana Infaq
            </h1>
            <p className="text-xs text-gray-500">
              Dana Infaq langsung dicatat tanpa melalui TU/Bendahara
            </p>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2.5 rounded-xl border border-purple-100 bg-purple-50 p-3.5 text-xs text-purple-900">
          <HeartHandshake className="h-4 w-4 shrink-0 mt-0.5 text-purple-600" />
          <p>
            Sesuai aturan yayasan, <strong>Dana Infaq</strong> tidak melalui
            alur TU maupun Bendahara. Dana langsung dicatat oleh PJ Infaq dan
            tampil di Dashboard Yayasan.
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
                <p className="mt-1 text-xs text-red-600">
                  {errors.tahunAnggaranId.message}
                </p>
              )}
            </div>

            {/* Nominal */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Nominal (Rp) *
              </label>
              <input
                type="number"
                min={0}
                placeholder="Contoh: 500000"
                {...register("nominal")}
                className={inputClass}
              />
              {errors.nominal && (
                <p className="mt-1 text-xs text-red-600">{errors.nominal.message}</p>
              )}
            </div>

            {/* Donatur */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Nama Donatur{" "}
                <span className="text-gray-400 font-normal">(Opsional — kosongkan jika anonim)</span>
              </label>
              <input
                type="text"
                placeholder="Nama donatur, atau kosongkan jika anonim"
                {...register("donatur")}
                className={inputClass}
              />
            </div>

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                Keterangan
              </label>
              <textarea
                placeholder="Contoh: Infaq Jumat, Infaq pembangunan, dll."
                {...register("keterangan")}
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <Link
                href="/infaq"
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                Batal
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan Data Infaq
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
