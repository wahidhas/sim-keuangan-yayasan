"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import { ROLE_NAMES } from "@/types/user";
import { pemasukanService } from "@/services/pemasukanService";
import { pengeluaranService } from "@/services/pengeluaranService";
import { LedgerService } from "@/services/ledgerService";
import { rapbsService } from "@/services/rapbsService";
import { masterService } from "@/services/masterService";
import { infaqService } from "@/services/infaqService";
import { Rapbs } from "@/types/rapbs";
import { PengajuanPengeluaran } from "@/types/pengeluaran";
import { Pemasukan } from "@/types/pemasukan";
import {
  Wallet, Building2, Landmark, TrendingUp, TrendingDown,
  Clock, CheckCircle2, ChevronRight, Loader2, UserCheck,
  ShieldCheck, ArrowRightLeft, FileText, Banknote, RefreshCw, AlertTriangle,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────
const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

const pct = (val: number, total: number) =>
  total > 0 ? Math.min(100, Math.round((val / total) * 100)) : 0;

// ─── Types ───────────────────────────────────────────────────────────────────
interface DashboardData {
  // Posisi Dana
  saldoTU: number;
  saldoBendahara: number;
  saldoBank: number;
  totalPemasukan: number;
  totalInfaq: number;
  isBalanced: boolean;
  imbalanceAmount: number;
  // RAPBS
  targetPemasukan: number;
  targetPengeluaran: number;
  // Realisasi
  totalRealisasi: number;
  // Antrian / Queue
  pendingRapbs: Rapbs[];
  pendingPengeluaran: PengajuanPengeluaran[];
  readyRealisasi: PengajuanPengeluaran[];
  pendingSerahTerima: Pemasukan[];
  // Active tahun
  tahunAktif: string;
}

// ─── Progress Bar Component ──────────────────────────────────────────────────
function ProgressBar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const percent = pct(value, max);
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-500">{formatRupiah(value)}</span>
        <span className="font-semibold text-gray-700">{percent}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-0.5 text-right text-xs text-gray-400">
        dari {formatRupiah(max)}
      </p>
    </div>
  );
}

