"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { masterService } from "@/services/masterService";
import { TahunAnggaran } from "@/types/master";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar, Plus, Trash2, CheckCircle2, XCircle, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  nama: z.string().min(4, "Nama Tahun Anggaran minimal 4 karakter (misal: 2026-2027)"),
  isActive: z.boolean(),
  keterangan: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TahunAnggaranPage() {
  const { profile } = useAuth();
  const [list, setList] = useState<TahunAnggaran[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [showForm, setShowForm] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nama: "",
      isActive: true,
      keterangan: "",
    },
  });

  const loadData = async () => {
    setLoading(true);
    const data = await masterService.getTahunAnggaranList();
    // Default demo data if empty
    if (data.length === 0) {
      const demoItems: TahunAnggaran[] = [
        { id: "ta-1", nama: "2025-2026", isActive: false, keterangan: "Tahun Lalu" },
        { id: "ta-2", nama: "2026-2027", isActive: true, keterangan: "Tahun Anggaran Aktif" },
      ];
      setList(demoItems);
    } else {
      setList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      if (profile?.uid) {
        await masterService.addTahunAnggaran(values, profile.uid);
      }
      reset();
      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus (soft delete) Tahun Anggaran ini?")) {
      if (profile?.uid) {
        await masterService.deleteTahunAnggaran(id, profile.uid);
      }
      setList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/master"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                Tahun Anggaran
              </h1>
              <p className="text-xs text-gray-500">
                Pengelolaan periode &amp; status aktif Tahun Anggaran
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah</span>
          </button>
        </div>

        {/* Form Modal / Dropdown */}
        {showForm && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-md space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Form Tambah Tahun Anggaran</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Tahun Anggaran *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 2026-2027"
                  {...register("nama")}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                {errors.nama && (
                  <p className="text-xs text-red-600 mt-1">{errors.nama.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Opsional"
                  {...register("keterangan")}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  {...register("isActive")}
                  className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="isActive" className="text-xs text-gray-700 font-medium">
                  Set sebagai Tahun Anggaran Aktif
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* List Table / Mobile Cards */}
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{item.nama}</h3>
                    <p className="text-xs text-gray-400">
                      {item.keterangan || "Tidak ada keterangan"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {item.isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
                      <XCircle className="h-3.5 w-3.5" />
                      Non-Aktif
                    </span>
                  )}

                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Soft Delete"
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
