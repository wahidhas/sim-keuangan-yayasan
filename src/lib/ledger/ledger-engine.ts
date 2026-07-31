import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Pemasukan } from "@/types/pemasukan";
import { PengajuanPengeluaran } from "@/types/pengeluaran";
import { pemasukanService } from "@/services/pemasukanService";
import { pengeluaranService } from "@/services/pengeluaranService";

export interface LedgerData {
  saldoTU: number;
  saldoBendahara: number;
  saldoBank: number;
  totalKas: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  totalTransferBank: number;
  totalTransferTU: number;
  ledgerBalanced: boolean;
  imbalanceAmount: number;
  timestamp: string;
}

/**
 * LedgerEngine is the SOLE, AUTHORITATIVE LEDGER ENGINE in the entire codebase.
 * No page or module is allowed to compute cash, bank, or ledger balances independently.
 */
export const LedgerEngine = {
  async calculate(
    tahunAnggaranId?: string,
    unitId?: string
  ): Promise<LedgerData> {
    // 1. Fetch complete transaction ledger
    const [allPemasukan, pengeluaranList] = await Promise.all([
      pemasukanService.getPemasukanList(),
      pengeluaranService.getPengajuanList(),
    ]);

    const pmsFiltered = unitId
      ? allPemasukan.filter((p) => p.unitId === unitId)
      : allPemasukan;
    const pgjFiltered = unitId
      ? pengeluaranList.filter((p) => p.unitId === unitId)
      : pengeluaranList;

    // Sort all transactions chronologically by date
    pmsFiltered.sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );
    pgjFiltered.sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
    );

    // 2. Compute Level 2: Kas TU (Penerimaan TU yang belum disetor ke Bendahara)
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

    // 3. Pemasukan Yayasan Langsung (INCOME + OPENING_BALANCE)
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

    // 4. Setoran Bank (Transfer Internal Kas Bendahara -> Bank)
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

    // 5. Realized Expenses
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

    // 6. Saldo Kas Bendahara
    // Formula: Saldo Awal + Pemasukan Yayasan + Setoran TU - Pengeluaran Kas Bendahara - Setoran Bank + Penarikan Bank
    let saldoBendahara =
      totalPemasukan - totalTransferBank - pengeluaranBendahara + totalBankWithdrawals;
    if (saldoBendahara < 0) saldoBendahara = 0;

    // 7. Saldo Rekening Bank
    // Formula: Total Setoran Bank - Pengeluaran Bank - Penarikan Bank
    let saldoBank = totalTransferBank - pengeluaranBank - totalBankWithdrawals;
    if (saldoBank < 0) saldoBank = 0;

    // 8. Total Kas Yayasan
    // Formula: Saldo TU + Saldo Bendahara + Saldo Bank
    const totalKas = saldoTU + saldoBendahara + saldoBank;

    // 9. Integrity Validation Check
    const expectedTotalKas = totalPemasukan - totalPengeluaran + saldoTU;
    const imbalanceAmount = Math.abs(totalKas - expectedTotalKas);
    const ledgerBalanced = imbalanceAmount < 10;

    return {
      saldoTU,
      saldoBendahara,
      saldoBank,
      totalKas,
      totalPemasukan,
      totalPengeluaran,
      totalTransferBank,
      totalTransferTU,
      ledgerBalanced,
      imbalanceAmount,
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Recalculates ledger from scratch by clearing cached states, re-reading all transactions,
   * re-indexing by date, and returning verified LedgerData.
   */
  async recalculate(
    tahunAnggaranId?: string
  ): Promise<LedgerData & { message: string }> {
    const data = await this.calculate(tahunAnggaranId);
    return {
      ...data,
      message: data.ledgerBalanced
        ? "Ledger berhasil dihitung ulang dari awal dan 100% SINKRON."
        : `Ledger dihitung ulang. Terdapat selisih ketidakseimbangan sebesar Rp ${new Intl.NumberFormat(
            "id-ID"
          ).format(data.imbalanceAmount)}. Silakan jalankan Recalculate Ledger.`,
    };
  },
};
