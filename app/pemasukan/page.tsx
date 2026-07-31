"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { pemasukanService } from "@/services/pemasukanService";
import { masterService } from "@/services/masterService";
import {
  Pemasukan,
  STATUS_DANA_LABELS,
  STATUS_DANA_COLORS,
  StatusDana,
} from "@/types/pemasukan";
import { TahunAnggaran } from "@/types/master";
import {
  TrendingUp,
  Plus,
  Search,
  Loader2,
  ChevronRight,
  Wallet,
  Building2,
  Landmark,
  Trash2,
} from "lucide-react";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function PemasukanListPage() {
  const { profile } = useAuth();
  const [list, setList] = useState<Pemasukan[]>([]);
  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);
  const [selectedTahun, setSelectedTahun] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState({
    saldoTU: 0,
    saldoBendahara: 0,
    saldoBank: 0,
    totalPemasukan: 0,
  });

  const canCreate =
    profile?.role === "ADMIN" || profile?.role === "STAF_TU";

  useEffect(() => {
    const loadMeta = async () => {
      const ta = await masterService.getTahunAnggaranList();
      setTahunList(ta);
      const active = ta.find((t) => t.isActive);
      if (active) setSelectedTahun(active.id);
    };
    loadMeta();
  }, []);

  const canDelete =
    profile?.role === "ADMIN" ||
    profile?.role === "STAF_TU" ||
    profile?.role === "BENDAHARA_YAYASAN";

  const loadData = async () => {
    setLoading(true);
    const [data, s] = await Promise.all([
      pemasukanService.getPemasukanList({
        tahunAnggaranId: selectedTahun || undefined,
      }),
      pemasukanService.getSaldoSummary(selectedTahun || undefined),
    ]);
    setList(data);
    setSaldo(s);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedTahun]);

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Hapus pencatatan pemasukan ini?")) return;
    try {
      await pemasukanService.deletePemasukan(id, profile?.uid || "u-demo");
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus pemasukan");
    }
  };

  const filtered = list.filter((p) => {
    const isActualIncome =
      p.transactionType === "INCOME" ||
      (!p.sumberDanaNama?.startsWith("Setoran Bank:") &&
        !p.sumberDanaNama?.startsWith("Setoran TU:") &&
        p.sumberDanaId !== "sd-bank" &&
        p.sumberDanaId !== "sd-tu");
    const matchStatus = !filterStatus || p.statusDana === filterStatus;
    const matchSearch =
      !search ||
      p.sumberDanaNama?.toLowerCase().includes(search.toLowerCase()) ||
      (p.unitNama || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.keterangan || "").toLowerCase().includes(search.toLowerCase());
    return isActualIncome && matchStatus && matchSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Pemasukan
            </h1>
            <p className="text-xs text-gray-500">
              Rekam &amp; lacak alur pemasukan keuangan yayasan
            </p>
          </div>
          {canCreate && (
            <Link
              href="/pemasukan/baru"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Input Pemasukan</span>
            </Link>
          )}
        </div>

        {/* Posisi Dana Summary */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-orange-100 bg-orange-50 p-4">
            <div className="rounded-xl bg-orange-100 p-2.5 text-orange-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-orange-700 font-medium">Saldo TU</p>
              <p className="text-base font-extrabold text-orange-900">
                {formatRupiah(saldo.saldoTU)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="rounded-xl bg-blue-100 p-2.5 text-blue-600">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-blue-700 font-medium">Saldo Bendahara</p>
              <p className="text-base font-extrabold text-blue-900">
                {formatRupiah(saldo.saldoBendahara)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-600">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-emerald-700 font-medium">Saldo Bank</p>
              <p className="text-base font-extrabold text-emerald-900">
                {formatRupiah(saldo.saldoBank)}
              </p>
            </div>
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
            <option value="">Semua Status Dana</option>
            <option value="DI_TU">Di TU</option>
            <option value="DI_BENDAHARA">Di Bendahara</option>
            <option value="DI_BANK">Di Bank</option>
            <option value="SELESAI">Selesai</option>
          </select>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari sumber dana, unit, keterangan..."
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
            <TrendingUp className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-500">Belum ada data pemasukan</p>
            {canCreate && (
              <p className="text-xs text-gray-400 mt-1">
                Klik "Input Pemasukan" untuk mencatat pemasukan baru
              </p>
            )}
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
                  <div className="mt-0.5 rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {item.sumberDanaNama}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.unitNama} · {item.tanggal}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {item.keterangan || "—"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-extrabold text-gray-900">
                      {formatRupiah(item.nominal)}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                        STATUS_DANA_COLORS[item.statusDana]
                      }`}
                    >
                      {STATUS_DANA_LABELS[item.statusDana]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteItem(e, item.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Hapus Pemasukan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
