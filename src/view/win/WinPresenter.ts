import type { Graphics } from "pixi.js";
import { GAME_CONFIG } from "../../config/gameConfig";
import type { WinLineDTO } from "../../server/dto";
import type { Reel } from "../reels/Reel";
import type { IWinAnimation } from "./IWinAnimation";

const LINE_COLORS = [0xfde047, 0x22d3ee, 0xf472b6, 0x46d17a, 0xa78bfa, 0xfb923c];

export class WinPresenter {
  private readonly reels: readonly Reel[];
  private readonly lines: Graphics;
  private readonly animation: IWinAnimation;

  constructor(reels: readonly Reel[], lines: Graphics, animation: IWinAnimation) {
    this.reels = reels;
    this.lines = lines;
    this.animation = animation;
  }

  present(wins: readonly WinLineDTO[]): void {
    this.dimAll();
    this.lines.clear();
    wins.forEach((win, index) => {
      this.drawLine(win, LINE_COLORS[index % LINE_COLORS.length] ?? 0xffffff);
      for (const position of win.positions) {
        const cell = this.reels[position.reel]?.visibleSymbol(position.row);
        if (cell) {
          cell.setDimmed(false);
          this.animation.play(cell);
        }
      }
    });
  }

  clear(): void {
    this.lines.clear();
    for (const reel of this.reels) {
      for (const symbol of reel.visibleSymbols()) {
        this.animation.stop(symbol);
        symbol.setDimmed(false);
      }
    }
  }

  private dimAll(): void {
    for (const reel of this.reels) {
      for (const symbol of reel.visibleSymbols()) {
        symbol.setDimmed(true);
      }
    }
  }

  private drawLine(win: WinLineDTO, color: number): void {
    const { symbolSize, reelGap } = GAME_CONFIG;
    win.positions.forEach((position, index) => {
      const x = position.reel * (symbolSize + reelGap) + symbolSize / 2;
      const y = position.row * symbolSize + symbolSize / 2;
      if (index === 0) {
        this.lines.moveTo(x, y);
      } else {
        this.lines.lineTo(x, y);
      }
    });
    this.lines.stroke({ width: 6, color, alpha: 0.9 });
  }
}
