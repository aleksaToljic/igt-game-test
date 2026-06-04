import { AnimatedSprite, type Container, type Graphics, type Texture, type Ticker } from "pixi.js";
import { GAME_CONFIG } from "../../config/gameConfig";
import type { WinLineDTO } from "../../server/dto";
import type { Reel } from "../reels/Reel";
import type { IWinAnimation } from "./IWinAnimation";

const LINE_COLORS = [0xfde047, 0x22d3ee, 0xf472b6, 0x46d17a, 0xa78bfa, 0xfb923c];
const BURST_SPEED = 0.3;
const BURST_SCALE = 1.4;

export class WinPresenter {
  private readonly reels: readonly Reel[];
  private readonly lines: Graphics;
  private readonly animation: IWinAnimation;
  private readonly burstLayer: Container | undefined;
  private readonly burstFrames: readonly Texture[] | undefined;
  private readonly bursts: AnimatedSprite[] = [];

  constructor(
    reels: readonly Reel[],
    lines: Graphics,
    animation: IWinAnimation,
    burstLayer?: Container,
    burstFrames?: readonly Texture[],
  ) {
    this.reels = reels;
    this.lines = lines;
    this.animation = animation;
    this.burstLayer = burstLayer;
    this.burstFrames = burstFrames;
  }

  present(wins: readonly WinLineDTO[]): void {
    this.dimAll();
    this.lines.clear();
    const sparked = new Set<number>();
    wins.forEach((win, index) => {
      this.drawLine(win, LINE_COLORS[index % LINE_COLORS.length] ?? 0xffffff);
      for (const position of win.positions) {
        const cell = this.reels[position.reel]?.visibleSymbol(position.row);
        if (cell) {
          cell.setDimmed(false);
          this.animation.play(cell);
        }
        this.spawnBurst(position.reel, position.row, sparked);
      }
    });
  }

  update(ticker: Ticker): void {
    for (const burst of [...this.bursts]) {
      burst.update(ticker);
    }
  }

  clear(): void {
    this.lines.clear();
    for (const reel of this.reels) {
      for (const symbol of reel.visibleSymbols()) {
        this.animation.stop(symbol);
        symbol.setDimmed(false);
      }
    }
    this.clearBursts();
  }

  private spawnBurst(reel: number, row: number, sparked: Set<number>): void {
    if (!this.burstLayer || !this.burstFrames) {
      return;
    }
    const key = reel * GAME_CONFIG.rowCount + row;
    if (sparked.has(key)) {
      return;
    }
    sparked.add(key);
    const { symbolSize, reelGap } = GAME_CONFIG;
    const burst = new AnimatedSprite([...this.burstFrames]);
    burst.loop = false;
    burst.autoUpdate = false;
    burst.animationSpeed = BURST_SPEED;
    burst.anchor.set(0.5);
    burst.scale.set((symbolSize * BURST_SCALE) / burst.width);
    burst.x = reel * (symbolSize + reelGap) + symbolSize / 2;
    burst.y = row * symbolSize + symbolSize / 2;
    burst.onComplete = () => this.removeBurst(burst);
    this.bursts.push(burst);
    this.burstLayer.addChild(burst);
    burst.gotoAndPlay(0);
  }

  private removeBurst(burst: AnimatedSprite): void {
    const index = this.bursts.indexOf(burst);
    if (index >= 0) {
      this.bursts.splice(index, 1);
    }
    this.burstLayer?.removeChild(burst);
    burst.destroy();
  }

  private clearBursts(): void {
    for (const burst of this.bursts) {
      this.burstLayer?.removeChild(burst);
      burst.destroy();
    }
    this.bursts.length = 0;
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
