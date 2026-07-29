"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { pengeluaranService } from "@/services/pengeluaranService";
import {
  PengajuanPengeluaran,
  StatusPengeluaran,
  STATUS_PENGELUARAN_LABELS,
  STATUS_PENGELUARAN_COLORS,
  METODE_PEMBAYARAN_LABELS,
} from "@/types/pengeluaran";
import {
  ArrowLeft, Loader2, Trash2, AlertCircle,
  Send, CheckCircle2, XCircle, Banknote,
  FileText, TrendingDown, Edit3, Save,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const formatDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

// State step order untuk visualisasi
const STATE_STEPS: StatusPengeluaran[] = [
  "DRAFT", "MENUNGGU_APPROVAL", "APPROVED", "DIREALISASIKAN", "SELESAI",
];

const rejectSchema = z.object({ note: z.string().min(5, "Alasan minimal 5 karakter") });
const realisasiSchema = z.object({
  nomorBukti: z.string().optional(),
  catatan: z.string().optional(),
});
const approveSchema = z.object({ note: z.string().optional() });

const inputClass =
  "w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none bg-white";

export default function PengeluaranDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [data, setData] = useState<PengajuanPengeluaran | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [showApproveForm, setShowApproveForm] = useState(false);
  const [showRealisasiForm, setShowRealisasiForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  // Edit form states
  const [editNominal, setEditNominal] = useState<number>(0);
  const [editPenerima, setEditPenerima] = useState<string>("");
  const [editKeterangan, setEditKeterangan] = useState<string>("");

  const userId = profile?.uid || "u-demo";
  const userName = profile?.nama || "User";
  const role = profile?.role;

  const rejectForm = useForm({ resolver: zodResolver(rejectSchema) });
  const realisasiForm = useForm({ resolver: zodResolver(realisasiSchema) });
  const approveForm = useForm({ resolver: zodResolver(approveSchema) });

  const startEdit = () => {
    if (data) {
      setEditNominal(data.nominal);
      setEditPenerima(data.penerima);
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
      await pengeluaranService.updatePengajuan(
        data.id,
        {
          nominal: editNominal,
          penerima: editPenerima,
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
    const result = await pengeluaranService.getPengajuanById(id as string);
    setData(result);
    setLoading(false);
  };

  useEffect(() => { if (id) loadData(); }, [id]);

  const handleSubmitApproval = async () => {
    if (!data) return;
    setProcessing(true); setError(null);
    try {
      await pengeluaranService.submitForApproval(data.id, userId);
      await loadData();
    } catch (e: any) { setError(e.message); } finally { setProcessing(false); }
  };

  const handleApprove = async (values: any) => {
    if (!data) return;
    setProcessing(true); setError(null);
    try {
      await pengeluaranService.approve(data.id, userId, userName, values.note || "Disetujui");
      await loadData(); setShowApproveForm(false);
    } catch (e: any) { setError(e.message); } finally { setProcessing(false); }
  };

  const handleReject = async (values: any) => {
    if (!data) return;
    setProcessing(true); setError(null);
    try {
      await pengeluaranService.reject(data.id, userId, userName, values.note);
      await loadData(); setShowRejectForm(false);
    } catch (e: any) { setError(e.message); } finally { setProcessing(false); }
  };

  const handleRealisasi = async (values: any) => {
    if (!data) return;
    setProcessing(true); setError(null);
    try {
      await pengeluaranService.realisasikan(data.id, userId, userName, values.nomorBukti, values.catatan);
      await loadData(); setShowRealisasiForm(false);
    } catch (e: any) { setError(e.message); } finally { setProcessing(false); }
  };

  const handleDelete = async () => {
    if (!data) return;
    if (!confirm("Hapus pengajuan ini? (Soft Delete)")) return;
    try {
      await pengeluaranService.deletePengajuan(data.id, userId);
      router.push("/pengeluaran");
    } catch (e: any) { setError(e.message); }
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-emerald-600" /></div></AppLayout>;
  if (!data) return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">Pengajuan tidak ditemukan</p>
        <Link href="/pengeluaran" className="mt-3 text-xs text-emerald-600 hover:underline">← Kembali</Link>
      </div>
    </AppLayout>
  );

  const canSubmit = data.status === "DRAFT" && (role === "ADMIN" || role === "BENDAHARA_YAYASAN");
  const canApprove = data.status === "MENUNGGU_APPROVAL" && (role === "KETUA_YAYASAN" || role === "ADMIN");
  const canRealisasi = data.status === "APPROVED" && (role === "ADMIN" || role === "BENDAHARA_YAYASAN");
  const canDelete = (data.status === "DRAFT" || data.status === "REJECTED") && (role === "ADMIN" || role === "BENDAHARA_YAYASAN");

  // Step index for flow visualizer
  const currentStepIdx = data.status === "REJECTED" ? 1 : STATE_STEPS.indexOf(data.status);

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/pengeluaran" className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">Detail Pengajuan</h1>
              <p className="text-xs text-gray-500">{data.kategoriPengeluaranNama} · {data.unitNama}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {canDelete && (
              <button
                onClick={startEdit}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                title="Edit Pengajuan"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
            )}
            {canDelete && (
              <button onClick={handleDelete} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Hapus">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Edit Form Modal */}
        {showEditForm && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-emerald-900">Form Edit Pengajuan Pengeluaran</h3>
              <button onClick={() => setShowEditForm(false)} className="text-xs text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Penerima *</label>
                <input
                  type="text"
                  value={editPenerima}
                  onChange={(e) => setEditPenerima(e.target.value)}
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Keterangan / Peruntukan</label>
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
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />{error}
          </div>
        )}

        {/* State Flow Visualizer */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Alur Pengajuan</p>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${STATUS_PENGELUARAN_COLORS[data.status]}`}>
              {STATUS_PENGELUARAN_LABELS[data.status]}
            </span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STATE_STEPS.map((s, i) => {
              const isActive = i === currentStepIdx;
              const isDone = i < currentStepIdx;
              const isRejected = data.status === "REJECTED" && s === "MENUNGGU_APPROVAL";
              return (
                <React.Fragment key={s}>
                  <div className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    isRejected ? "bg-red-100 text-red-700" :
                    isActive ? "bg-emerald-600 text-white" :
                    isDone ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {STATUS_PENGELUARAN_LABELS[s]}
                  </div>
                  {i < STATE_STEPS.length - 1 && (
                    <div className={`text-xs shrink-0 ${isDone ? "text-emerald-400" : "text-gray-200"}`}>→</div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {data.status === "REJECTED" && (
            <div className="mt-3 rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-xs font-semibold text-red-700">Ditolak oleh {data.approvalByNama}</p>
              <p className="text-xs text-red-600 mt-0.5">{data.approvalNote}</p>
            </div>
          )}
        </div>

        {/* Detail Info */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Informasi Pengajuan</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-400">Nominal</p>
              <p className="text-lg font-extrabold text-red-600 mt-0.5">{formatRupiah(data.nominal)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Tanggal</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.tanggal}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Penerima</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.penerima}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Metode Pembayaran</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {METODE_PEMBAYARAN_LABELS[data.metodePembayaran]}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Kategori</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{data.kategoriPengeluaranNama}</p>
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
                <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{data.keterangan}</p>
              </div>
            )}
          </div>

          {/* Approval Info */}
          {(data.status === "APPROVED" || data.status === "DIREALISASIKAN" || data.status === "SELESAI") && data.approvalAt && (
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 space-y-1">
              <p className="text-xs font-bold text-blue-800">✓ Disetujui</p>
              <p className="text-xs text-blue-700">
                Oleh <strong>{data.approvalByNama}</strong> · {formatDate(data.approvalAt)}
              </p>
              {data.approvalNote && <p className="text-xs text-blue-600 italic">"{data.approvalNote}"</p>}
            </div>
          )}

          {/* Realisasi Info */}
          {(data.status === "DIREALISASIKAN" || data.status === "SELESAI") && data.realisasiAt && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 space-y-1">
              <p className="text-xs font-bold text-emerald-800">✓ Direalisasikan</p>
              <p className="text-xs text-emerald-700">
                Oleh <strong>{data.dibayarOlehNama}</strong> · {formatDate(data.realisasiAt)}
              </p>
              {data.nomorBukti && <p className="text-xs text-emerald-700">No. Bukti: <strong>{data.nomorBukti}</strong></p>}
              {data.catatanRealisasi && <p className="text-xs text-emerald-600 italic">"{data.catatanRealisasi}"</p>}
            </div>
          )}
        </div>

        {/* ACTION: Submit to Approval (Bendahara/Admin — DRAFT) */}
        {canSubmit && (
          <button
            onClick={handleSubmitApproval}
            disabled={processing}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Ajukan ke Ketua Yayasan
          </button>
        )}

        {/* ACTION: Approve / Reject (Ketua Yayasan / Admin — MENUNGGU_APPROVAL) */}
        {canApprove && !showApproveForm && !showRejectForm && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setShowApproveForm(true)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" /> Setujui
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-700 hover:bg-red-100 transition-colors"
            >
              <XCircle className="h-4 w-4" /> Tolak
            </button>
          </div>
        )}

        {/* Approve form */}
        {showApproveForm && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
            <p className="text-sm font-bold text-emerald-900">Konfirmasi Persetujuan</p>
            <form onSubmit={approveForm.handleSubmit(handleApprove)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-emerald-800 mb-1">Catatan Persetujuan (Opsional)</label>
                <input type="text" placeholder="Contoh: Disetujui, segera direalisasikan" {...approveForm.register("note")}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm bg-white" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={processing}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  Konfirmasi Setujui
                </button>
                <button type="button" onClick={() => setShowApproveForm(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-white">Batal</button>
              </div>
            </form>
          </div>
        )}

        {/* Reject form */}
        {showRejectForm && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
            <p className="text-sm font-bold text-red-900">Alasan Penolakan</p>
            <form onSubmit={rejectForm.handleSubmit(handleReject)} className="space-y-3">
              <div>
                <textarea
                  placeholder="Tuliskan alasan penolakan yang jelas..."
                  rows={3}
                  {...rejectForm.register("note")}
                  className="w-full rounded-xl border border-red-200 px-3 py-2 text-sm bg-white focus:border-red-400 focus:outline-none"
                />
                {rejectForm.formState.errors.note && (
                  <p className="text-xs text-red-600 mt-1">{rejectForm.formState.errors.note.message as string}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={processing}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50">
                  {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Konfirmasi Tolak
                </button>
                <button type="button" onClick={() => setShowRejectForm(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-white">Batal</button>
              </div>
            </form>
          </div>
        )}

        {/* ACTION: Realisasi (Bendahara/Admin — APPROVED) */}
        {canRealisasi && !showRealisasiForm && (
          <button
            onClick={() => setShowRealisasiForm(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Banknote className="h-4 w-4" />
            Realisasikan Pembayaran
          </button>
        )}

        {/* Realisasi form */}
        {showRealisasiForm && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
            <p className="text-sm font-bold text-emerald-900">Form Realisasi Pembayaran</p>
            <p className="text-xs text-emerald-700 -mt-1">
              Setelah dikonfirmasi, nominal <strong>{formatRupiah(data.nominal)}</strong> akan dicatat sebagai realisasi pengeluaran.
            </p>
            <form onSubmit={realisasiForm.handleSubmit(handleRealisasi)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-emerald-800 mb-1">Nomor Bukti / Kwitansi (Opsional)</label>
                <input type="text" placeholder="Contoh: KWT-2026-001" {...realisasiForm.register("nomorBukti")}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-emerald-800 mb-1">Catatan (Opsional)</label>
                <input type="text" {...realisasiForm.register("catatan")}
                  className="w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm bg-white" />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={processing}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">
                  {processing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Banknote className="h-3.5 w-3.5" />}
                  Konfirmasi Realisasi
                </button>
                <button type="button" onClick={() => setShowRealisasiForm(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-white">Batal</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
