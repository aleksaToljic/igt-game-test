export const SYMBOL = {
  ten: 0,
  jack: 1,
  queen: 2,
  king: 3,
  ace: 4,
  gem: 5,
  crown: 6,
  seven: 7,
  wild: 8,
} as const;

export type SymbolId = (typeof SYMBOL)[keyof typeof SYMBOL];

export type SymbolKind = "low" | "high" | "wild";

export interface SymbolDefinition {
  id: SymbolId;
  name: string;
  label: string;
  kind: SymbolKind;
  color: number;
}

export const SYMBOLS: readonly SymbolDefinition[] = [
  { id: SYMBOL.ten, name: "ten", label: "10", kind: "low", color: 0x8a93a6 },
  { id: SYMBOL.jack, name: "jack", label: "J", kind: "low", color: 0x60a5fa },
  { id: SYMBOL.queen, name: "queen", label: "Q", kind: "low", color: 0x34d399 },
  { id: SYMBOL.king, name: "king", label: "K", kind: "low", color: 0xfbbf24 },
  { id: SYMBOL.ace, name: "ace", label: "A", kind: "low", color: 0xf472b6 },
  { id: SYMBOL.gem, name: "gem", label: "GEM", kind: "high", color: 0x22d3ee },
  { id: SYMBOL.crown, name: "crown", label: "CRWN", kind: "high", color: 0xa78bfa },
  { id: SYMBOL.seven, name: "seven", label: "7", kind: "high", color: 0xef4444 },
  { id: SYMBOL.wild, name: "wild", label: "WILD", kind: "wild", color: 0xfde047 },
];

export const WILD_ID: SymbolId = SYMBOL.wild;

export function symbolById(id: SymbolId): SymbolDefinition {
  const definition = SYMBOLS[id];
  if (!definition) {
    throw new RangeError(`Unknown symbol id ${id}`);
  }
  return definition;
}
