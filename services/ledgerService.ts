import { LedgerEngine, LedgerData } from "@/src/lib/ledger/ledger-engine";

export type LedgerResult = LedgerData & { isBalanced: boolean };

export const LedgerService = {
  async calculateLedger(
    tahunAnggaranId?: string,
    unitId?: string
  ): Promise<LedgerResult> {
    const data = await LedgerEngine.calculate(tahunAnggaranId, unitId);
    return {
      ...data,
      isBalanced: data.ledgerBalanced,
    };
  },

  async recalculateLedger(tahunAnggaranId?: string) {
    const data = await LedgerEngine.recalculate(tahunAnggaranId);
    return {
      ...data,
      isBalanced: data.ledgerBalanced,
    };
  },
};
