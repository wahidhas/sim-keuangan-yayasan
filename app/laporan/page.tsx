"use client";

import React, { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { masterService } from "@/services/masterService";
import { rapbsService } from "@/services/rapbsService";
import { pemasukanService } from "@/services/pemasukanService";
import { pengeluaranService } from "@/services/pengeluaranService";
import { infaqService } from "@/services/infaqService";
import { profileYayasanService } from "@/services/profileYayasanService";
import { ProfileYayasan } from "@/types/profileYayasan";
import { TahunAnggaran, UnitYayasan } from "@/types/master";
import { Rapbs } from "@/types/rapbs";
import { Pemasukan } from "@/types/pemasukan";
import { PengajuanPengeluaran } from "@/types/pengeluaran";
import { Infaq } from "@/types/infaq";
import {
  Printer,
  FileSpreadsheet,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  Landmark,
  HeartHandshake,
  PieChart,
  FileText,
  Filter,
} from "lucide-react";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

type TabType = "summary" | "rapbs" | "pemasukan" | "pengeluaran" | "infaq";

export default function LaporanPage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>("summary");
  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);
  const [unitList, setUnitList] = useState<UnitYayasan[]>([]);
  const [selectedTahun, setSelectedTahun] = useState<string>("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [profileYayasan, setProfileYayasan] = useState<ProfileYayasan | null>(null);

  // Raw data
  const [rapbsList, setRapbsList] = useState<Rapbs[]>([]);
  const [pemasukanList, setPemasukanList] = useState<Pemasukan[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<PengajuanPengeluaran[]>([]);
  const [infaqList, setInfaqList] = useState<Infaq[]>([]);

  useEffect(() => {
    const loadMeta = async () => {
      const [ta, unit] = await Promise.all([
        masterService.getTahunAnggaranList(),
        masterService.getUnitList(),
      ]);
      setTahunList(ta);
      setUnitList(unit);
      const active = ta.find((t) => t.isActive);
      if (active) setSelectedTahun(active.id);
    };
    loadMeta();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [rapbs, pms, pgj, inf, yys] = await Promise.all([
        rapbsService.getRapbsList(selectedTahun || undefined),
        pemasukanService.getPemasukanList({ tahunAnggaranId: selectedTahun || undefined }),
        pengeluaranService.getPengajuanList({ tahunAnggaranId: selectedTahun || undefined }),
        infaqService.getInfaqList(selectedTahun || undefined),
        profileYayasanService.getProfile(),
      ]);
      setRapbsList(rapbs);
      setPemasukanList(pms);
      setPengeluaranList(pgj);
      setInfaqList(inf);
      setProfileYayasan(yys);
      setLoading(false);
    };
    loadData();
  }, [selectedTahun]);

  // Filters by unit if selected
  const filteredRapbs = selectedUnit ? rapbsList.filter((r) => r.unitId === selectedUnit) : rapbsList;
  const filteredPemasukan = selectedUnit ? pemasukanList.filter((p) => p.unitId === selectedUnit) : pemasukanList;
  const filteredPengeluaran = selectedUnit ? pengeluaranList.filter((p) => p.unitId === selectedUnit) : pengeluaranList;
  const filteredInfaq = infaqList; // Infaq global yayasan

  // Aggregation Calculations
  const saldoTU = filteredPemasukan.filter((p) => p.statusDana === "DI_TU").reduce((s, p) => s + p.nominal, 0);
  const saldoBendahara = filteredPemasukan.filter((p) => p.statusDana === "DI_BENDAHARA").reduce((s, p) => s + p.nominal, 0);
  const saldoBankTotal = filteredPemasukan.filter((p) => p.statusDana === "DI_BANK" || p.statusDana === "SELESAI").reduce((s, p) => s + p.nominal, 0);
  const totalRealisasiPengeluaran = filteredPengeluaran.filter((p) => p.status === "DIREALISASIKAN" || p.status === "SELESAI").reduce((s, p) => s + p.nominal, 0);
  const sisaBank = saldoBankTotal - totalRealisasiPengeluaran;
  const totalInfaq = filteredInfaq.reduce((s, i) => s + i.nominal, 0);

  const targetPemasukanRAPBS = filteredRapbs.filter((r) => r.jenis === "PEMASUKAN" && r.status === "APPROVED").reduce((s, r) => s + r.target, 0);
  const targetPengeluaranRAPBS = filteredRapbs.filter((r) => r.jenis === "PENGELUARAN" && r.status === "APPROVED").reduce((s, r) => s + r.target, 0);
  const totalPemasukanRealisasi = filteredPemasukan.reduce((s, p) => s + p.nominal, 0);

  const handlePrint = () => {
    window.print();
  };

  const tahunNama = tahunList.find((t) => t.id === selectedTahun)?.nama || "Semua Tahun";
  const unitNama = unitList.find((u) => u.id === selectedUnit)?.nama || "Semua Unit";

  return (
    <AppLayout>
      <div className="space-y-6 print:space-y-4">
        {/* Header (Hidden on Print) */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Laporan Keuangan Yayasan
            </h1>
            <p className="text-xs text-gray-500">
              Rekapitulasi resmi posisi dana, RAPBS, pemasukan, dan pengeluaran
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-gray-800 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Cetak / PDF</span>
            </button>
          </div>
        </div>

        {/* Filters (Hidden on Print) */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center print:hidden">
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
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
          >
            <option value="">Semua Unit Yayasan</option>
            {unitList.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation (Hidden on Print) */}
        <div className="flex overflow-x-auto gap-1 border-b border-gray-200 pb-1 print:hidden">
          {[
            { id: "summary", label: "Posisi Dana & Ringkasan" },
            { id: "rapbs", label: "Realisasi RAPBS" },
            { id: "pemasukan", label: "Rincian Pemasukan" },
            { id: "pengeluaran", label: "Rincian Pengeluaran" },
            { id: "infaq", label: "Dana Infaq" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Printable Document Container */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm print:border-none print:p-0 print:shadow-none space-y-6">
          {/* Official Letterhead Header for Print */}
          <div className="border-b-2 border-gray-900 pb-4 text-center">
            <h2 className="text-lg font-black text-gray-900 uppercase tracking-wide">
              {profileYayasan?.namaYayasan || "YAYASAN PENDIDIKAN AL-HIKMAH"}
            </h2>
            {profileYayasan?.alamat && (
              <p className="text-xs text-gray-600">
                {profileYayasan.alamat} · {profileYayasan.kota}
              </p>
            )}
            <p className="text-xs font-semibold text-gray-700 mt-1">
              LAPORAN KEUANGAN OFFICIAL · TA {tahunNama}
            </p>
            <p className="text-xs text-gray-500">
              Unit: {unitNama} · Dicetak pada: {new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <>
              {/* TAB 1: POSISI DANA & RINGKASAN */}
              {(activeTab === "summary" || typeof window !== "undefined" && window.matchMedia("print").matches) && (
                <div className="space-y-6">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    I. Posisi Dana Keuangan
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-xl border border-gray-200 p-3.5 bg-gray-50/50">
                      <p className="text-xs font-semibold text-gray-500">Saldo DI TU</p>
                      <p className="mt-1 text-base font-black text-orange-700">{formatRupiah(saldoTU)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-3.5 bg-gray-50/50">
                      <p className="text-xs font-semibold text-gray-500">Saldo DI BENDAHARA</p>
                      <p className="mt-1 text-base font-black text-blue-700">{formatRupiah(saldoBendahara)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-3.5 bg-gray-50/50">
                      <p className="text-xs font-semibold text-gray-500">Saldo DI BANK (Nett)</p>
                      <p className="mt-1 text-base font-black text-emerald-700">{formatRupiah(sisaBank)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 p-3.5 bg-gray-50/50">
                      <p className="text-xs font-semibold text-gray-500">Total Dana Infaq</p>
                      <p className="mt-1 text-base font-black text-purple-700">{formatRupiah(totalInfaq)}</p>
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider pt-4 border-t border-gray-100">
                    II. Ringkasan Anggaran &amp; Realisasi
                  </h3>
                  <table className="w-full text-xs text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 font-bold text-gray-800 uppercase">
                      <tr>
                        <th className="border border-gray-200 p-2.5">Kategori</th>
                        <th className="border border-gray-200 p-2.5 text-right">Target RAPBS</th>
                        <th className="border border-gray-200 p-2.5 text-right">Realisasi</th>
                        <th className="border border-gray-200 p-2.5 text-right">Selisih / Persentase</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 font-medium">
                      <tr>
                        <td className="border border-gray-200 p-2.5 font-bold text-emerald-800">📥 Pemasukan</td>
                        <td className="border border-gray-200 p-2.5 text-right">{formatRupiah(targetPemasukanRAPBS)}</td>
                        <td className="border border-gray-200 p-2.5 text-right">{formatRupiah(totalPemasukanRealisasi)}</td>
                        <td className="border border-gray-200 p-2.5 text-right font-bold text-emerald-700">
                          {targetPemasukanRAPBS > 0 ? Math.round((totalPemasukanRealisasi / targetPemasukanRAPBS) * 100) : 0}%
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 p-2.5 font-bold text-red-700">📤 Pengeluaran</td>
                        <td className="border border-gray-200 p-2.5 text-right">{formatRupiah(targetPengeluaranRAPBS)}</td>
                        <td className="border border-gray-200 p-2.5 text-right">{formatRupiah(totalRealisasiPengeluaran)}</td>
                        <td className="border border-gray-200 p-2.5 text-right font-bold text-amber-700">
                          {targetPengeluaranRAPBS > 0 ? Math.round((totalRealisasiPengeluaran / targetPengeluaranRAPBS) * 100) : 0}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: RAPBS */}
              {activeTab === "rapbs" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    Laporan Rencana Anggaran (RAPBS)
                  </h3>
                  <table className="w-full text-xs text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 font-bold text-gray-800 uppercase">
                      <tr>
                        <th className="border border-gray-200 p-2">Program / Kegiatan</th>
                        <th className="border border-gray-200 p-2">Unit</th>
                        <th className="border border-gray-200 p-2">Jenis</th>
                        <th className="border border-gray-200 p-2 text-right">Target</th>
                        <th className="border border-gray-200 p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredRapbs.map((r) => (
                        <tr key={r.id}>
                          <td className="border border-gray-200 p-2 font-bold">{r.namaProgram}</td>
                          <td className="border border-gray-200 p-2">{r.unitNama}</td>
                          <td className="border border-gray-200 p-2">{r.jenis}</td>
                          <td className="border border-gray-200 p-2 text-right font-semibold">{formatRupiah(r.target)}</td>
                          <td className="border border-gray-200 p-2 text-center font-semibold">{r.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: PEMASUKAN */}
              {activeTab === "pemasukan" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    Laporan Rincian Pemasukan
                  </h3>
                  <table className="w-full text-xs text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 font-bold text-gray-800 uppercase">
                      <tr>
                        <th className="border border-gray-200 p-2">Tanggal</th>
                        <th className="border border-gray-200 p-2">Sumber Dana</th>
                        <th className="border border-gray-200 p-2">Unit</th>
                        <th className="border border-gray-200 p-2 text-right">Nominal</th>
                        <th className="border border-gray-200 p-2 text-center">Posisi Dana</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPemasukan.map((p) => (
                        <tr key={p.id}>
                          <td className="border border-gray-200 p-2">{p.tanggal}</td>
                          <td className="border border-gray-200 p-2 font-bold">{p.sumberDanaNama}</td>
                          <td className="border border-gray-200 p-2">{p.unitNama}</td>
                          <td className="border border-gray-200 p-2 text-right font-extrabold text-emerald-700">{formatRupiah(p.nominal)}</td>
                          <td className="border border-gray-200 p-2 text-center font-semibold">{p.statusDana}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: PENGELUARAN */}
              {activeTab === "pengeluaran" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    Laporan Rincian Pengeluaran
                  </h3>
                  <table className="w-full text-xs text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 font-bold text-gray-800 uppercase">
                      <tr>
                        <th className="border border-gray-200 p-2">Tanggal</th>
                        <th className="border border-gray-200 p-2">Penerima</th>
                        <th className="border border-gray-200 p-2">Kategori</th>
                        <th className="border border-gray-200 p-2 text-right">Nominal</th>
                        <th className="border border-gray-200 p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredPengeluaran.map((p) => (
                        <tr key={p.id}>
                          <td className="border border-gray-200 p-2">{p.tanggal}</td>
                          <td className="border border-gray-200 p-2 font-bold">{p.penerima}</td>
                          <td className="border border-gray-200 p-2">{p.kategoriPengeluaranNama}</td>
                          <td className="border border-gray-200 p-2 text-right font-extrabold text-red-600">{formatRupiah(p.nominal)}</td>
                          <td className="border border-gray-200 p-2 text-center font-semibold">{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 5: DANA INFAQ */}
              {activeTab === "infaq" && (
                <div className="space-y-4">
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    Laporan Penerimaan Dana Infaq
                  </h3>
                  <table className="w-full text-xs text-left border-collapse border border-gray-200">
                    <thead className="bg-gray-100 font-bold text-gray-800 uppercase">
                      <tr>
                        <th className="border border-gray-200 p-2">Tanggal</th>
                        <th className="border border-gray-200 p-2">Donatur</th>
                        <th className="border border-gray-200 p-2">Keterangan</th>
                        <th className="border border-gray-200 p-2 text-right">Nominal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInfaq.map((i) => (
                        <tr key={i.id}>
                          <td className="border border-gray-200 p-2">{i.tanggal}</td>
                          <td className="border border-gray-200 p-2 font-bold">{i.donatur || "Anonim"}</td>
                          <td className="border border-gray-200 p-2">{i.keterangan || "—"}</td>
                          <td className="border border-gray-200 p-2 text-right font-extrabold text-purple-700">{formatRupiah(i.nominal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Official Signature Block for Printed Financial Report */}
          <div className="pt-12 grid grid-cols-2 text-center text-xs text-gray-800">
            <div>
              <p>Mengetahui,</p>
              <p className="font-bold mt-1">Ketua Yayasan</p>
              <div className="h-16" />
              <p className="font-bold underline">( {profileYayasan?.namaKetua || "H. Ahmad Fauzi"} )</p>
            </div>
            <div>
              <p>Dibuat oleh,</p>
              <p className="font-bold mt-1">Bendahara Yayasan</p>
              <div className="h-16" />
              <p className="font-bold underline">( {profileYayasan?.namaBendahara || "Siti Rahmah"} )</p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