// ─── Saldo Card ──────────────────────────────────────────────────────────────
function SaldoCard({
  label,
  value,
  sub,
  icon: Icon,
  colorBg,
  colorText,
  colorBorder,
}: {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  colorBg: string;
  colorText: string;
  colorBorder: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${colorBorder} bg-white`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500">{label}</p>
          <p className={`mt-1.5 text-xl font-extrabold ${colorText}`}>
            {formatRupiah(value)}
          </p>
          <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
        </div>
        <div className={`rounded-xl p-2.5 ${colorBg} ${colorText}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// ─── Queue Item ───────────────────────────────────────────────────────────────
function QueueItem({
  href,
  title,
  sub,
  badgeColor,
  badgeLabel,
  amount,
}: {
  href: string;
  title: string;
  sub: string;
  badgeColor: string;
  badgeLabel: string;
  amount?: number;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3.5 hover:border-emerald-300 hover:bg-white transition-all"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
        <p className="text-xs text-gray-500 truncate">{sub}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {amount !== undefined && (
          <p className="text-xs font-bold text-gray-700 hidden sm:block">
            {formatRupiah(amount)}
          </p>
        )}
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-bold ${badgeColor}`}
        >
          {badgeLabel}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-emerald-600" />
      </div>
    </Link>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // Tahun anggaran aktif
      const tahunList = await masterService.getTahunAnggaranList();
      const tahunAktif = tahunList.find((t) => t.isActive);
      const tahunId = tahunAktif?.id;

      // Parallel fetch semua data
      const [
        saldo,
        totalRealisasi,
        rapbsApproved,
        pendingRapbs,
        pendingPengeluaran,
        readyRealisasi,
        pendingSerahTerima,
        totalInfaq,
      ] = await Promise.all([
        LedgerService.calculateLedger(tahunId),
        pengeluaranService.getTotalRealisasi(tahunId),
        rapbsService.getApprovedRapbs(tahunId || ""),
        rapbsService.getPendingApproval(),
        pengeluaranService.getPendingApproval(),
        pengeluaranService.getApproved(),
        pemasukanService.getPendingSerahTerima(),
        infaqService.getTotalInfaq(tahunId),
      ]);

      const targetPemasukan = rapbsApproved
        .filter((r) => r.jenis === "PEMASUKAN")
        .reduce((s, r) => s + r.target, 0);
      const targetPengeluaran = rapbsApproved
        .filter((r) => r.jenis === "PENGELUARAN")
        .reduce((s, r) => s + r.target, 0);

      setData({
        saldoTU: saldo.saldoTU,
        saldoBendahara: saldo.saldoBendahara,
        saldoBank: saldo.saldoBank,
        totalPemasukan: saldo.totalPemasukan,
        totalInfaq,
        isBalanced: saldo.isBalanced,
        imbalanceAmount: saldo.imbalanceAmount,
        targetPemasukan,
        targetPengeluaran,
        totalRealisasi,
        pendingRapbs,
        pendingPengeluaran,
        readyRealisasi,
        pendingSerahTerima,
        tahunAktif: tahunAktif?.nama || "—",
      });
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadDashboard();
  }, [user, loadDashboard]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-6 shadow-xl">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          <span className="text-sm font-medium text-gray-700">
            Memuat dashboard...
          </span>
        </div>
      </div>
    );
  }

  if (!user || !profile) return null;

  const roleName = ROLE_NAMES[profile.role] || profile.role;
  const totalQueue =
    (data?.pendingRapbs.length || 0) +
    (data?.pendingPengeluaran.length || 0) +
    (data?.readyRealisasi.length || 0) +
    (data?.pendingSerahTerima.length || 0);

  const sisaAnggaran = (data?.saldoBank || 0) - (data?.totalRealisasi || 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* ── Welcome Banner ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 p-5 text-white shadow-lg">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-4 right-10 h-24 w-24 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
                <UserCheck className="h-3.5 w-3.5" />
                {roleName}
              </span>
              <h1 className="mt-2 text-xl font-extrabold tracking-tight md:text-2xl">
                Selamat Datang, {profile.nama} 👋
              </h1>
              <p className="mt-0.5 text-xs text-emerald-100">
                Tahun Anggaran Aktif:{" "}
                <span className="font-bold text-white">{data?.tahunAktif}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {lastUpdated && (
                <p className="text-xs text-emerald-200">
                  Update: {lastUpdated.toLocaleTimeString("id-ID")}
                </p>
              )}
              <button
                onClick={loadDashboard}
                className="flex items-center gap-1.5 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white hover:bg-white/25 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Ledger Integrity Warning Banner */}
        {data && !data.isBalanced && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-100 p-2.5 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">⚠ Ledger Tidak Seimbang</p>
                <p className="text-xs text-amber-700">
                  Terdapat selisih ketidakseimbangan sebesar{" "}
                  <strong>{formatRupiah(data.imbalanceAmount)}</strong>. Silakan lakukan rekalkulasi.
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className="rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors shrink-0"
            >
              Recalculate Ledger
            </Link>
          </div>
        )}

        {/* ── Posisi Dana & Keuangan Yayasan — 6 Cards ───────────────────── */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Posisi Kas & Anggaran Yayasan
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <SaldoCard
              label="Saldo Kas Bendahara"
              value={data?.saldoBendahara || 0}
              sub="Kas tunai di Bendahara"
              icon={Building2}
              colorBg="bg-blue-50"
              colorText="text-blue-600"
              colorBorder="border-blue-100"
            />
            <SaldoCard
              label="Saldo Rekening Bank"
              value={data?.saldoBank || 0}
              sub="Rekening resmi yayasan"
              icon={Landmark}
              colorBg="bg-emerald-50"
              colorText="text-emerald-600"
              colorBorder="border-emerald-100"
            />
            <SaldoCard
              label="Total RAPBS Pendapatan"
              value={data?.targetPemasukan || 0}
              sub="Target penerimaan"
              icon={TrendingUp}
              colorBg="bg-purple-50"
              colorText="text-purple-600"
              colorBorder="border-purple-100"
            />
            <SaldoCard
              label="Total RAPBS Belanja"
              value={data?.targetPengeluaran || 0}
              sub="Target pengeluaran"
              icon={TrendingDown}
              colorBg="bg-amber-50"
              colorText="text-amber-600"
              colorBorder="border-amber-100"
            />
            <SaldoCard
              label="Realisasi Pendapatan"
              value={data?.totalPemasukan || 0}
              sub="Pemasukan terealisasi"
              icon={ShieldCheck}
              colorBg="bg-teal-50"
              colorText="text-teal-600"
              colorBorder="border-teal-100"
            />
            <SaldoCard
              label="Realisasi Pengeluaran"
              value={data?.totalRealisasi || 0}
              sub="Pengeluaran terealisasi"
              icon={TrendingDown}
              colorBg="bg-rose-50"
              colorText="text-rose-600"
              colorBorder="border-rose-100"
            />
          </div>
        </div>

        {/* ── Quick Stats Row ──────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-amber-700">
              {data?.pendingRapbs.length || 0}
            </p>
            <p className="mt-0.5 text-xs font-medium text-amber-600">
              RAPBS Pending
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-blue-700">
              {data?.pendingPengeluaran.length || 0}
            </p>
            <p className="mt-0.5 text-xs font-medium text-blue-600">
              Pengajuan Pending
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-center shadow-sm">
            <p className="text-2xl font-extrabold text-emerald-700">
              {data?.readyRealisasi.length || 0}
            </p>
            <p className="mt-0.5 text-xs font-medium text-emerald-600">
              Siap Realisasi
            </p>
          </div>
        </div>

        {/* ── Action Queue ─────────────────────────────────────────────── */}
        {totalQueue > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Antrian Tindakan
              </h2>
              <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white">
                {totalQueue}
              </span>
            </div>
            <div className="space-y-2">
              {/* RAPBS Pending Approval */}
              {data?.pendingRapbs.slice(0, 3).map((r) => (
                <QueueItem
                  key={r.id}
                  href={`/rapbs/${r.id}`}
                  title={r.namaProgram}
                  sub={`RAPBS · ${r.unitNama} · ${r.tahunAnggaranNama}`}
                  badgeColor="bg-amber-100 text-amber-800"
                  badgeLabel="RAPBS"
                  amount={r.target}
                />
              ))}

              {/* Pengajuan Pending Approval */}
              {data?.pendingPengeluaran.slice(0, 3).map((p) => (
                <QueueItem
                  key={p.id}
                  href={`/pengeluaran/${p.id}`}
                  title={p.penerima}
                  sub={`Pengajuan · ${p.kategoriPengeluaranNama} · ${p.unitNama}`}
                  badgeColor="bg-blue-100 text-blue-800"
                  badgeLabel="Menunggu"
                  amount={p.nominal}
                />
              ))}

              {/* Ready to Realisasi */}
              {data?.readyRealisasi.slice(0, 3).map((p) => (
                <QueueItem
                  key={p.id}
                  href={`/pengeluaran/${p.id}`}
                  title={p.penerima}
                  sub={`Siap Realisasi · ${p.kategoriPengeluaranNama}`}
                  badgeColor="bg-emerald-100 text-emerald-800"
                  badgeLabel="Approved"
                  amount={p.nominal}
                />
              ))}

              {/* Pending Serah Terima */}
              {data?.pendingSerahTerima.slice(0, 2).map((p) => (
                <QueueItem
                  key={p.id}
                  href={`/pemasukan/${p.id}`}
                  title={p.sumberDanaNama || "Pemasukan"}
                  sub={`Perpindahan Dana · ${p.unitNama}`}
                  badgeColor="bg-orange-100 text-orange-800"
                  badgeLabel="Di TU"
                  amount={p.nominal}
                />
              ))}
            </div>
          </div>
        )}

        {totalQueue === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-300 mb-2" />
            <p className="text-sm font-semibold text-gray-500">
              Semua antrian sudah diselesaikan
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Tidak ada tindakan yang diperlukan saat ini
            </p>
          </div>
        )}

        {/* ── Quick Navigation ─────────────────────────────────────────── */}
        <div>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
            Akses Cepat
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                href: "/rapbs",
                label: "RAPBS",
                sub: "Rencana Anggaran",
                icon: FileText,
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                href: "/pemasukan",
                label: "Pemasukan",
                sub: "Input & Lacak Dana",
                icon: TrendingUp,
                color: "text-blue-600 bg-blue-50",
              },
              {
                href: "/pengeluaran",
                label: "Pengeluaran",
                sub: "Pengajuan & Realisasi",
                icon: Banknote,
                color: "text-red-500 bg-red-50",
              },
              {
                href: "/perpindahan-dana",
                label: "Perpindahan",
                sub: "TU → Bendahara → Bank",
                icon: ArrowRightLeft,
                color: "text-amber-600 bg-amber-50",
              },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col items-start gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all"
              >
                <div className={`rounded-xl p-2.5 ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400">{item.sub}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
