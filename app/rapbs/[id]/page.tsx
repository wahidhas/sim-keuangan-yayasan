"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { rapbsService } from "@/services/rapbsService";
import {
  Rapbs,
  StatusRapbs,
  STATUS_RAPBS_LABELS,
  STATUS_RAPBS_COLORS,
  RAPBS_TRANSITIONS,
} from "@/types/rapbs";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  TrendingUp,
  TrendingDown,
  Loader2,
  Trash2,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

const formatRupiah = (num: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);

export default function RapbsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [rapbs, setRapbs] = useState<Rapbs | null>(null);
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [note, setNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = profile?.uid || "u-demo";
  const role = profile?.role;

  const loadData = async () => {
    setLoading(true);
    const data = await rapbsService.getRapbsById(id as string);
    setRapbs(data);
    setLoading(false);
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleTransition = async (toStatus: StatusRapbs, noteText?: string) => {
    if (!rapbs) return;
    setTransitioning(true);
    setError(null);
    try {
      await rapbsService.transitionStatus(rapbs.id, toStatus, userId, noteText);
      await loadData();
      setShowRejectForm(false);
      setNote("");
    } catch (err: any) {
      setError(err.message || "Gagal mengubah status");
    } finally {
      setTransitioning(false);
    }
  };

  const handleDelete = async () => {
    if (!rapbs) return;
    if (!confirm("Hapus RAPBS ini? (Soft Delete — data tidak dihapus permanen)")) return;
    try {
      await rapbsService.deleteRapbs(rapbs.id, userId);
      router.push("/rapbs");
    } catch (err: any) {
      setError(err.message || "Gagal menghapus");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </div>
      </AppLayout>
    );
  }

  if (!rapbs) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">RAPBS tidak ditemukan</p>
          <Link href="/rapbs" className="mt-3 text-xs text-emerald-600 hover:underline">
            ← Kembali ke daftar RAPBS
          </Link>
        </div>
      </AppLayout>
    );
  }

  const allowedNext = RAPBS_TRANSITIONS[rapbs.status];
  const canAjukan = role === "ADMIN" && rapbs.status === "DRAFT";
  const canApprove = (role === "KETUA_YAYASAN" || role === "ADMIN") && rapbs.status === "MENUNGGU_APPROVAL";
  const canTutup = role === "ADMIN" && rapbs.status === "APPROVED";
  const canDelete = role === "ADMIN" && (rapbs.status === "DRAFT" || rapbs.status === "REJECTED");

  return (
    <AppLayout>
      <div className="mx-auto max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/rapbs"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight line-clamp-1">
                {rapbs.namaProgram}
              </h1>
              <p className="text-xs text-gray-500">
                Detail RAPBS · {rapbs.unitNama} · {rapbs.tahunAnggaranNama}
              </p>
            </div>
          </div>
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

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {/* Status Badge & State Machine Indicator */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status Saat Ini
            </span>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
                STATUS_RAPBS_COLORS[rapbs.status]
              }`}
            >
              {STATUS_RAPBS_LABELS[rapbs.status]}
            </span>
          </div>

          {/* State Machine Flow Visualization */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs pb-1">
            {(["DRAFT", "MENUNGGU_APPROVAL", "APPROVED", "DITUTUP"] as StatusRapbs[]).map(
              (s, i) => (
                <React.Fragment key={s}>
                  <div
                    className={`shrink-0 rounded-full px-2.5 py-1 font-semibold transition-colors ${
                      rapbs.status === s
                        ? "bg-emerald-600 text-white"
                        : rapbs.status === "REJECTED" && s === "DRAFT"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {STATUS_RAPBS_LABELS[s]}
                  </div>
                  {i < 3 && <div className="text-gray-300 shrink-0">→</div>}
                </React.Fragment>
              )
            )}
            {rapbs.status === "REJECTED" && (
              <>
                <div className="text-gray-300 shrink-0">|</div>
                <div className="shrink-0 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                  Ditolak
                </div>
              </>
            )}
          </div>
        </div>

        {/* Detail Card */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-900">Detail RAPBS</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-400">Jenis</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {rapbs.jenis === "PEMASUKAN" ? (
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <p className="text-sm font-bold text-gray-900">{rapbs.jenis}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400">Target Anggaran</p>
              <p className="text-sm font-extrabold text-gray-900 mt-0.5">
                {formatRupiah(rapbs.target)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Tahun Anggaran</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">
                {rapbs.tahunAnggaranNama}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Unit</p>
              <p className="text-sm font-semibold text-gray-900 mt-0.5">{rapbs.unitNama}</p>
            </div>

            {rapbs.jenis === "PEMASUKAN" && rapbs.sumberDanaNama && (
              <div>
                <p className="text-xs text-gray-400">Sumber Dana</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {rapbs.sumberDanaNama}
                </p>
              </div>
            )}

            {rapbs.jenis === "PENGELUARAN" && rapbs.kategoriPengeluaranNama && (
              <div>
                <p className="text-xs text-gray-400">Kategori Pengeluaran</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {rapbs.kategoriPengeluaranNama}
                </p>
              </div>
            )}

            {rapbs.keterangan && (
              <div className="sm:col-span-2">
                <p className="text-xs text-gray-400">Keterangan</p>
                <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">
                  {rapbs.keterangan}
                </p>
              </div>
            )}
          </div>

          {/* Approval/Rejection Notes */}
          {rapbs.approvedNote && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
              <p className="text-xs font-semibold text-emerald-700">Catatan Persetujuan:</p>
              <p className="text-xs text-emerald-800 mt-0.5">{rapbs.approvedNote}</p>
            </div>
          )}
          {rapbs.rejectedNote && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-3">
              <p className="text-xs font-semibold text-red-700">Alasan Penolakan:</p>
              <p className="text-xs text-red-800 mt-0.5">{rapbs.rejectedNote}</p>
            </div>
          )}
        </div>

        {/* Action Buttons berdasarkan State & Role */}
        <div className="space-y-3">
          {/* Admin: Ajukan ke Ketua Yayasan */}
          {canAjukan && (
            <button
              onClick={() => handleTransition("MENUNGGU_APPROVAL")}
              disabled={transitioning}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {transitioning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Ajukan ke Ketua Yayasan
            </button>
          )}

          {/* Ketua Yayasan / Admin: Approve */}
          {canApprove && !showRejectForm && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleTransition("APPROVED", "Disetujui oleh Ketua Yayasan")}
                disabled={transitioning}
                className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {transitioning ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Setujui
              </button>
              <button
                onClick={() => setShowRejectForm(true)}
                className="flex items-center justify-center gap-2 rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3.5 text-sm font-bold text-red-700 hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Tolak
              </button>
            </div>
          )}

          {/* Reject Form */}
          {showRejectForm && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-3">
              <p className="text-sm font-bold text-red-800">Alasan Penolakan</p>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Tuliskan alasan penolakan RAPBS ini..."
                rows={3}
                className="w-full rounded-xl border border-red-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 bg-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleTransition("REJECTED", note)}
                  disabled={transitioning || !note.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {transitioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  Konfirmasi Tolak
                </button>
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-white"
                >
                  Batal
                </button>
              </div>
            </div>
          )}

          {/* Admin: Tutup RAPBS */}
          {canTutup && (
            <button
              onClick={() => {
                if (confirm("Tutup RAPBS ini? Status akan berubah menjadi DITUTUP.")) {
                  handleTransition("DITUTUP");
                }
              }}
              disabled={transitioning}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              {transitioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Tutup RAPBS
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
