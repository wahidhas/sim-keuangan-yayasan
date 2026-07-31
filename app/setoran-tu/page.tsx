"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { pemasukanService } from "@/services/pemasukanService";
import { masterService } from "@/services/masterService";
import { Pemasukan } from "@/types/pemasukan";
import { UnitYayasan, TahunAnggaran } from "@/types/master";
import {
  Building2,
  Plus,
  Search,
  Loader2,
  ChevronRight,
  TrendingUp,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const schema = z.object({
  tanggal: z.string().min(1, "Tanggal wajib diisi"),
  tahunAnggaranId: z.string().min(1, "Tahun Anggaran wajib dipilih"),
  unitId: z.string().min(1, "Unit Yayasan wajib dipilih"),
  jenisSetoran: z.string().min(1, "Jenis setoran wajib diisi"),
  nominal: z.coerce.number().min(1, "Nominal harus lebih dari 0"),
  keterangan: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white";

export default function SetoranTuPage() {
  const { profile } = useAuth();
  const [list, setList] = useState<Pemasukan[]>([]);
  const [unitList, setUnitList] = useState<UnitYayasan[]>([]);
  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const canCreate =
    profile?.role === "ADMIN" ||
    profile?.role === "STAF_TU" ||
    profile?.role === "BENDAHARA_YAYASAN";

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      tanggal: new Date().toISOString().split("T")[0],
      jenisSetoran: "SPP",
      nominal: 0,
    },
  });

  const loadData = async () => {
    setLoading(true);
    const [allPemasukan, units, ta] = await Promise.all([
      pemasukanService.getPemasukanList(),
      masterService.getUnitList(),
      masterService.getTahunAnggaranList(),
    ]);
    setUnitList(units.filter((u) => u.isActive));
    setTahunList(ta);
    const activeTa = ta.find((t) => t.isActive);
    if (activeTa) setValue("tahunAnggaranId", activeTa.id);
    if (units.length > 0) setValue("unitId", units[0].id);

    // Filter list setoran TU strictly
    const setoranTuList = allPemasukan.filter(
      (p) =>
        p.transactionType === "TU_DEPOSIT" ||
        p.sumberDanaNama?.toLowerCase().includes("spp") ||
        p.sumberDanaNama?.toLowerCase().includes("lks") ||
        p.sumberDanaNama?.toLowerCase().includes("ujian") ||
        p.sumberDanaNama?.toLowerCase().includes("seragam") ||
        p.catatanSerahTerima?.includes("Setoran TU")
    );
    setList(setoranTuList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const tahun = tahunList.find((t) => t.id === values.tahunAnggaranId);
      const unit = unitList.find((u) => u.id === values.unitId);

      await pemasukanService.addPemasukan(
        {
          tanggal: values.tanggal,
          tahunAnggaranId: values.tahunAnggaranId,
          tahunAnggaranNama: tahun?.nama || "",
          unitId: values.unitId,
          unitNama: unit?.nama || "",
          sumberDanaId: "sd-tu",
          sumberDanaNama: `Setoran TU: ${values.jenisSetoran}`,
          nominal: values.nominal,
          keterangan: values.keterangan || `Setoran ${values.jenisSetoran} dari TU ${unit?.nama}`,
          statusDana: "DI_BENDAHARA",
          transactionType: "TU_DEPOSIT",
          catatanSerahTerima: "Setoran TU langsung diterima Bendahara",
        },
        profile?.uid || "u-demo",
        profile?.nama
      );

      reset();
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan setoran TU");
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = list.filter(
    (item) =>
      !search ||
      item.sumberDanaNama?.toLowerCase().includes(search.toLowerCase()) ||
      item.unitNama?.toLowerCase().includes(search.toLowerCase()) ||
      item.keterangan?.toLowerCase().includes(search.toLowerCase())
  );

  const totalSetoran = list.reduce((sum, item) => sum + item.nominal, 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Setoran TU ke Bendahara
            </h1>
            <p className="text-xs text-gray-500">
              Pencatatan setoran uang dari Tata Usaha (SPP, LKS, Ujian, Seragam) langsung diterima Bendahara
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{showForm ? "Tutup Form" : "Input Setoran TU"}</span>
            </button>
          )}
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-blue-800">Total Akumulasi Setoran TU</p>
              <p className="text-lg font-extrabold text-blue-900">{formatRupiah(totalSetoran)}</p>
            </div>
          </div>
          <div className="hidden sm:block text-right text-xs text-blue-700">
            <p className="font-semibold">Otomatis Masuk ke Saldo Kas Bendahara</p>
            <p className="text-blue-500">Tanpa Perlu Approval Tambahan</p>
          </div>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-md space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              Form Input Setoran TU ke Bendahara
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal *</label>
                  <input type="date" {...register("tanggal")} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Yayasan *</label>
                  <select {...register("unitId")} className={inputClass}>
                    {unitList.map((u) => (
                      <option key={u.id} value={u.id}>{u.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Setoran *</label>
                  <select {...register("jenisSetoran")} className={inputClass}>
                    <option value="SPP">SPP Bulanan</option>
                    <option value="LKS">Buku / LKS</option>
                    <option value="Ujian">Biaya Ujian</option>
                    <option value="Seragam">Pakaian Seragam</option>
                    <option value="Lain-lain">Setoran Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nominal (Rp) *</label>
                  <input type="number" min={1} placeholder="Contoh: 3000000" {...register("nominal")} className={inputClass} />
                  {errors.nominal && <p className="mt-1 text-xs text-red-600">{errors.nominal.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Keterangan</label>
                <input type="text" placeholder="Detail catatan setoran (opsional)" {...register("keterangan")} className={inputClass} />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Simpan Setoran TU
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter */}
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari setoran TU berdasarkan unit, jenis, atau keterangan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
          />
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center bg-white">
            <CheckCircle2 className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Belum ada data setoran TU</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/pemasukan/${item.id}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-emerald-400/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.sumberDanaNama}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.unitNama} · {item.tanggal}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{item.keterangan || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-blue-900">
                      {formatRupiah(item.nominal)}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Di Bendahara
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
