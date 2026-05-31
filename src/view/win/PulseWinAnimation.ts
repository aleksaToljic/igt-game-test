import type { SymbolView } from "../reels/SymbolView";
import type { IWinAnimation } from "./IWinAnimation";

export class PulseWinAnimation implements IWinAnimation {
  play(symbol: SymbolView): void {
    symbol.playWin();
  }

  stop(symbol: SymbolView): void {
    symbol.stopWin();
  }
}
