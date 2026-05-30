import { PAYLINES, type Payline } from "../config/paylines";
import { MIN_MATCH, lineMultiplier } from "../config/paytable";
import { type SymbolId, WILD_ID } from "../config/symbols";
import type { ReelPosition, SpinResponseDTO, WinLineDTO } from "./dto";

export type EvaluationResult = Pick<SpinResponseDTO, "wins" | "totalWinCents">;

interface LineCell {
  reel: number;
  row: number;
  symbol: SymbolId;
}

function readLine(grid: readonly (readonly SymbolId[])[], line: Payline): LineCell[] {
  const cells: LineCell[] = [];
  for (let reel = 0; reel < line.length; reel += 1) {
    const row = line[reel];
    const column = grid[reel];
    if (row === undefined || column === undefined) {
      throw new RangeError(`Payline references a missing reel ${reel}`);
    }
    const symbol = column[row];
    if (symbol === undefined) {
      throw new RangeError(`Grid is missing a symbol at reel ${reel}, row ${row}`);
    }
    cells.push({ reel, row, symbol });
  }
  return cells;
}

function resolveLineSymbol(cells: readonly LineCell[]): SymbolId {
  for (const cell of cells) {
    if (cell.symbol !== WILD_ID) {
      return cell.symbol;
    }
  }
  return WILD_ID;
}

function countMatches(cells: readonly LineCell[], target: SymbolId): number {
  let count = 0;
  for (const cell of cells) {
    if (cell.symbol === target || cell.symbol === WILD_ID) {
      count += 1;
    } else {
      break;
    }
  }
  return count;
}

export function evaluateSpin(
  grid: readonly (readonly SymbolId[])[],
  betPerLineCents: number,
  paylines: readonly Payline[] = PAYLINES,
): EvaluationResult {
  const wins: WinLineDTO[] = [];
  let totalWinCents = 0;

  for (let lineIndex = 0; lineIndex < paylines.length; lineIndex += 1) {
    const line = paylines[lineIndex];
    if (!line) {
      continue;
    }
    const cells = readLine(grid, line);
    const target = resolveLineSymbol(cells);
    const matchCount = countMatches(cells, target);
    if (matchCount < MIN_MATCH) {
      continue;
    }
    const multiplier = lineMultiplier(target, matchCount);
    if (multiplier <= 0) {
      continue;
    }
    const amountCents = multiplier * betPerLineCents;
    const positions: ReelPosition[] = cells
      .slice(0, matchCount)
      .map((cell) => ({ reel: cell.reel, row: cell.row }));
    wins.push({ lineIndex, symbol: target, matchCount, positions, amountCents });
    totalWinCents += amountCents;
  }

  return { wins, totalWinCents };
}
