"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { pemasukanService } from "@/services/pemasukanService";
import {
  Pemasukan,
  STATUS_DANA_LABELS,
  STATUS_DANA_COLORS,
  STATUS_DANA_STEP,
  StatusDana,
} from "@/types/pemasukan";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Landmark,
  Building2,
  Wallet,
  FileText,
  Edit3,
  Save,
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

const formatDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) : "—";

// Schema untuk serah terima
const serahSchema = z.object({
  penerimaNama: z.string().min(2, "Nama penerima wajib diisi"),
  catatan: z.string().optional(),
});

// Schema untuk setor bank
const setorSchema = z.object({
  namaBank: z.string().min(2, "Nama bank wajib diisi"),
  nomorReferensi: z.string().optional(),
  catatan: z.string().optional(),
});

const inputClass =
  "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 bg-white";

export default function PemasukanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [data, setData] = useState<Pemasukan | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSerahForm, setShowSerahForm] = useState(false);
  const [showSetorForm, setShowSetorForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Edit states
  const [editNominal, setEditNominal] = useState<number>(0);
  const [editTanggal, setEditTanggal] = useState<string>("");
  const [editKeterangan, setEditKeterangan] = useState<string>("");

  const userId = profile?.uid || "u-demo";
  const userName = profile?.nama || "User";
  const role = profile?.role;

  const serahForm = useForm({ resolver: zodResolver(serahSchema) });
  const setorForm = useForm({ resolver: zodResolver(setorSchema) });

  const startEdit = () => {
    if (data) {
      setEditNominal(data.nominal);
      setEditTanggal(data.tanggal);
      setEditKeterangan(data.keterangan || "");
      setShowEditForm(true);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setProcessing(true);
    setError(null);
    try {
      await pemasukanService.updatePemasukan(
        data.id,
        {
          nominal: editNominal,
          tanggal: editTanggal,
          keterangan: editKeterangan,
        },
        userId
      );
      await loadData();
      setShowEditForm(false);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan perubahan");
    } finally {
      setProcessing(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const result = await pemasukanService.getPemasukanById(id as string);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleSerahTerima = async (values: any) => {
    if (!data) return;
    setProcessing(true);
    setError(null);
    try {
      await pemasukanService.serahTerimaKeBendahara(
        data.id,
        userId,
        userName
      );
      await loadData();
      setShowSerahForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleSetorBank = async (values: any) => {
    if (!data) return;
    setProcessing(true);
    setError(null);
    try {
      await pemasukanService.setorKeBank(
        data.id,
        values.namaBank,
        values.nomorReferensi,
        userId,
        userName
      );
      await loadData();
      setShowSetorForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!data) return;
    if (!confirm("Hapus pemasukan ini? (Soft Delete)")) return;
    try {
      await pemasukanService.deletePemasukan(data.id, userId);
      router.push("/pemasukan");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const canSerahTerima =
    data?.statusDana === "DI_TU" &&
    (role === "ADMIN" || role === "STAF_TU" || role === "BENDAHARA_YAYASAN");
  const canSetorBank =
    data?.statusDana === "DI_BENDAHARA" &&
    (role === "ADMIN" || role === "BENDAHARA_YAYASAN");
  const canDelete =
    role === "ADMIN" || role === "STAF_TU" || role === "BENDAHARA_YAYASAN";

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      </AppLayout>
    );
  }

  if (!data) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Pemasukan tidak ditemukan</p>
          <Link href="/pemasukan" className="mt-3 text-xs text-emerald-600 hover:underline">
            ← Kembali
          </Link>
        </div>
      </AppLayout>
    );
  }

  const stepIcons = [
    { label: "Di TU", Icon: Wallet, status: "DI_TU" as StatusDana },
    { label: "Di Bendahara", Icon: Building2, status: "DI_BENDAHARA" as StatusDana },
    { label: "Di Bank", Icon: Landmark, status: "DI_BANK" as StatusDana },
    { label: "Selesai", Icon: CheckCircle2, status: "SELESAI" as StatusDana },
  ];

  const currentStep = STATUS_DANA_STEP[data.statusDana];

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/pemasukan"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">
                Detail Pemasukan
              </h1>
              <p className="text-xs text-gray-500">
                {data.sumberDanaNama} · {data.unitNama}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {data.statusDana === "DI_TU" && (role === "ADMIN" || role === "STAF_TU") && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                title="Edit Pemasukan"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={handleDelete}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Hapus (Soft Delete)"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Edit Form Modal */}
        {showEditForm && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-900">Form Edit Pemasukan</h3>
              <button onClick={() => setShowEditForm(false)} className="text-xs text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tanggal *</label>
                <input
                  type="date"
                  value={editTanggal}
                  onChange={(e) => setEditTanggal(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  min={1}
                  value={editNominal}
                  onChange={(e) => setEditNominal(Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Keterangan</label>
                <textarea
                  rows={2}
                  value={editKeterangan}
                  onChange={(e) => setEditKeterangan(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="rounded-xl border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Flow Steps */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
            Alur Posisi Dana
          </p>
          <div className="flex items-center gap-1">
            {stepIcons.map((step, i) => {
              const isActive = STATUS_DANA_STEP[step.status] === currentStep;
              const isDone = STATUS_DANA_STEP[step.status] < currentStep;
              return (
                <React.Fragment key={step.status}>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-colors ${
                        isActive
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                          : isDone
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      <step.Icon className="h-4 w-4" />
                    </div>
                    <p
                      className={`text-center text-xs font-medium leading-tight ${
                        isActive
                          ? "text-emerald-700"
                          : isDone
                          ? "text-emerald-600"
                          : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                  </div>
                  {i < stepIcons.length - 1 && (
                    <ArrowRight
                      className={`h-4 w-4 shrink-0 mb-4 ${
                        isDone ? "text-emerald-400" : "text-gray-200"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Detail Info */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Informasi Pemasukan</h2>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                STATUS_DANA_COLORS[data.statusDana]
              }`}
            >
              {STATUS_DANA_LABELS[data.statusDana]}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">Nominal</p>
              <p className="text-lg font-extrabold text-emerald-700 mt-0.5">
                {formatRupiah(data.nominal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tanggal</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.tanggal}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Sumber Dana</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.sumberDanaNama}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Unit</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.unitNama}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tahun Anggaran</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.tahunAnggaranNama}</p>
            </div>
            {data.rapbsNama && (
              <div>
                <p className="text-xs text-gray-400">RAPBS</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.rapbsNama}</p>
              </div>
            )}
            {data.keterangan && (
              <div className="col-span-2">
                <p className="text-xs text-gray-400">Keterangan</p>
                <p className="text-sm text-gray-700 mt-0.5">{data.keterangan}</p>
              </div>
            )}
          </div>

          {/* Serah Terima Info */}
          {data.diserahkanAt && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-1">
              <p className="text-xs font-bold text-blue-800">Serah Terima ke Bendahara</p>
              <p className="text-xs text-blue-700">
                Diserahkan oleh <strong>{data.diserahkanByNama}</strong> pada{" "}
                {formatDate(data.diserahkanAt)}
              </p>
              {data.diterimaByNama && (
                <p className="text-xs text-blue-700">
                  Diterima oleh: <strong>{data.diterimaByNama}</strong>
                </p>
              )}
              {data.catatanSerahTerima && (
                <p className="text-xs text-blue-600 italic">{data.catatanSerahTerima}</p>
              )}
            </div>
          )}

          {/* Setor Bank Info */}
          {data.disetorAt && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 space-y-1">
              <p className="text-xs font-bold text-emerald-800">Setor ke Bank</p>
              <p className="text-xs text-emerald-700">
                Disetorkan oleh <strong>{data.disetorByNama}</strong> pada{" "}
                {formatDate(data.disetorAt)}
              </p>
              {data.namaBank && (
                <p className="text-xs text-emerald-700">
                  Bank: <strong>{data.namaBank}</strong>
                  {data.nomorReferensi && ` · Ref: ${data.nomorReferensi}`}
                </p>
              )}
              {data.catatanSetoran && (
                <p className="text-xs text-emerald-600 italic">{data.catatanSetoran}</p>
              )}
            </div>
          )}
        </div>



        {/* Action: Setor Bank */}
        {canSetorBank && !showSetorForm && (
          <button
            onClick={() => setShowSetorForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Landmark className="h-4 w-4" />
            Setor ke Bank
          </button>
        )}

        {showSetorForm && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
            <p className="text-sm font-bold text-emerald-900">Form Setoran Bank</p>
            <form onSubmit={setorForm.handleSubmit(handleSetorBank)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-emerald-800 mb-1">
                  Nama Bank *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Bank BRI, Bank Mandiri"
                  {...setorForm.register("namaBank")}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none"
                />
                {setorForm.formState.errors.namaBank && (
                  <p className="text-xs text-red-600 mt-1">
                    {setorForm.formState.errors.namaBank.message as string}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-800 mb-1">
                  Nomor Referensi / Bukti Transfer (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: TRF20260720001"
                  {...setorForm.register("nomorReferensi")}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-800 mb-1">
                  Catatan (Opsional)
                </label>
                <input
                  type="text"
                  {...setorForm.register("catatan")}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm bg-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={processing}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Landmark className="h-3.5 w-3.5" />}
                  Konfirmasi Setor Bank
                </button>
                <button
                  type="button"
                  onClick={() => setShowSetorForm(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-white"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
