import { Application, Container } from "pixi.js";
import { initialGrid } from "../config/gameConfig";
import { Game } from "../core/Game";
import { MockGameServer } from "../server/MockGameServer";
import { ReelsView } from "../view/reels/ReelsView";
import { ControlPanel } from "../view/ui/ControlPanel";
import { BigWinOverlay } from "../view/win/BigWinOverlay";

const PANEL_GAP = 24;
const SCREEN_MARGIN = 48;

export class GameApp {
  private readonly app = new Application();
  private readonly server = new MockGameServer();
  private readonly root = new Container();
  private reels: ReelsView | undefined;
  private controls: ControlPanel | undefined;
  private overlay: BigWinOverlay | undefined;
  private game: Game | undefined;

  async init(mountPoint: HTMLElement): Promise<void> {
    await this.app.init({
      background: "#0b0e1a",
      resizeTo: window,
      antialias: true,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
    });
    mountPoint.appendChild(this.app.canvas);
    this.app.stage.eventMode = "static";

    const reels = new ReelsView(initialGrid());
    const controls = new ControlPanel(reels.contentWidth, {
      onSpin: () => this.game?.spin(),
      onBetChange: (betCents) => this.game?.setBet(betCents),
    });
    controls.position.set(0, reels.contentHeight + PANEL_GAP);
    this.root.addChild(reels, controls);
    this.app.stage.addChild(this.root);

    const overlay = new BigWinOverlay();
    this.app.stage.addChild(overlay);

    this.reels = reels;
    this.controls = controls;
    this.overlay = overlay;

    this.game = new Game(this.server, reels, controls, overlay);
    this.game.start();
    this.layout();

    this.app.ticker.add((ticker) => reels.update(ticker.deltaMS));
    this.app.renderer.on("resize", () => this.layout());
    addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        this.game?.spin();
      }
    });
  }

  private layout(): void {
    if (!this.reels || !this.controls || !this.overlay) {
      return;
    }
    const naturalWidth = this.reels.contentWidth;
    const naturalHeight = this.reels.contentHeight + PANEL_GAP + this.controls.panelHeight;
    const { width, height } = this.app.screen;
    const scale = Math.min(
      1,
      (width - SCREEN_MARGIN) / naturalWidth,
      (height - SCREEN_MARGIN) / naturalHeight,
    );
    this.root.scale.set(scale);
    this.root.position.set(
      Math.round((width - naturalWidth * scale) / 2),
      Math.round((height - naturalHeight * scale) / 2),
    );
    this.overlay.resize(width, height);
  }
}
