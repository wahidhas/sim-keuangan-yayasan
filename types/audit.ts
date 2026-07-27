// Audit Trail & Activity Log types
// Collection: activity_logs

export interface ActivityLog {
  id: string;
  userId: string;
  userNama?: string;
  userRole?: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "REJECT" | "TRANSITION" | "LOGIN";
  collectionName: string; // rapbs, pemasukan, pengajuan_pengeluaran, infaq, master
  documentId: string;
  documentSummary?: string; // Summary singkat misal: "Pemasukan SPP Rp 10.000.000"
  details?: string | null;
  createdAt: string;
}
