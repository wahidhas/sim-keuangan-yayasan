"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { UserRole, ROLE_NAMES } from "@/types/user";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  FileText,
  CheckCircle,
  Database,
  Users,
  Settings,
  X,
  ArrowRightLeft,
  HeartHandshake,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const MENU_ITEMS: MenuItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "KETUA_YAYASAN", "BENDAHARA_YAYASAN", "STAF_TU", "PJ_INFAQ"],
  },
  {
    title: "Master Data",
    href: "/master",
    icon: Database,
    roles: ["ADMIN"],
  },
  {
    title: "RAPBS",
    href: "/rapbs",
    icon: FileText,
    roles: ["ADMIN", "KETUA_YAYASAN"],
  },
  {
    title: "Pemasukan TU",
    href: "/pemasukan",
    icon: TrendingUp,
    roles: ["ADMIN", "STAF_TU", "BENDAHARA_YAYASAN", "KETUA_YAYASAN"],
  },
  {
    title: "Dana Infaq",
    href: "/infaq",
    icon: HeartHandshake,
    roles: ["ADMIN", "PJ_INFAQ"],
  },
  {
    title: "Pengeluaran",
    href: "/pengeluaran",
    icon: TrendingDown,
    roles: ["ADMIN", "BENDAHARA_YAYASAN"],
  },
  {
    title: "Approval",
    href: "/approval",
    icon: CheckCircle,
    roles: ["ADMIN", "KETUA_YAYASAN"],
  },
  {
    title: "Laporan",
    href: "/laporan",
    icon: FileText,
    roles: ["ADMIN", "KETUA_YAYASAN", "BENDAHARA_YAYASAN"],
  },
  {
    title: "Audit Trail",
    href: "/audit-log",
    icon: Database,
    roles: ["ADMIN", "KETUA_YAYASAN"],
  },
  {
    title: "Manajemen User",
    href: "/users",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    title: "Pengaturan",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { profile } = useAuth();
  const userRole = profile?.role || "STAF_TU";

  const filteredMenuItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* Backdrop for Mobile Drawer */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar / Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white">
              SIM
            </div>
            <span className="font-bold text-gray-900 text-lg">Yayasan</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Sidebar"
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Card inside Sidebar for Mobile View */}
        {profile && (
          <div className="p-4 border-b border-gray-100 bg-emerald-50/50 md:hidden">
            <p className="text-sm font-semibold text-gray-900">{profile.nama}</p>
            <p className="text-xs text-emerald-700 font-medium">
              {ROLE_NAMES[profile.role]}
            </p>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onClose()}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-gray-500"}`} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200 text-xs text-gray-400 text-center">
          SIM Keuangan v1.0 &copy; 2026
        </div>
      </aside>
    </>
  );
};
