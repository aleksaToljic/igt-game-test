import { Application } from "pixi.js";
import { GAME_CONFIG } from "../config/gameConfig";
import type { SymbolId } from "../config/symbols";
import { MockGameServer } from "../server/MockGameServer";
import { atWrapped } from "../utils/arrays";
import { ReelsView } from "../view/reels/ReelsView";

export class GameApp {
  private readonly app = new Application();
  private readonly server = new MockGameServer();
  private reels: ReelsView | undefined;
  private spinning = false;

  async init(root: HTMLElement): Promise<void> {
    await this.app.init({
      background: "#0b0e1a",
      resizeTo: window,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });
    root.appendChild(this.app.canvas);

    this.reels = new ReelsView(buildInitialGrid());
    this.app.stage.addChild(this.reels);
    this.layout();

    this.app.ticker.add((ticker) => this.reels?.update(ticker.deltaMS));
    addEventListener("resize", () => this.layout());
    addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        this.spin();
      }
    });
    this.app.canvas.addEventListener("pointerdown", () => this.spin());
  }

  private spin(): void {
    if (this.spinning || !this.reels) {
      return;
    }
    const reels = this.reels;
    this.spinning = true;
    reels.startSpin();

    const betCents = GAME_CONFIG.betLevelsCents[GAME_CONFIG.defaultBetIndex] ?? 0;
    const startedAt = performance.now();
    this.server
      .getResponseData({ betCents })
      .then((response) => {
        const wait = Math.max(0, GAME_CONFIG.timing.minSpinMs - (performance.now() - startedAt));
        window.setTimeout(() => {
          reels.stop(response.grid, () => {
            this.spinning = false;
          });
        }, wait);
      })
      .catch(() => {
        reels.stop(buildInitialGrid(), () => {
          this.spinning = false;
        });
      });
  }

  private layout(): void {
    if (!this.reels) {
      return;
    }
    this.reels.x = Math.round((this.app.screen.width - this.reels.contentWidth) / 2);
    this.reels.y = Math.round((this.app.screen.height - this.reels.contentHeight) / 2);
  }
}

function buildInitialGrid(): SymbolId[][] {
  const grid: SymbolId[][] = [];
  for (let reel = 0; reel < GAME_CONFIG.reelCount; reel += 1) {
    const strip = GAME_CONFIG.reelStrips[reel];
    if (!strip) {
      continue;
    }
    const column: SymbolId[] = [];
    for (let row = 0; row < GAME_CONFIG.rowCount; row += 1) {
      column.push(atWrapped(strip, row));
    }
    grid.push(column);
  }
  return grid;
}
