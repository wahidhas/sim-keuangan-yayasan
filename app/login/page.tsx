"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authService } from "@/services/authService";
import { UserRole, ROLE_NAMES } from "@/types/user";
import { Lock, Mail, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await authService.loginWithEmail(data.email, data.password);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setErrorMsg("Email atau password yang Anda masukkan salah.");
      } else {
        setErrorMsg(err.message || "Gagal melakukan login. Periksa koneksi Anda.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Preset helper for quick testing roles
  const fillPreset = (email: string, roleName: string) => {
    setValue("email", email);
    setValue("password", "password123");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white text-2xl shadow-lg shadow-emerald-600/30">
            SIM
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            SIM KEUANGAN YAYASAN
          </h2>
          <p className="text-sm text-gray-600">
            Sistem Informasi Management Keuangan Yayasan Pendidikan
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl bg-white p-6 md:p-8 shadow-xl shadow-gray-200/50 border border-gray-100">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-3.5 text-xs text-red-700 border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <div>{errorMsg}</div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  {...register("email")}
                  placeholder="admin@yayasan.sch.id"
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-gray-300 pl-10 pr-3 py-2.5 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all"
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <span>Masuk ke Akun</span>
              )}
            </button>
          </form>

          {/* Quick Preset Roles for Testing / Demo */}
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Demo Quick Role Presets:
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillPreset("admin@yayasan.sch.id", "ADMIN")}
                className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
              >
                1. Admin
              </button>
              <button
                type="button"
                onClick={() => fillPreset("ketua@yayasan.sch.id", "KETUA_YAYASAN")}
                className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
              >
                2. Ketua Yayasan
              </button>
              <button
                type="button"
                onClick={() => fillPreset("bendahara@yayasan.sch.id", "BENDAHARA_YAYASAN")}
                className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
              >
                3. Bendahara
              </button>
              <button
                type="button"
                onClick={() => fillPreset("tu@yayasan.sch.id", "STAF_TU")}
                className="rounded-lg bg-gray-100 px-2.5 py-1.5 text-left text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
              >
                4. Staf TU
              </button>
              <button
                type="button"
                onClick={() => fillPreset("infaq@yayasan.sch.id", "PJ_INFAQ")}
                className="col-span-2 rounded-lg bg-gray-100 px-2.5 py-1.5 text-center text-gray-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
              >
                5. PJ Infaq
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400">
          SIM Keuangan Yayasan &copy; 2026. Mobile First Architecture.
        </p>
      </div>
    </div>
  );
}
