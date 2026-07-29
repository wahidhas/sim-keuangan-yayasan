"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ROLE_NAMES } from "@/types/user";
import { LogOut, Menu, User } from "lucide-react";

interface NavbarProps {
  onOpenSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSidebar }) => {
  const router = useRouter();
  const { profile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (e) {
      window.location.href = "/login";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white/90 px-4 backdrop-blur transition-all md:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          aria-label="Open Drawer"
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 focus:outline-none md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 font-bold text-white shadow-sm">
            SIM
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">
              SIM Keuangan
            </h1>
            <p className="text-xs text-gray-500 hidden sm:block">
              Yayasan Pendidikan
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {profile ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-gray-900">{profile.nama}</p>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                {ROLE_NAMES[profile.role] || profile.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Keluar"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            <span className="text-xs text-gray-500">Tamu</span>
          </div>
        )}
      </div>
    </header>
  );
};
