import type { SymbolView } from "../reels/SymbolView";

export interface IWinAnimation {
  play(symbol: SymbolView): void;
  stop(symbol: SymbolView): void;
}
