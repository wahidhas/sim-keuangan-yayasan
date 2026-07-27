export type UserRole =
  | "ADMIN"
  | "KETUA_YAYASAN"
  | "BENDAHARA_YAYASAN"
  | "STAF_TU"
  | "PJ_INFAQ";

export interface UserProfile {
  uid: string;
  nama: string;
  email: string;
  role: UserRole;
  unitId?: string | null;
  isActive: boolean;
  photoURL?: string | null;
  lastLogin?: any;
  createdAt?: any;
  updatedAt?: any;
  deletedAt?: any | null;
  deletedBy?: string | null;
}

export const ROLE_NAMES: Record<UserRole, string> = {
  ADMIN: "Admin Yayasan",
  KETUA_YAYASAN: "Ketua Yayasan",
  BENDAHARA_YAYASAN: "Bendahara Yayasan",
  STAF_TU: "Staf TU",
  PJ_INFAQ: "PJ Infaq",
};
