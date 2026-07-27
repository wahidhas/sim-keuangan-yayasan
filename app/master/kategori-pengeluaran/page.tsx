"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { masterService } from "@/services/masterService";
import { KategoriPengeluaran } from "@/types/master";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tags, Plus, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  nama: z.string().min(2, "Nama Kategori Pengeluaran minimal 2 karakter"),
});

type FormValues = z.infer<typeof schema>;

export default function KategoriPengeluaranPage() {
  const { profile } = useAuth();
  const [list, setList] = useState<KategoriPengeluaran[]>([]);
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
    },
  });

  const loadData = async () => {
    setLoading(true);
    const data = await masterService.getKategoriPengeluaranList();
    if (data.length === 0) {
      const demoItems: KategoriPengeluaran[] = [
        { id: "kp-1", nama: "Honor" },
        { id: "kp-2", nama: "ATK" },
        { id: "kp-3", nama: "Operasional" },
        { id: "kp-4", nama: "Sarana" },
        { id: "kp-5", nama: "Transport" },
        { id: "kp-6", nama: "Listrik" },
        { id: "kp-7", nama: "Air" },
        { id: "kp-8", nama: "Internet" },
        { id: "kp-9", nama: "Program" },
        { id: "kp-10", nama: "Lainnya" },
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
        await masterService.addKategoriPengeluaran(values, profile.uid);
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
    if (confirm("Apakah Anda yakin ingin menghapus (soft delete) Kategori Pengeluaran ini?")) {
      if (profile?.uid) {
        await masterService.deleteKategoriPengeluaran(id, profile.uid);
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
                Kategori Pengeluaran
              </h1>
              <p className="text-xs text-gray-500">
                Pos pengelompokan alokasi belanja pengeluaran
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

        {showForm && (
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-md space-y-4">
            <h2 className="text-sm font-bold text-gray-900">Form Tambah Kategori Pengeluaran</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama Kategori Pengeluaran *
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Honor / Operasional / Transport"
                  {...register("nama")}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
                {errors.nama && (
                  <p className="text-xs text-red-600 mt-1">{errors.nama.message}</p>
                )}
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

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-50 p-2.5 text-purple-600">
                    <Tags className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">{item.nama}</h3>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  title="Soft Delete"
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
