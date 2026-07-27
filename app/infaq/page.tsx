"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { infaqService } from "@/services/infaqService";
import { masterService } from "@/services/masterService";
import { Infaq, InfaqBulanGroup } from "@/types/infaq";
import { TahunAnggaran } from "@/types/master";
import {
  HeartHandshake, Plus, Search, Loader2, ChevronRight,
  TrendingUp, User, Users,
} from "lucide-react";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function InfaqListPage() {
  const { profile } = useAuth();
  const [list, setList] = useState<Infaq[]>([]);
  const [rekap, setRekap] = useState<InfaqBulanGroup[]>([]);
  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);
  const [selectedTahun, setSelectedTahun] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [totalInfaq, setTotalInfaq] = useState(0);

  const canCreate =
    profile?.role === "ADMIN" || profile?.role === "PJ_INFAQ";

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
      const [data, rekapData] = await Promise.all([
        infaqService.getInfaqList(selectedTahun || undefined),
        infaqService.getRekapBulanan(selectedTahun || undefined),
      ]);
      setList(data);
      setRekap(rekapData);
      setTotalInfaq(data.reduce((s, i) => s + i.nominal, 0));
      setLoading(false);
    };
    load();
  }, [selectedTahun]);

  const filtered = list.filter((i) => {
    const matchSearch =
      !search ||
      (i.donatur || "Anonim").toLowerCase().includes(search.toLowerCase()) ||
      (i.keterangan || "").toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  // Max bulan untuk progress bar
  const maxBulan = Math.max(...rekap.map((r) => r.total), 1);

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Dana Infaq
            </h1>
            <p className="text-xs text-gray-500">
              Pengelolaan &amp; riwayat dana infaq yayasan
            </p>
          </div>
          {canCreate && (
            <Link
              href="/infaq/baru"
              className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-purple-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Input Infaq</span>
            </Link>
          )}
        </div>

        {/* Total Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 p-5 text-white shadow-lg">
          <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-4 right-12 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <HeartHandshake className="h-5 w-5 text-purple-200" />
              <p className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
                Total Dana Infaq
              </p>
            </div>
            <p className="text-3xl font-extrabold tracking-tight">
              {formatRupiah(totalInfaq)}
            </p>
            <p className="mt-1 text-xs text-purple-200">
              {filtered.length} transaksi terkumpul
            </p>
          </div>
        </div>

        {/* Rekap Bulanan — Bar Chart CSS */}
        {rekap.length > 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
              Rekap Per Bulan
            </p>
            <div className="space-y-2.5">
              {rekap.map((r) => (
                <div key={r.bulan}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">
                      {r.bulanLabel}
                    </span>
                    <span className="font-bold text-purple-700">
                      {formatRupiah(r.total)}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-500 transition-all duration-700"
                      style={{
                        width: `${Math.round((r.total / maxBulan) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.jumlahTransaksi} transaksi
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-purple-600 focus:outline-none"
          >
            <option value="">Semua Tahun Anggaran</option>
            {tahunList.map((ta) => (
              <option key={ta.id} value={ta.id}>
                {ta.nama} {ta.isActive ? "(Aktif)" : ""}
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari donatur atau keterangan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-xs focus:border-purple-600 focus:outline-none"
            />
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <HeartHandshake className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-500">
              Belum ada data infaq
            </p>
            {canCreate && (
              <p className="text-xs text-gray-400 mt-1">
                Klik "Input Infaq" untuk mencatat penerimaan infaq
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 rounded-xl bg-purple-50 p-2.5 text-purple-600">
                    {item.donatur ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Users className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">
                      {item.donatur || (
                        <span className="text-gray-400 italic">Anonim</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">{item.tanggal}</p>
                    {item.keterangan && (
                      <p className="text-xs text-gray-400 truncate">
                        {item.keterangan}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-extrabold text-purple-700">
                    {formatRupiah(item.nominal)}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.inputByNama || "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
