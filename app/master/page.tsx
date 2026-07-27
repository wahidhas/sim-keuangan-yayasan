"use client";

import React from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import {
  Calendar,
  Building,
  Coins,
  Tags,
  Users,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

export default function MasterDataHubPage() {
  const { profile } = useAuth();

  if (profile && profile.role !== "ADMIN") {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm my-8">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Akses Dibatasi</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Halaman Master Data hanya dapat diakses oleh Admin Yayasan.
          </p>
        </div>
      </AppLayout>
    );
  }

  const masterSections = [
    {
      title: "Tahun Anggaran",
      description: "Pengelolaan periode anggaran operasional yayasan",
      href: "/master/tahun-anggaran",
      icon: Calendar,
      badgeColor: "bg-blue-50 text-blue-700 ring-blue-600/20",
    },
    {
      title: "Unit Yayasan",
      description: "Daftar unit sekolah & usaha (RA, MI, MTs, Unit Usaha)",
      href: "/master/unit",
      icon: Building,
      badgeColor: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    },
    {
      title: "Sumber Dana",
      description: "Pos penerimaan (SPP, BOS, LKS, Seragam, Unit Usaha, Infaq)",
      href: "/master/sumber-dana",
      icon: Coins,
      badgeColor: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
    {
      title: "Kategori Pengeluaran",
      description: "Pos alokasi belanja (Honor, ATK, Operasional, Sarana, dll)",
      href: "/master/kategori-pengeluaran",
      icon: Tags,
      badgeColor: "bg-purple-50 text-purple-700 ring-purple-600/20",
    },
    {
      title: "Manajemen User & Role",
      description: "Pengelolaan daftar akun pengguna dan otoritas 5 Role",
      href: "/users",
      icon: Users,
      badgeColor: "bg-teal-50 text-teal-700 ring-teal-600/20",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Master Data System
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Pengelolaan data referensi utama aplikasi SIM Keuangan Yayasan
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {masterSections.map((sec) => {
            const Icon = sec.icon;
            return (
              <Link
                key={sec.href}
                href={sec.href}
                className="group relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-emerald-500/30 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className={`rounded-xl p-3 ${sec.badgeColor} ring-1 ring-inset`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <h2 className="mt-4 text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {sec.title}
                  </h2>
                  <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                    {sec.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-50 text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  Kelola Data
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
