"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { rapbsService } from "@/services/rapbsService";
import { pengeluaranService } from "@/services/pengeluaranService";
import { Rapbs } from "@/types/rapbs";
import { PengajuanPengeluaran } from "@/types/pengeluaran";
import {
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Loader2,
  ChevronRight,
  ShieldAlert,
  FileText,
} from "lucide-react";

const formatRupiah = (num: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);

export default function ApprovalPage() {
  const { profile } = useAuth();
  const [pendingPengeluaran, setPendingPengeluaran] = useState<PengajuanPengeluaran[]>([]);
  const [pendingRapbs, setPendingRapbs] = useState<Rapbs[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pengeluaran" | "rapbs">("pengeluaran");

  const canApprove =
    profile?.role === "KETUA_YAYASAN" || profile?.role === "ADMIN";

  const loadData = async () => {
    setLoading(true);
    const [pengeluaranData, rapbsData] = await Promise.all([
      pengeluaranService.getPendingApproval(),
      rapbsService.getPendingApproval(),
    ]);
    setPendingPengeluaran(pengeluaranData);
    setPendingRapbs(rapbsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (profile && !canApprove) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm my-8">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Akses Dibatasi</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Halaman Approval hanya dapat diakses oleh Ketua Yayasan dan Admin.
          </p>
        </div>
      </AppLayout>
    );
  }

  const totalPendingCount = pendingPengeluaran.length + pendingRapbs.length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Antrian Persetujuan (Approval)
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Daftar pengajuan pengeluaran &amp; RAPBS yang memerlukan persetujuan Ketua Yayasan
          </p>
        </div>

        {/* Summary Badge */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white font-extrabold text-xl shadow-inner">
            {totalPendingCount}
          </div>
          <div>
            <p className="text-sm font-bold text-amber-950">
              {totalPendingCount === 0
                ? "Tidak ada antrian persetujuan"
                : `${totalPendingCount} item menunggu persetujuan Ketua Yayasan`}
            </p>
            <p className="text-xs text-amber-800">
              Klik item untuk membuka detail pengajuan dan memberikan keputusan Approve / Reject
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-gray-200 gap-4">
          <button
            onClick={() => setActiveTab("pengeluaran")}
            className={`flex items-center gap-2 border-b-2 pb-2.5 text-xs font-bold transition-all ${
              activeTab === "pengeluaran"
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            <span>Pengajuan Pengeluaran ({pendingPengeluaran.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("rapbs")}
            className={`flex items-center gap-2 border-b-2 pb-2.5 text-xs font-bold transition-all ${
              activeTab === "rapbs"
                ? "border-amber-600 text-amber-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Program RAPBS ({pendingRapbs.length})</span>
          </button>
        </div>

        {/* Content Tab 1: Pengajuan Pengeluaran */}
        {activeTab === "pengeluaran" && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : pendingPengeluaran.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-14 text-center bg-white">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-gray-700">Semua pengajuan pengeluaran telah diproses</p>
                <p className="text-xs text-gray-400 mt-1">
                  Tidak ada pengajuan pengeluaran yang menunggu persetujuan saat ini
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingPengeluaran.map((item) => (
                  <Link
                    key={item.id}
                    href={`/pengeluaran/${item.id}`}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 rounded-xl bg-amber-100 p-2.5 text-amber-700">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {item.penerima}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.kategoriPengeluaranNama} · {item.unitNama} · {item.tanggal}
                        </p>
                        {item.keterangan && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">{item.keterangan}</p>
                        )}
                        <p className="text-[11px] text-amber-800 font-medium mt-1">
                          Diajukan oleh: {item.createdByNama || item.createdBy || "Admin/Bendahara"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-extrabold text-amber-900">
                          {formatRupiah(item.nominal)}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                          Menunggu Persetujuan
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-amber-700 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Content Tab 2: Program RAPBS */}
        {activeTab === "rapbs" && (
          <div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
              </div>
            ) : pendingRapbs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-14 text-center bg-white">
                <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2" />
                <p className="text-sm font-semibold text-gray-700">Semua RAPBS sudah diproses</p>
                <p className="text-xs text-gray-400 mt-1">
                  Tidak ada program RAPBS yang menunggu persetujuan saat ini
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {pendingRapbs.map((item) => (
                  <Link
                    key={item.id}
                    href={`/rapbs/${item.id}`}
                    className="group flex items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-white p-4 shadow-sm hover:border-amber-400 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 rounded-xl bg-amber-100 p-2.5 text-amber-700">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {item.namaProgram}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.unitNama} · {item.tahunAnggaranNama}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {item.jenis === "PEMASUKAN" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              <TrendingUp className="h-3 w-3" />
                              Target Pemasukan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                              <TrendingDown className="h-3 w-3" />
                              Target Pengeluaran
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-extrabold text-gray-900">
                          {formatRupiah(item.target)}
                        </p>
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                          Menunggu Persetujuan
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-amber-700 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
