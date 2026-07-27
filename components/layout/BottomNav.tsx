"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  FileText,
  Menu,
} from "lucide-react";

interface BottomNavProps {
  onOpenMore: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onOpenMore }) => {
  const pathname = usePathname();

  const navItems = [
    { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { title: "Pemasukan", href: "/pemasukan", icon: TrendingUp },
    { title: "Pengeluaran", href: "/pengeluaran", icon: TrendingDown },
    { title: "Laporan", href: "/laporan", icon: FileText },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 w-full items-center justify-around border-t border-gray-200 bg-white px-2 shadow-lg md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-full py-1 text-xs font-medium transition-colors ${
              isActive ? "text-emerald-600 font-bold" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-gray-500"}`} />
            <span>{item.title}</span>
          </Link>
        );
      })}

      <button
        onClick={onOpenMore}
        className="flex flex-col items-center justify-center gap-1 w-full py-1 text-xs font-medium text-gray-500 hover:text-gray-900 focus:outline-none"
      >
        <Menu className="h-5 w-5 text-gray-500" />
        <span>Lainnya</span>
      </button>
    </nav>
  );
};
