"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { pemasukanService } from "@/services/pemasukanService";
import { Pemasukan, STATUS_DANA_LABELS, STATUS_DANA_COLORS } from "@/types/pemasukan";
import {
  Building2,
  Landmark,
  Loader2,
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);

export default function PerpindahanDanaPage() {
  const { profile } = useAuth();
  const [pendingSerah, setPendingSerah] = useState<Pemasukan[]>([]);
  const [pendingSetor, setPendingSetor] = useState<Pemasukan[]>([]);
  const [selesaiBank, setSelesaiBank] = useState<Pemasukan[]>([]);
  const [loading, setLoading] = useState(true);

  const canAccess =
    profile?.role === "ADMIN" ||
    profile?.role === "BENDAHARA_YAYASAN" ||
    profile?.role === "STAF_TU" ||
    profile?.role === "KETUA_YAYASAN";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [serah, setor, selesai] = await Promise.all([
        pemasukanService.getPendingSerahTerima(),
        pemasukanService.getPendingSetorBank(),
        pemasukanService.getSelesaiDiBank(),
      ]);
      setPendingSerah(serah);
      setPendingSetor(setor);
      setSelesaiBank(selesai);
      setLoading(false);
    };
    load();
  }, []);

  if (profile && !canAccess) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm my-8">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Akses Dibatasi</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Halaman ini hanya dapat diakses oleh Staf TU, Bendahara, Ketua, dan Admin.
          </p>
        </div>
      </AppLayout>
    );
  }

  const TransferCard = ({
    item,
    badge,
  }: {
    item: Pemasukan;
    badge: "serah" | "setor" | "selesai";
  }) => (
    <Link
      href={`/pemasukan/${item.id}`}
      className="group flex items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-emerald-400/50 hover:shadow-md transition-all"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div
          className={`mt-0.5 rounded-xl p-2.5 ${
            badge === "serah"
              ? "bg-orange-50 text-orange-600"
              : badge === "setor"
              ? "bg-blue-50 text-blue-600"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {badge === "serah" ? (
            <Building2 className="h-4 w-4" />
          ) : badge === "setor" ? (
            <Landmark className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">
            {item.sumberDanaNama}
          </p>
          <p className="text-xs text-gray-500">
            {item.unitNama} · {item.tanggal}
          </p>
          <span
            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${
              STATUS_DANA_COLORS[item.statusDana]
            }`}
          >
            {STATUS_DANA_LABELS[item.statusDana]}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <p className="text-sm font-extrabold text-gray-900 hidden sm:block">
          {formatRupiah(item.nominal)}
        </p>
        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-600" />
      </div>
    </Link>
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Perpindahan Dana
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Alur perpindahan uang kas: TU → Bendahara → Bank
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Pending Serah Terima TU → Bendahara */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-orange-100 p-1.5 text-orange-600">
                  <Building2 className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">
                  Siap Diserahkan ke Bendahara
                </h2>
                {pendingSerah.length > 0 && (
                  <span className="rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                    {pendingSerah.length}
                  </span>
                )}
              </div>

              {pendingSerah.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-6 text-center bg-white">
                  <p className="text-xs text-gray-400">
                    Tidak ada dana yang menunggu serah terima ke Bendahara
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingSerah.map((item) => (
                    <TransferCard key={item.id} item={item} badge="serah" />
                  ))}
                </div>
              )}
            </div>

            {/* 2. Pending Setor Bank */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-blue-100 p-1.5 text-blue-600">
                  <Landmark className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">
                  Siap Disetor ke Bank
                </h2>
                {pendingSetor.length > 0 && (
                  <span className="rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white">
                    {pendingSetor.length}
                  </span>
                )}
              </div>

              {pendingSetor.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-6 text-center bg-white">
                  <p className="text-xs text-gray-400">
                    Tidak ada dana yang menunggu setoran ke Bank
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pendingSetor.map((item) => (
                    <TransferCard key={item.id} item={item} badge="setor" />
                  ))}
                </div>
              )}
            </div>

            {/* 3. Selesai Disetor & Aman di Bank */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-emerald-100 p-1.5 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-gray-900">
                  Selesai Disetor &amp; Aman di Bank
                </h2>
                {selesaiBank.length > 0 && (
                  <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-bold text-white">
                    {selesaiBank.length}
                  </span>
                )}
              </div>

              {selesaiBank.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 py-6 text-center bg-white">
                  <p className="text-xs text-gray-400">
                    Belum ada dana yang disetor ke Bank
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selesaiBank.map((item) => (
                    <TransferCard key={item.id} item={item} badge="selesai" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
