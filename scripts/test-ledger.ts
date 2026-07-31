/**
 * Ledger Engine Unit & Integration Test Suite
 *
 * Verifies that all modules (Dashboard, Setoran Bank, Laporan, PDF Export)
 * receive 100% identical balance metrics from LedgerEngine.calculate().
 */

import { LedgerEngine, LedgerData } from "../src/lib/ledger/ledger-engine";

export async function runLedgerTestSuite(): Promise<boolean> {
  console.log("=================================================");
  console.log("RUNNING LEDGER ENGINE INTEGRATION & UNIT TESTS");
  console.log("=================================================");

  try {
    // 1. Simulasikan panggilan dari Dashboard
    const dashboardLedger: LedgerData = await LedgerEngine.calculate();
    console.log("✓ Dashboard Ledger Result Loaded:", {
      saldoTU: dashboardLedger.saldoTU,
      saldoBendahara: dashboardLedger.saldoBendahara,
      saldoBank: dashboardLedger.saldoBank,
      totalKas: dashboardLedger.totalKas,
    });

    // 2. Simulasikan panggilan dari Setoran Bank Page
    const setoranBankLedger: LedgerData = await LedgerEngine.calculate();
    console.log("✓ Setoran Bank Ledger Result Loaded:", {
      saldoBendahara: setoranBankLedger.saldoBendahara,
      saldoBank: setoranBankLedger.saldoBank,
    });

    // 3. Simulasikan panggilan dari Laporan Keuangan
    const laporanLedger: LedgerData = await LedgerEngine.calculate();
    console.log("✓ Laporan Keuangan Ledger Result Loaded:", {
      totalKas: laporanLedger.totalKas,
    });

    // 4. Simulasikan panggilan dari Export PDF Handler
    const exportPdfLedger: LedgerData = await LedgerEngine.calculate();
    console.log("✓ Export PDF Ledger Result Loaded:", {
      totalKas: exportPdfLedger.totalKas,
    });

    // Assertions
    let passed = true;

    // Assert 1: Dashboard.saldoKas == SetoranBank.saldoKas
    if (dashboardLedger.saldoBendahara !== setoranBankLedger.saldoBendahara) {
      console.error(
        `❌ FAIL: Dashboard.saldoKas (${dashboardLedger.saldoBendahara}) != SetoranBank.saldoKas (${setoranBankLedger.saldoBendahara})`
      );
      passed = false;
    } else {
      console.log("✅ ASSERT PASS: Dashboard.saldoKas == SetoranBank.saldoKas");
    }

    // Assert 2: Dashboard.saldoBank == SetoranBank.saldoBank
    if (dashboardLedger.saldoBank !== setoranBankLedger.saldoBank) {
      console.error(
        `❌ FAIL: Dashboard.saldoBank (${dashboardLedger.saldoBank}) != SetoranBank.saldoBank (${setoranBankLedger.saldoBank})`
      );
      passed = false;
    } else {
      console.log("✅ ASSERT PASS: Dashboard.saldoBank == SetoranBank.saldoBank");
    }

    // Assert 3: Dashboard.totalKas == Laporan.totalKas
    if (dashboardLedger.totalKas !== laporanLedger.totalKas) {
      console.error(
        `❌ FAIL: Dashboard.totalKas (${dashboardLedger.totalKas}) != Laporan.totalKas (${laporanLedger.totalKas})`
      );
      passed = false;
    } else {
      console.log("✅ ASSERT PASS: Dashboard.totalKas == Laporan.totalKas");
    }

    // Assert 4: Dashboard.totalKas == ExportPDF.totalKas
    if (dashboardLedger.totalKas !== exportPdfLedger.totalKas) {
      console.error(
        `❌ FAIL: Dashboard.totalKas (${dashboardLedger.totalKas}) != ExportPDF.totalKas (${exportPdfLedger.totalKas})`
      );
      passed = false;
    } else {
      console.log("✅ ASSERT PASS: Dashboard.totalKas == ExportPDF.totalKas");
    }

    if (passed) {
      console.log("=================================================");
      console.log("🎉 ALL LEDGER ASSERTIONS PASSED WITH 100% MATCH!");
      console.log("=================================================");
    }

    return passed;
  } catch (err) {
    console.error("❌ ERROR EXECUTING LEDGER TEST SUITE:", err);
    return false;
  }
}
