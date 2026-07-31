"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { pemasukanService } from "@/services/pemasukanService";
import { masterService } from "@/services/masterService";
import { LedgerService } from "@/services/ledgerService";
import { LedgerEngine } from "@/src/lib/ledger/ledger-engine";
import { Pemasukan } from "@/types/pemasukan";
import {
  Landmark,
  Plus,
  Search,
  Loader2,
  ChevronRight,
  Save,
  Building2,
  ArrowRightLeft,
  CheckCircle2,
  Trash2,
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
  namaBank: z.string().min(1, "Nama Bank wajib diisi"),
  nomorReferensi: z.string().optional(),
  nominal: z.coerce.number().min(1, "Nominal harus lebih dari 0"),
  catatan: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const inputClass =
  "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white";

export default function SetorBankPage() {
  const { profile } = useAuth();
  const [list, setList] = useState<Pemasukan[]>([]);
  const [balances, setBalances] = useState({ saldoBendahara: 0, saldoBank: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");

  const canCreate =
    profile?.role === "ADMIN" || profile?.role === "BENDAHARA_YAYASAN";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      namaBank: "Bank BRI Yayasan",
      nominal: 0,
    },
  });

  const loadData = async () => {
    setLoading(true);
    const [selesaiList, summary] = await Promise.all([
      pemasukanService.getSelesaiDiBank(),
      LedgerEngine.calculate(),
    ]);
    setList(selesaiList);
    setBalances({
      saldoBendahara: summary.saldoBendahara,
      saldoBank: summary.saldoBank,
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (values: FormValues) => {
    if (values.nominal > balances.saldoBendahara) {
      alert(
        `Nominal setoran melampaui Saldo Kas Bendahara! Saldo Kas Bendahara saat ini: ${formatRupiah(
          balances.saldoBendahara
        )}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const tahunList = await masterService.getTahunAnggaranList();
      const activeTahun = tahunList.find((t) => t.isActive);

      // Record setoran ke Bank (Transfer Internal)
      await pemasukanService.addPemasukan(
        {
          tanggal: new Date().toISOString().split("T")[0],
          tahunAnggaranId: activeTahun?.id || "ta-active",
          tahunAnggaranNama: activeTahun?.nama || "",
          unitId: "u-yayasan",
          sumberDanaId: "sd-bank",
          sumberDanaNama: `Setoran Bank: ${values.namaBank}`,
          nominal: values.nominal,
          keterangan: values.catatan || `Setoran tunai ke ${values.namaBank}`,
          statusDana: "SETORAN_BANK",
          transactionType: "BANK_TRANSFER",
          namaBank: values.namaBank,
          nomorReferensi: values.nomorReferensi || null,
        },
        profile?.uid || "u-demo",
        profile?.nama
      );

      reset();
      setShowForm(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan setoran ke Bank");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi setoran bank ini? Saldo kas & bank akan direkalkulasi otomatis.")) return;
    try {
      await pemasukanService.deletePemasukan(id, profile?.uid || "u-demo");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus setoran bank");
    }
  };

  const filtered = list.filter(
    (item) =>
      !search ||
      item.namaBank?.toLowerCase().includes(search.toLowerCase()) ||
      item.nomorReferensi?.toLowerCase().includes(search.toLowerCase()) ||
      item.keterangan?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Setoran ke Bank
            </h1>
            <p className="text-xs text-gray-500">
              Pencatatan perpindahan uang tunai dari Kas Bendahara ke Rekening Bank Yayasan
            </p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>{showForm ? "Tutup Form" : "Input Setoran Bank"}</span>
            </button>
          )}
        </div>

        {/* Saldo Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-blue-700">Saldo Kas Bendahara (Tersedia)</p>
              <p className="text-xl font-extrabold text-blue-900">{formatRupiah(balances.saldoBendahara)}</p>
            </div>
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-medium text-emerald-700">Saldo Rekening Bank (Tersimpan)</p>
              <p className="text-xl font-extrabold text-emerald-900">{formatRupiah(balances.saldoBank)}</p>
            </div>
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
              <Landmark className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Modal Form */}
        {showForm && (
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-md space-y-4">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Landmark className="h-4 w-4 text-emerald-600" />
              Form Setoran Kas Bendahara ke Bank
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Bank *</label>
                  <input type="text" placeholder="Contoh: Bank BRI / Bank Mandiri" {...register("namaBank")} className={inputClass} />
                  {errors.namaBank && <p className="mt-1 text-xs text-red-600">{errors.namaBank.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nominal Setor (Rp) *</label>
                  <input type="number" min={1} placeholder="Contoh: 5000000" {...register("nominal")} className={inputClass} />
                  {errors.nominal && <p className="mt-1 text-xs text-red-600">{errors.nominal.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Nomor Referensi / Bukti (Opsional)</label>
                  <input type="text" placeholder="Contoh: REF20260731001" {...register("nomorReferensi")} className={inputClass} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan</label>
                  <input type="text" placeholder="Catatan tambahan" {...register("catatan")} className={inputClass} />
                </div>
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
                  Simpan Setoran Bank
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari histori setoran bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
          />
        </div>

        {/* History List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center bg-white">
            <CheckCircle2 className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">Belum ada data setoran ke Bank</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <Landmark className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.namaBank || item.sumberDanaNama || "Bank Yayasan"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Ref: {item.nomorReferensi || "—"} · {item.tanggal}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{item.keterangan || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-emerald-900">
                      {formatRupiah(item.nominal)}
                    </p>
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Transfer Bank
                    </span>
                  </div>
                  {canCreate && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Hapus setoran bank"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
