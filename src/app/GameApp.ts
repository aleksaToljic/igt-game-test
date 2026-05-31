import { Application } from "pixi.js";
import { initialGrid } from "../config/gameConfig";
import { Game } from "../core/Game";
import { MockGameServer } from "../server/MockGameServer";
import { ReelsView } from "../view/reels/ReelsView";
import { ControlPanel } from "../view/ui/ControlPanel";

const PANEL_GAP = 24;

export class GameApp {
  private readonly app = new Application();
  private readonly server = new MockGameServer();
  private reels: ReelsView | undefined;
  private controls: ControlPanel | undefined;
  private game: Game | undefined;

  async init(root: HTMLElement): Promise<void> {
    await this.app.init({
      background: "#0b0e1a",
      resizeTo: window,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });
    root.appendChild(this.app.canvas);
    this.app.stage.eventMode = "static";

    const reels = new ReelsView(initialGrid());
    const controls = new ControlPanel(reels.contentWidth, {
      onSpin: () => this.game?.spin(),
      onBetChange: (betCents) => this.game?.setBet(betCents),
    });
    this.app.stage.addChild(reels, controls);
    this.reels = reels;
    this.controls = controls;

    this.game = new Game(this.server, reels, controls);
    this.game.start();
    this.layout();

    this.app.ticker.add((ticker) => reels.update(ticker.deltaMS));
    addEventListener("resize", () => this.layout());
    addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        this.game?.spin();
      }
    });
  }

  private layout(): void {
    if (!this.reels || !this.controls) {
      return;
    }
    const totalHeight = this.reels.contentHeight + PANEL_GAP + this.controls.panelHeight;
    const top = Math.round((this.app.screen.height - totalHeight) / 2);
    const left = Math.round((this.app.screen.width - this.reels.contentWidth) / 2);
    this.reels.position.set(left, top);
    this.controls.position.set(left, top + this.reels.contentHeight + PANEL_GAP);
  }
}
