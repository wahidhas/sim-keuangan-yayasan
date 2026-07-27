"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { rapbsService } from "@/services/rapbsService";
import { Rapbs, STATUS_RAPBS_LABELS, STATUS_RAPBS_COLORS } from "@/types/rapbs";
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  Loader2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

const formatRupiah = (num: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);

export default function ApprovalPage() {
  const { profile } = useAuth();
  const [pendingList, setPendingList] = useState<Rapbs[]>([]);
  const [loading, setLoading] = useState(true);

  const canApprove =
    profile?.role === "KETUA_YAYASAN" || profile?.role === "ADMIN";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await rapbsService.getPendingApproval();
      setPendingList(data);
      setLoading(false);
    };
    load();
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Antrian Persetujuan
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            RAPBS yang menunggu persetujuan Ketua Yayasan
          </p>
        </div>

        {/* Summary Badge */}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500 text-white font-extrabold text-lg">
            {pendingList.length}
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">
              {pendingList.length === 0
                ? "Tidak ada antrian"
                : `${pendingList.length} item menunggu persetujuan`}
            </p>
            <p className="text-xs text-amber-700">
              Klik item untuk melihat detail dan memberikan keputusan
            </p>
          </div>
        </div>

        {/* Pending List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : pendingList.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-14 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-300 mb-2" />
            <p className="text-sm font-medium text-gray-500">Semua RAPBS sudah diproses</p>
            <p className="text-xs text-gray-400 mt-1">
              Tidak ada RAPBS yang menunggu persetujuan saat ini
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingList.map((item) => (
              <Link
                key={item.id}
                href={`/rapbs/${item.id}`}
                className="group flex items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm hover:border-emerald-400/50 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 rounded-xl bg-amber-50 p-2.5 text-amber-600">
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
                          Pemasukan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          <TrendingDown className="h-3 w-3" />
                          Pengeluaran
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
                    <span className="text-xs text-amber-600 font-semibold">
                      Menunggu Persetujuan
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
