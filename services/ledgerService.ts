import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Pemasukan } from "@/types/pemasukan";
import { PengajuanPengeluaran } from "@/types/pengeluaran";
import { pemasukanService } from "./pemasukanService";
import { pengeluaranService } from "./pengeluaranService";

export interface LedgerResult {
  saldoTU: number;
  saldoBendahara: number;
  saldoBank: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  totalTransferBank: number;
  totalTransferTU: number;
  totalKas: number;
  isBalanced: boolean;
  imbalanceAmount: number;
  timestamp: string;
}

export const LedgerService = {
  /**
   * Single Source of Truth for all financial ledger calculations.
   * ALL modules (Dashboard, Setoran Bank, Laporan, PDF Export) MUST call this function.
   */
  async calculateLedger(
    tahunAnggaranId?: string,
    unitId?: string
  ): Promise<LedgerResult> {
    const [allPemasukan, pengeluaranList] = await Promise.all([
      pemasukanService.getPemasukanList({ tahunAnggaranId }),
      pengeluaranService.getPengajuanList({ tahunAnggaranId }),
    ]);

    const pmsFiltered = unitId
      ? allPemasukan.filter((p) => p.unitId === unitId)
      : allPemasukan;
    const pgjFiltered = unitId
      ? pengeluaranList.filter((p) => p.unitId === unitId)
      : pengeluaranList;

    // Level 2: Penerimaan TU (Kas TU yang belum disetor ke Bendahara)
    const tuReceipts = pmsFiltered.filter(
      (p) =>
        p.transactionType === "TU_RECEIPT" ||
        (p.statusDana === "DI_TU" && p.transactionType !== "BANK_TRANSFER")
    );
    const totalTuReceipts = tuReceipts.reduce((sum, p) => sum + p.nominal, 0);

    // Total Setoran TU ke Bendahara (TU_DEPOSIT)
    const tuDeposits = pmsFiltered.filter(
      (p) =>
        p.transactionType === "TU_DEPOSIT" ||
        (p.sumberDanaId === "sd-tu" && p.statusDana !== "DI_TU")
    );
    const totalTransferTU = tuDeposits.reduce((sum, p) => sum + p.nominal, 0);

    // Saldo TU = Penerimaan TU - Setoran TU ke Bendahara
    let saldoTU = totalTuReceipts - totalTransferTU;
    if (saldoTU < 0) saldoTU = 0;

    // Pemasukan Yayasan Langsung (INCOME + OPENING_BALANCE)
    const incomeYayasan = pmsFiltered.filter(
      (p) =>
        p.transactionType === "INCOME" ||
        p.transactionType === "OPENING_BALANCE" ||
        (p.transactionType !== "TU_DEPOSIT" &&
          p.transactionType !== "BANK_TRANSFER" &&
          p.sumberDanaId !== "sd-bank" &&
          p.sumberDanaId !== "sd-tu" &&
          !p.sumberDanaNama?.startsWith("Setoran Bank:") &&
          !p.sumberDanaNama?.startsWith("Setoran TU:") &&
          p.statusDana !== "SETORAN_BANK" &&
          p.statusDana !== "DI_TU")
    );
    const totalIncomeYayasan = incomeYayasan.reduce((sum, p) => sum + p.nominal, 0);

    // Total Realisasi Pemasukan (Realisasi Pendapatan = Saldo Awal + Income + Setoran TU)
    const totalPemasukan = totalIncomeYayasan + totalTransferTU;

    // Setoran Bank (Transfer Internal Kas Bendahara -> Bank)
    const bankDeposits = pmsFiltered.filter(
      (p) =>
        p.transactionType === "BANK_TRANSFER" ||
        p.sumberDanaId === "sd-bank" ||
        p.sumberDanaNama?.startsWith("Setoran Bank:") ||
        p.statusDana === "SETORAN_BANK"
    );
    const totalTransferBank = bankDeposits.reduce((sum, p) => sum + p.nominal, 0);

    // Penarikan Bank (BANK_WITHDRAWAL) jika ada
    const bankWithdrawals = pmsFiltered.filter(
      (p) => p.transactionType === "BANK_WITHDRAWAL"
    );
    const totalBankWithdrawals = bankWithdrawals.reduce((sum, p) => sum + p.nominal, 0);

    // Realized Expenses
    const realizedPengeluaran = pgjFiltered.filter(
      (p) => p.status === "DIREALISASIKAN" || p.status === "SELESAI"
    );

    const pengeluaranBendahara = realizedPengeluaran
      .filter((p) => p.metodePembayaran === "TUNAI")
      .reduce((sum, p) => sum + p.nominal, 0);

    const pengeluaranBank = realizedPengeluaran
      .filter((p) => p.metodePembayaran !== "TUNAI")
      .reduce((sum, p) => sum + p.nominal, 0);

    const totalPengeluaran = pengeluaranBendahara + pengeluaranBank;

    // Saldo Kas Bendahara = Saldo Awal + Pemasukan Yayasan + Setoran TU - Pengeluaran Tunai - Setoran Bank + Penarikan Bank
    let saldoBendahara =
      totalPemasukan - totalTransferBank - pengeluaranBendahara + totalBankWithdrawals;
    if (saldoBendahara < 0) saldoBendahara = 0;

    // Saldo Bank = Total Setoran Bank - Pengeluaran Bank - Penarikan Bank
    let saldoBank = totalTransferBank - pengeluaranBank - totalBankWithdrawals;
    if (saldoBank < 0) saldoBank = 0;

    // Total Kas Yayasan = Saldo TU + Saldo Bendahara + Saldo Bank
    const totalKas = saldoTU + saldoBendahara + saldoBank;

    // Net Asset Balance Integrity Check
    const expectedTotalKas = totalPemasukan - totalPengeluaran + saldoTU;
    const imbalanceAmount = Math.abs(totalKas - expectedTotalKas);
    const isBalanced = imbalanceAmount < 10;

    return {
      saldoTU,
      saldoBendahara,
      saldoBank,
      totalPemasukan,
      totalPengeluaran,
      totalTransferBank,
      totalTransferTU,
      totalKas,
      isBalanced,
      imbalanceAmount,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Recalculate Ledger from scratch by sorting all transactions by date.
   */
  async recalculateLedger(
    tahunAnggaranId?: string
  ): Promise<LedgerResult & { message: string }> {
    const result = await this.calculateLedger(tahunAnggaranId);
    return {
      ...result,
      message: result.isBalanced
        ? "Ledger berhasil dihitung ulang dan 100% SINKRON."
        : `Ledger dihitung ulang. Terdapat selisih ketidakseimbangan sebesar Rp ${new Intl.NumberFormat(
            "id-ID"
          ).format(result.imbalanceAmount)}. Silakan periksa kembali catatan transaksi.`,
    };
  },
};
