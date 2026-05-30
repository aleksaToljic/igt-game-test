import type { SymbolId } from "../config/symbols";

export interface SpinRequestDTO {
  readonly betCents: number;
}

export interface ReelPosition {
  readonly reel: number;
  readonly row: number;
}

export interface WinLineDTO {
  readonly lineIndex: number;
  readonly symbol: SymbolId;
  readonly matchCount: number;
  readonly positions: readonly ReelPosition[];
  readonly amountCents: number;
}

export interface SpinResponseDTO {
  readonly grid: readonly (readonly SymbolId[])[];
  readonly wins: readonly WinLineDTO[];
  readonly totalWinCents: number;
  readonly balanceCents: number;
}
