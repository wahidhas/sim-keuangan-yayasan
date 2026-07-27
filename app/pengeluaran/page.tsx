"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { pengeluaranService } from "@/services/pengeluaranService";
import { masterService } from "@/services/masterService";
import {
  PengajuanPengeluaran,
  STATUS_PENGELUARAN_LABELS,
  STATUS_PENGELUARAN_COLORS,
  StatusPengeluaran,
} from "@/types/pengeluaran";
import { TahunAnggaran } from "@/types/master";
import {
  TrendingDown, Plus, Search, Loader2, ChevronRight,
  Clock, CheckCircle2, XCircle, FileText,
} from "lucide-react";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function PengeluaranListPage() {
  const { profile } = useAuth();
  const [list, setList] = useState<PengajuanPengeluaran[]>([]);
  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);
  const [selectedTahun, setSelectedTahun] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const canCreate = profile?.role === "ADMIN" || profile?.role === "BENDAHARA_YAYASAN";

  useEffect(() => {
    const loadMeta = async () => {
      const ta = await masterService.getTahunAnggaranList();
      setTahunList(ta);
      const active = ta.find((t) => t.isActive);
      if (active) setSelectedTahun(active.id);
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await pengeluaranService.getPengajuanList({
        tahunAnggaranId: selectedTahun || undefined,
      });
      setList(data);
      setLoading(false);
    };
    load();
  }, [selectedTahun]);

  const filtered = list.filter((p) => {
    const matchStatus = !filterStatus || p.status === filterStatus;
    const matchSearch =
      !search ||
      p.penerima.toLowerCase().includes(search.toLowerCase()) ||
      (p.kategoriPengeluaranNama || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.unitNama || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Stats
  const totalDraft = list.filter((p) => p.status === "DRAFT").length;
  const totalPending = list.filter((p) => p.status === "MENUNGGU_APPROVAL").length;
  const totalApproved = list.filter((p) => p.status === "APPROVED").length;
  const totalRealisasi = list
    .filter((p) => p.status === "DIREALISASIKAN" || p.status === "SELESAI")
    .reduce((s, p) => s + p.nominal, 0);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Pengajuan Pengeluaran
            </h1>
            <p className="text-xs text-gray-500">
              Kelola pengajuan belanja &amp; realisasi pengeluaran yayasan
            </p>
          </div>
          {canCreate && (
            <Link
              href="/pengeluaran/baru"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Pengajuan</span>
            </Link>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
            <p className="text-xs text-gray-500">Draft</p>
            <p className="text-lg font-extrabold text-gray-700">{totalDraft}</p>
          </div>
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 shadow-sm">
            <p className="text-xs text-amber-700">Menunggu</p>
            <p className="text-lg font-extrabold text-amber-800">{totalPending}</p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 shadow-sm">
            <p className="text-xs text-blue-700">Disetujui</p>
            <p className="text-lg font-extrabold text-blue-800">{totalApproved}</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 shadow-sm">
            <p className="text-xs text-emerald-700">Total Realisasi</p>
            <p className="text-sm font-extrabold text-emerald-800">{formatRupiah(totalRealisasi)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
          >
            <option value="">Semua Tahun Anggaran</option>
            {tahunList.map((ta) => (
              <option key={ta.id} value={ta.id}>
                {ta.nama} {ta.isActive ? "(Aktif)" : ""}
              </option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
          >
            <option value="">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="MENUNGGU_APPROVAL">Menunggu Persetujuan</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak</option>
            <option value="DIREALISASIKAN">Direalisasikan</option>
          </select>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari penerima, kategori, unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <TrendingDown className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-500">Belum ada pengajuan pengeluaran</p>
            {canCreate && (
              <p className="text-xs text-gray-400 mt-1">Klik "Buat Pengajuan" untuk mulai</p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/pengeluaran/${item.id}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-emerald-400/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-0.5 rounded-xl p-2.5 ${
                    item.status === "MENUNGGU_APPROVAL" ? "bg-amber-50 text-amber-600" :
                    item.status === "APPROVED" ? "bg-blue-50 text-blue-600" :
                    item.status === "DIREALISASIKAN" ? "bg-emerald-50 text-emerald-600" :
                    item.status === "REJECTED" ? "bg-red-50 text-red-500" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    <TrendingDown className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.penerima}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.kategoriPengeluaranNama} · {item.unitNama} · {item.tanggal}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{item.keterangan || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-extrabold text-gray-900">
                      {formatRupiah(item.nominal)}
                    </p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_PENGELUARAN_COLORS[item.status]}`}>
                      {STATUS_PENGELUARAN_LABELS[item.status]}
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
