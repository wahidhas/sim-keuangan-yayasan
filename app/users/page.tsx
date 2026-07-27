"use client";

import React, { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { masterService } from "@/services/masterService";
import { auditService } from "@/services/auditService";
import { UserProfile, UserRole, ROLE_NAMES } from "@/types/user";
import { UnitYayasan } from "@/types/master";
import { useAuth } from "@/hooks/useAuth";
import {
  Users,
  Shield,
  Building2,
  CheckCircle,
  Edit3,
  Loader2,
  ArrowLeft,
  Plus,
  UserPlus,
  Search,
  Check,
  X,
  Power,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";

export default function UserManagementPage() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [unitList, setUnitList] = useState<UnitYayasan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingUid, setEditingUid] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("STAF_TU");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [filterRole, setFilterRole] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  // Form Tambah User
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNama, setNewNama] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("STAF_TU");
  const [newUnitId, setNewUnitId] = useState("");
  const [addMsg, setAddMsg] = useState<string | null>(null);

  const canManage = profile?.role === "ADMIN";

  const loadData = async () => {
    setLoading(true);
    const [userDocs, units] = await Promise.all([
      masterService.getUsersList(),
      masterService.getUnitList(),
    ]);

    setUnitList(units);

    if (userDocs.length === 0) {
      const demoUsers: UserProfile[] = [
        {
          uid: "u-admin",
          nama: "Administrator Utama",
          email: "admin@yayasan.sch.id",
          role: "ADMIN",
          isActive: true,
        },
        {
          uid: "u-ketua",
          nama: "H. Ahmad Fauzi (Ketua Yayasan)",
          email: "ketua@yayasan.sch.id",
          role: "KETUA_YAYASAN",
          isActive: true,
        },
        {
          uid: "u-bendahara",
          nama: "Siti Rahmah (Bendahara)",
          email: "bendahara@yayasan.sch.id",
          role: "BENDAHARA_YAYASAN",
          isActive: true,
        },
        {
          uid: "u-tu",
          nama: "Budi Santoso (Staf TU)",
          email: "tu@yayasan.sch.id",
          role: "STAF_TU",
          unitId: "u-1",
          isActive: true,
        },
        {
          uid: "u-infaq",
          nama: "Ust. M. Rizky (PJ Infaq)",
          email: "infaq@yayasan.sch.id",
          role: "PJ_INFAQ",
          isActive: true,
        },
      ];
      setUsers(demoUsers);
    } else {
      setUsers(userDocs);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (profile && !canManage) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-red-100 shadow-sm my-8">
          <ShieldAlert className="h-12 w-12 text-red-500 mb-3" />
          <h2 className="text-lg font-bold text-gray-900">Akses Dibatasi</h2>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Manajemen User &amp; Role hanya dapat diakses oleh Administrator.
          </p>
        </div>
      </AppLayout>
    );
  }

  const handleEdit = (user: UserProfile) => {
    setEditingUid(user.uid);
    setSelectedRole(user.role);
    setSelectedUnit(user.unitId || "");
  };

  const handleSaveEdit = async (uid: string) => {
    setSaving(true);
    try {
      await masterService.updateUserRoleAndUnit(
        uid,
        selectedRole,
        selectedUnit || undefined
      );

      const target = users.find((u) => u.uid === uid);

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === uid
            ? { ...u, role: selectedRole, unitId: selectedUnit || undefined }
            : u
        )
      );

      // Audit log
      await auditService.logActivity({
        userId: profile?.uid || "u-admin",
        userNama: profile?.nama || "Admin",
        userRole: profile?.role || "ADMIN",
        action: "UPDATE",
        collectionName: "users",
        documentId: uid,
        documentSummary: `Ubah Role ${target?.nama || uid} menjadi ${ROLE_NAMES[selectedRole]}`,
        details: `Role baru: ${selectedRole}, Unit: ${selectedUnit || "Global"}`,
      });

      setEditingUid(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const nextState = !user.isActive;
    try {
      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, isActive: nextState } : u))
      );

      await auditService.logActivity({
        userId: profile?.uid || "u-admin",
        userNama: profile?.nama || "Admin",
        userRole: profile?.role || "ADMIN",
        action: "UPDATE",
        collectionName: "users",
        documentId: user.uid,
        documentSummary: `${nextState ? "Mengaktifkan" : "Non-aktifkan"} User ${user.nama}`,
        details: `Status akun diubah menjadi ${nextState ? "AKTIF" : "NON-AKTIF"}`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim() || !newEmail.trim()) {
      setAddMsg("Nama dan email wajib diisi");
      return;
    }
    setSaving(true);
    setAddMsg(null);
    try {
      const newUid = `user-${Date.now()}`;
      const newUser: UserProfile = {
        uid: newUid,
        nama: newNama,
        email: newEmail,
        role: newRole,
        unitId: newRole === "STAF_TU" ? newUnitId || undefined : undefined,
        isActive: true,
      };

      setUsers((prev) => [newUser, ...prev]);

      await auditService.logActivity({
        userId: profile?.uid || "u-admin",
        userNama: profile?.nama || "Admin",
        userRole: profile?.role || "ADMIN",
        action: "CREATE",
        collectionName: "users",
        documentId: newUid,
        documentSummary: `Tambah User Baru: ${newNama} (${ROLE_NAMES[newRole]})`,
        details: `Email: ${newEmail}, Role: ${newRole}`,
      });

      setNewNama("");
      setNewEmail("");
      setShowAddForm(false);
    } catch (err: any) {
      setAddMsg(err.message || "Gagal menambah user");
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = !filterRole || u.role === filterRole;
    const matchSearch =
      !search ||
      u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
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
                Manajemen User &amp; Hak Akses Role
              </h1>
              <p className="text-xs text-gray-500">
                Pengelolaan 5 Role Resmi Yayasan (Admin, Ketua, Bendahara, Staf TU, PJ Infaq)
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah User</span>
          </button>
        </div>

        {/* Add User Modal / Expandable Card */}
        {showAddForm && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-emerald-900">Form Tambah User Baru</h2>

            {addMsg && (
              <p className="text-xs text-red-600 font-semibold">{addMsg}</p>
            )}

            <form onSubmit={handleAddUser} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  placeholder="Contoh: Ahmad Hidayat"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="ahmad@yayasan.sch.id"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role Resmi *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                >
                  {(Object.keys(ROLE_NAMES) as UserRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_NAMES[r]}
                    </option>
                  ))}
                </select>
              </div>

              {newRole === "STAF_TU" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Penugasan</label>
                  <select
                    value={newUnitId}
                    onChange={(e) => setNewUnitId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- Semua Unit --</option>
                    {unitList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nama}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 text-xs text-gray-800 focus:border-emerald-600 focus:outline-none"
          >
            <option value="">Semua Role (5 Role)</option>
            {(Object.keys(ROLE_NAMES) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_NAMES[r]}
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau email user..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-gray-300 pl-9 pr-3 py-2 text-xs focus:border-emerald-600 focus:outline-none"
            />
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const assignedUnit = unitList.find((unit) => unit.id === u.unitId);
              return (
                <div
                  key={u.uid}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm transition-all ${
                    u.isActive
                      ? "border-gray-100 bg-white"
                      : "border-gray-200 bg-gray-50/70 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                        u.isActive
                          ? "bg-teal-50 text-teal-700"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {u.nama.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-sm">{u.nama}</h3>
                        {!u.isActive && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                            Non-Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{u.email}</p>
                      {assignedUnit && (
                        <p className="text-xs text-gray-400">Unit: {assignedUnit.nama}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {editingUid === u.uid ? (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <select
                          value={selectedRole}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                          className="rounded-xl border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-emerald-600 focus:outline-none"
                        >
                          {(Object.keys(ROLE_NAMES) as UserRole[]).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_NAMES[r]}
                            </option>
                          ))}
                        </select>

                        {selectedRole === "STAF_TU" && (
                          <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="rounded-xl border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-emerald-600 focus:outline-none"
                          >
                            <option value="">-- Pilih Unit --</option>
                            {unitList.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.nama}
                              </option>
                            ))}
                          </select>
                        )}

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(u.uid)}
                            disabled={saving}
                            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Simpan"}
                          </button>
                          <button
                            onClick={() => setEditingUid(null)}
                            className="rounded-xl border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
                          <Shield className="h-3.5 w-3.5" />
                          {ROLE_NAMES[u.role] || u.role}
                        </span>

                        <button
                          onClick={() => handleEdit(u)}
                          title="Ubah Role & Unit"
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.isActive ? "Non-aktifkan Akun" : "Aktifkan Akun"}
                          className={`rounded-lg p-1.5 transition-colors ${
                            u.isActive
                              ? "text-gray-400 hover:bg-red-50 hover:text-red-600"
                              : "text-red-500 hover:bg-emerald-50 hover:text-emerald-600"
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
