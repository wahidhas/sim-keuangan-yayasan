"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { rapbsService } from "@/services/rapbsService";
import { masterService } from "@/services/masterService";
import { Rapbs, StatusRapbs, STATUS_RAPBS_LABELS, STATUS_RAPBS_COLORS } from "@/types/rapbs";
import { TahunAnggaran } from "@/types/master";
import {
  FileText,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Loader2,
  ChevronRight,
  Filter,
} from "lucide-react";

const formatRupiah = (num: number): string =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(num);

export default function RapbsListPage() {
  const { profile } = useAuth();
  const [list, setList] = useState<Rapbs[]>([]);
  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);
  const [selectedTahun, setSelectedTahun] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterJenis, setFilterJenis] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const canCreate = profile?.role === "ADMIN";
  const canApprove = profile?.role === "KETUA_YAYASAN" || profile?.role === "ADMIN";

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
    const loadData = async () => {
      setLoading(true);
      const data = await rapbsService.getRapbsList(selectedTahun || undefined);
      setList(data);
      setLoading(false);
    };
    loadData();
  }, [selectedTahun]);

  const filtered = list.filter((r) => {
    const matchStatus = !filterStatus || r.status === filterStatus;
    const matchJenis = !filterJenis || r.jenis === filterJenis;
    const matchSearch =
      !search ||
      r.namaProgram.toLowerCase().includes(search.toLowerCase()) ||
      (r.unitNama || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchJenis && matchSearch;
  });

  // Totals
  const totalTarget = filtered.reduce((s, r) => s + r.target, 0);
  const totalPemasukan = filtered
    .filter((r) => r.jenis === "PEMASUKAN" && r.status === "APPROVED")
    .reduce((s, r) => s + r.target, 0);
  const totalPengeluaran = filtered
    .filter((r) => r.jenis === "PENGELUARAN" && r.status === "APPROVED")
    .reduce((s, r) => s + r.target, 0);
  const pendingCount = list.filter((r) => r.status === "MENUNGGU_APPROVAL").length;

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">RAPBS</h1>
            <p className="text-xs text-gray-500">
              Rencana Anggaran Pendapatan &amp; Belanja Sekolah
            </p>
          </div>
          {canCreate && (
            <Link
              href="/rapbs/baru"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah</span>
            </Link>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Target Pemasukan (Approved)</p>
            <p className="mt-1 text-lg font-extrabold text-emerald-700">
              {formatRupiah(totalPemasukan)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Target Pengeluaran (Approved)</p>
            <p className="mt-1 text-lg font-extrabold text-red-600">
              {formatRupiah(totalPengeluaran)}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">Menunggu Persetujuan</p>
            <p className="mt-1 text-lg font-extrabold text-amber-600">
              {pendingCount} item
            </p>
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          {/* Tahun Anggaran */}
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="">Semua Tahun Anggaran</option>
            {tahunList.map((ta) => (
              <option key={ta.id} value={ta.id}>
                {ta.nama} {ta.isActive ? "(Aktif)" : ""}
              </option>
            ))}
          </select>

          {/* Status filter */}
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
            <option value="DITUTUP">Ditutup</option>
          </select>

          {/* Jenis filter */}
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
          >
            <option value="">Pemasukan & Pengeluaran</option>
            <option value="PEMASUKAN">Pemasukan</option>
            <option value="PENGELUARAN">Pengeluaran</option>
          </select>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari program atau unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-xs focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
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
            <FileText className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-500">Belum ada data RAPBS</p>
            <p className="text-xs text-gray-400 mt-1">
              {canCreate ? 'Klik tombol "Tambah" untuk membuat RAPBS baru' : "Hubungi Admin untuk menambah RAPBS"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <Link
                key={item.id}
                href={`/rapbs/${item.id}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-emerald-400/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`mt-0.5 rounded-xl p-2.5 ${
                      item.jenis === "PEMASUKAN"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {item.jenis === "PEMASUKAN" ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.namaProgram}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.unitNama} · {item.tahunAnggaranNama}
                    </p>
                    <p className="text-xs text-gray-400">
                      {item.jenis === "PEMASUKAN"
                        ? item.sumberDanaNama
                        : item.kategoriPengeluaranNama}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-extrabold text-gray-900">
                      {formatRupiah(item.target)}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        STATUS_RAPBS_COLORS[item.status]
                      }`}
                    >
                      {STATUS_RAPBS_LABELS[item.status]}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
