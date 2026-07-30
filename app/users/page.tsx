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
  Key,
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
  const [newPassword, setNewPassword] = useState("123456");
  const [newRole, setNewRole] = useState<UserRole>("STAF_TU");
  const [newUnitId, setNewUnitId] = useState("");
  const [addMsg, setAddMsg] = useState<string | null>(null);
  const [addSuccessMsg, setAddSuccessMsg] = useState<string | null>(null);

  const canManage = profile?.role === "ADMIN";

  const loadData = async () => {
    setLoading(true);
    const [userDocs, units] = await Promise.all([
      masterService.getUsersList(),
      masterService.getUnitList(),
    ]);

    setUnitList(units);
    setUsers(userDocs);
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
      const targetUser = users.find((u) => u.uid === uid);
      await masterService.updateUserRoleAndUnit(
        uid,
        selectedRole,
        selectedUnit || undefined,
        targetUser?.isActive !== false
      );

      await loadData();

      // Audit log
      await auditService.logActivity({
        userId: profile?.uid || "u-admin",
        userNama: profile?.nama || "Admin",
        userRole: profile?.role || "ADMIN",
        action: "UPDATE",
        collectionName: "users",
        documentId: uid,
        documentSummary: `Ubah Role ${targetUser?.nama || uid} menjadi ${ROLE_NAMES[selectedRole]}`,
        details: `Role baru: ${selectedRole}, Unit: ${selectedUnit || "Global"}`,
      });

      setEditingUid(null);
    } catch (err: any) {
      alert(err.message || "Gagal mengubah role user");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user: UserProfile) => {
    const nextState = !(user.isActive !== false && (user as any).active !== false);
    setSaving(true);
    try {
      await masterService.updateUserRoleAndUnit(
        user.uid,
        user.role,
        user.unitId,
        nextState
      );

      await loadData();

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
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status akun");
    } finally {
      setSaving(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim() || !newEmail.trim()) {
      setAddMsg("Nama dan email wajib diisi");
      return;
    }
    if (newPassword.length < 6) {
      setAddMsg("Password minimal 6 karakter");
      return;
    }

    setSaving(true);
    setAddMsg(null);
    setAddSuccessMsg(null);

    try {
      // Direct call to masterService creating account in Firebase Auth AND Firestore
      const createdUser = await masterService.createUser({
        nama: newNama,
        email: newEmail,
        password: newPassword,
        role: newRole,
        unitId: newRole === "STAF_TU" ? newUnitId || undefined : undefined,
      });

      await auditService.logActivity({
        userId: profile?.uid || "u-admin",
        userNama: profile?.nama || "Admin",
        userRole: profile?.role || "ADMIN",
        action: "CREATE",
        collectionName: "users",
        documentId: createdUser.uid,
        documentSummary: `Tambah User Baru: ${newNama} (${ROLE_NAMES[newRole]})`,
        details: `Email: ${newEmail}, Role: ${newRole}`,
      });

      setAddSuccessMsg(`User ${newNama} (${newEmail}) berhasil didaftarkan ke Firebase Authentication & Firestore!`);
      setNewNama("");
      setNewEmail("");
      setNewPassword("123456");
      await loadData();
      setShowAddForm(false);
    } catch (err: any) {
      setAddMsg(err.message || "Gagal mendaftarkan user ke Firebase");
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
                Terkoneksi langsung dengan Firebase Authentication &amp; Firestore Database
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setAddMsg(null);
              setAddSuccessMsg(null);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Tambah User</span>
          </button>
        </div>

        {addSuccessMsg && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 font-medium">
            ✓ {addSuccessMsg}
          </div>
        )}

        {/* Add User Modal / Expandable Card */}
        {showAddForm && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-emerald-900 flex items-center gap-1.5">
              <UserPlus className="h-4 w-4" />
              Pendaftaran User Baru ke Firebase Database
            </h2>

            {addMsg && (
              <p className="text-xs text-red-600 font-semibold bg-red-50 p-2.5 rounded-xl border border-red-200">
                {addMsg}
              </p>
            )}

            <form onSubmit={handleAddUser} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  placeholder="Contoh: H. Ahmad Fauzi"
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email Login *</label>
                <input
                  type="email"
                  placeholder="ketua@yayasan.sch.id"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Password Awal *</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role Resmi Yayasan *</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none font-semibold text-emerald-900"
                >
                  {(Object.keys(ROLE_NAMES) as UserRole[]).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_NAMES[r]}
                    </option>
                  ))}
                </select>
              </div>

              {newRole === "STAF_TU" && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit Penugasan STAF TU *</label>
                  <select
                    value={newUnitId}
                    onChange={(e) => setNewUnitId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="">-- Semua Unit --</option>
                    {unitList.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nama} ({u.kode})
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
                  Daftarkan User
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
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 p-8 text-center bg-white">
            <Users className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">Belum Ada User Terdaftar di Database</p>
            <p className="text-xs text-gray-400 max-w-xs mt-1">
              Klik tombol "Tambah User" di atas untuk mendaftarkan akun pertama ke Firebase Authentication.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map((u) => {
              const assignedUnit = unitList.find((unit) => unit.id === u.unitId);
              const isActive = u.isActive !== false && (u as any).active !== false;

              return (
                <div
                  key={u.uid}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 shadow-sm transition-all ${
                    isActive
                      ? "border-gray-100 bg-white"
                      : "border-gray-200 bg-gray-50/70 opacity-75"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                        isActive
                          ? "bg-teal-50 text-teal-700"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {u.nama ? u.nama.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-sm">{u.nama}</h3>
                        {!isActive && (
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
                          className="rounded-xl border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 focus:border-emerald-600 focus:outline-none font-semibold"
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
                          title={isActive ? "Non-aktifkan Akun" : "Aktifkan Akun"}
                          className={`rounded-lg p-1.5 transition-colors ${
                            isActive
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
