"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { auditService } from "@/services/auditService";
import { ActivityLog } from "@/types/audit";
import {
  History,
  Search,
  Filter,
  Loader2,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRightLeft,
  FileSpreadsheet,
} from "lucide-react";

const formatDate = (isoStr: string) => {
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return isoStr;
  }
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  UPDATE: "bg-blue-50 text-blue-700 ring-blue-500/20",
  DELETE: "bg-red-50 text-red-700 ring-red-500/20",
  APPROVE: "bg-teal-50 text-teal-700 ring-teal-600/20",
  REJECT: "bg-rose-50 text-rose-700 ring-rose-500/20",
  TRANSITION: "bg-purple-50 text-purple-700 ring-purple-500/20",
  LOGIN: "bg-gray-100 text-gray-700 ring-gray-500/20",
};

export default function AuditLogPage() {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [filterModule, setFilterModule] = useState("");
  const [search, setSearch] = useState("");

  const canAccess =
    profile?.role === "ADMIN" || profile?.role === "KETUA_YAYASAN";

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await auditService.getLogs();
      setLogs(data);
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
            Audit Trail hanya dapat diakses oleh Ketua Yayasan dan Administrator.
          </p>
        </div>
      </AppLayout>
    );
  }

  const filtered = logs.filter((log) => {
    const matchAction = !filterAction || log.action === filterAction;
    const matchModule = !filterModule || log.collectionName === filterModule;
    const matchSearch =
      !search ||
      (log.userNama || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.documentSummary || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.details || "").toLowerCase().includes(search.toLowerCase());
    return matchAction && matchModule && matchSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
              Audit Trail &amp; Activity Log
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Catatan lengkap riwayat aksi &amp; perubahan data di seluruh sistem
            </p>
          </div>
          <div className="rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 flex items-center gap-1.5">
            <History className="h-4 w-4 text-emerald-600" />
            <span>{filtered.length} Catatan</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
          >
            <option value="">Semua Modul / Koleksi</option>
            <option value="rapbs">RAPBS</option>
            <option value="pemasukan">Pemasukan</option>
            <option value="pengajuan_pengeluaran">Pengeluaran</option>
            <option value="infaq">Dana Infaq</option>
            <option value="master">Master Data</option>
          </select>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
          >
            <option value="">Semua Jenis Aksi</option>
            <option value="CREATE">Buat (Create)</option>
            <option value="UPDATE">Ubah (Update)</option>
            <option value="APPROVE">Persetujuan (Approve)</option>
            <option value="REJECT">Penolakan (Reject)</option>
            <option value="TRANSITION">Perpindahan Status</option>
            <option value="DELETE">Hapus (Soft Delete)</option>
          </select>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari user, ringkasan dokumen, atau detail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Log Timeline Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-12 text-center">
            <History className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm font-medium text-gray-500">Tidak ada riwayat aktivitas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-emerald-200 transition-all"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset ${
                        ACTION_COLORS[item.action] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.action}
                    </span>
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      [{item.collectionName}]
                    </span>
                    <span className="text-xs text-gray-400">· {formatDate(item.createdAt)}</span>
                  </div>

                  <p className="text-sm font-bold text-gray-900">
                    {item.documentSummary || `Dokumen ID: ${item.documentId}`}
                  </p>

                  {item.details && (
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {item.details}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <p className="text-xs font-bold text-gray-800">
                    {item.userNama || item.userId}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {item.userRole || "USER"}
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
