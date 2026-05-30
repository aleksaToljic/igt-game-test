import { SYMBOL, type SymbolId } from "./symbols";

export type PayoutByMatchCount = Readonly<Record<number, number>>;
export type Paytable = Readonly<Record<SymbolId, PayoutByMatchCount>>;

export const MIN_MATCH = 3;

export const PAYTABLE: Paytable = {
  [SYMBOL.ten]: { 3: 5, 4: 10, 5: 25 },
  [SYMBOL.jack]: { 3: 5, 4: 10, 5: 25 },
  [SYMBOL.queen]: { 3: 8, 4: 15, 5: 40 },
  [SYMBOL.king]: { 3: 8, 4: 15, 5: 40 },
  [SYMBOL.ace]: { 3: 10, 4: 20, 5: 60 },
  [SYMBOL.gem]: { 3: 20, 4: 50, 5: 150 },
  [SYMBOL.crown]: { 3: 30, 4: 80, 5: 250 },
  [SYMBOL.seven]: { 3: 50, 4: 150, 5: 500 },
  [SYMBOL.wild]: { 3: 100, 4: 300, 5: 1000 },
};

export function lineMultiplier(symbol: SymbolId, matchCount: number): number {
  return PAYTABLE[symbol]?.[matchCount] ?? 0;
}
