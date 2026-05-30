import { describe, expect, it } from "vitest";
import { lineMultiplier } from "../src/config/paytable";
import { SYMBOL, type SymbolId } from "../src/config/symbols";
import { evaluateSpin } from "../src/server/PaylineEvaluator";

const MIDDLE_LINE = [[1, 1, 1, 1, 1]] as const;
const BET_PER_LINE = 10;

function gridFromMiddleRow(middle: readonly SymbolId[]): SymbolId[][] {
  return middle.map((symbol) => [SYMBOL.ten, symbol, SYMBOL.king]);
}

describe("evaluateSpin", () => {
  it("pays three matching symbols from the left", () => {
    const grid = gridFromMiddleRow([SYMBOL.ace, SYMBOL.ace, SYMBOL.ace, SYMBOL.queen, SYMBOL.king]);
    const result = evaluateSpin(grid, BET_PER_LINE, MIDDLE_LINE);
    expect(result.wins).toHaveLength(1);
    expect(result.wins[0]?.symbol).toBe(SYMBOL.ace);
    expect(result.wins[0]?.matchCount).toBe(3);
    expect(result.wins[0]?.amountCents).toBe(10 * BET_PER_LINE);
    expect(result.wins[0]?.positions).toEqual([
      { reel: 0, row: 1 },
      { reel: 1, row: 1 },
      { reel: 2, row: 1 },
    ]);
    expect(result.totalWinCents).toBe(10 * BET_PER_LINE);
  });

  it("treats a wild as a substitute mid-run", () => {
    const grid = gridFromMiddleRow([SYMBOL.ten, SYMBOL.wild, SYMBOL.ten, SYMBOL.ten, SYMBOL.queen]);
    const result = evaluateSpin(grid, BET_PER_LINE, MIDDLE_LINE);
    expect(result.wins[0]?.symbol).toBe(SYMBOL.ten);
    expect(result.wins[0]?.matchCount).toBe(4);
    expect(result.wins[0]?.amountCents).toBe(lineMultiplier(SYMBOL.ten, 4) * BET_PER_LINE);
  });

  it("resolves leading wilds to the first real symbol", () => {
    const grid = gridFromMiddleRow([
      SYMBOL.wild,
      SYMBOL.wild,
      SYMBOL.seven,
      SYMBOL.seven,
      SYMBOL.ten,
    ]);
    const result = evaluateSpin(grid, BET_PER_LINE, MIDDLE_LINE);
    expect(result.wins[0]?.symbol).toBe(SYMBOL.seven);
    expect(result.wins[0]?.matchCount).toBe(4);
    expect(result.wins[0]?.amountCents).toBe(150 * BET_PER_LINE);
  });

  it("pays a full line of wilds at the wild rate", () => {
    const grid = gridFromMiddleRow([
      SYMBOL.wild,
      SYMBOL.wild,
      SYMBOL.wild,
      SYMBOL.wild,
      SYMBOL.wild,
    ]);
    const result = evaluateSpin(grid, BET_PER_LINE, MIDDLE_LINE);
    expect(result.wins[0]?.symbol).toBe(SYMBOL.wild);
    expect(result.wins[0]?.matchCount).toBe(5);
    expect(result.wins[0]?.amountCents).toBe(1000 * BET_PER_LINE);
  });

  it("discards a downstream win when a wild breaks the leading run early", () => {
    const grid = gridFromMiddleRow([SYMBOL.seven, SYMBOL.wild, SYMBOL.ten, SYMBOL.ten, SYMBOL.ten]);
    const result = evaluateSpin(grid, BET_PER_LINE, MIDDLE_LINE);
    expect(result.wins).toHaveLength(0);
    expect(result.totalWinCents).toBe(0);
  });

  it("does not pay a run shorter than the minimum", () => {
    const grid = gridFromMiddleRow([SYMBOL.ten, SYMBOL.queen, SYMBOL.king, SYMBOL.ace, SYMBOL.gem]);
    const result = evaluateSpin(grid, BET_PER_LINE, MIDDLE_LINE);
    expect(result.wins).toHaveLength(0);
    expect(result.totalWinCents).toBe(0);
  });

  it("sums wins across every payline on a full screen", () => {
    const grid: SymbolId[][] = Array.from({ length: 5 }, (): SymbolId[] => [
      SYMBOL.ten,
      SYMBOL.ten,
      SYMBOL.ten,
    ]);
    const result = evaluateSpin(grid, 1);
    expect(result.wins).toHaveLength(20);
    expect(result.totalWinCents).toBe(20 * 25);
    for (const win of result.wins) {
      expect(win.symbol).toBe(SYMBOL.ten);
      expect(win.matchCount).toBe(5);
    }
  });
});
