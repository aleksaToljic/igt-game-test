import { Container, Graphics } from "pixi.js";
import { GAME_CONFIG } from "../../config/gameConfig";
import type { SymbolId } from "../../config/symbols";
import { Reel } from "./Reel";

const FRAME_PADDING = 14;

export class ReelsView extends Container {
  readonly contentWidth: number;
  readonly contentHeight: number;
  private readonly reels: Reel[] = [];
  private readonly reelArea = new Container();
  private readonly frame = new Graphics();
  private readonly windowMask = new Graphics();
  private readonly pendingStops: number[] = [];

  constructor(grid: readonly (readonly SymbolId[])[]) {
    super();
    const { reelCount, rowCount, symbolSize, reelGap } = GAME_CONFIG;
    this.contentWidth = reelCount * symbolSize + (reelCount - 1) * reelGap;
    this.contentHeight = rowCount * symbolSize;

    this.drawFrame();
    this.addChild(this.frame, this.reelArea, this.windowMask);

    for (let reel = 0; reel < reelCount; reel += 1) {
      const reelView = new Reel(GAME_CONFIG.reelStrips[reel] ?? [], grid[reel] ?? []);
      reelView.x = reel * (symbolSize + reelGap);
      this.reels.push(reelView);
      this.reelArea.addChild(reelView);
    }

    this.windowMask.roundRect(0, 0, this.contentWidth, this.contentHeight, 8).fill(0xffffff);
    this.reelArea.mask = this.windowMask;
  }

  startSpin(): void {
    this.clearPendingStops();
    for (const reel of this.reels) {
      reel.startSpin();
    }
  }

  stop(grid: readonly (readonly SymbolId[])[], onAllStopped: () => void): void {
    this.clearPendingStops();
    let remaining = this.reels.length;
    if (remaining === 0) {
      onAllStopped();
      return;
    }
    this.reels.forEach((reel, index) => {
      const timer = window.setTimeout(() => {
        reel.stopAt(grid[index] ?? [], () => {
          remaining -= 1;
          if (remaining === 0) {
            onAllStopped();
          }
        });
      }, index * GAME_CONFIG.timing.reelStopStaggerMs);
      this.pendingStops.push(timer);
    });
  }

  update(deltaMs: number): void {
    for (const reel of this.reels) {
      reel.update(deltaMs);
    }
  }

  private clearPendingStops(): void {
    for (const timer of this.pendingStops) {
      window.clearTimeout(timer);
    }
    this.pendingStops.length = 0;
  }

  private drawFrame(): void {
    this.frame
      .roundRect(
        -FRAME_PADDING,
        -FRAME_PADDING,
        this.contentWidth + FRAME_PADDING * 2,
        this.contentHeight + FRAME_PADDING * 2,
        20,
      )
      .fill(0x141a2e)
      .stroke({ width: 3, color: 0x2b3556 });
  }
}
