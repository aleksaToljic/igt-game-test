import { Application, Assets, Container, type Texture } from "pixi.js";
import { AudioManager } from "../audio/AudioManager";
import { initialGrid } from "../config/gameConfig";
import { SYMBOL, type SymbolId } from "../config/symbols";
import { Game } from "../core/Game";
import { MockGameServer } from "../server/MockGameServer";
import { BackgroundView } from "../view/BackgroundView";
import { ReelsView } from "../view/reels/ReelsView";
import { ControlPanel } from "../view/ui/ControlPanel";
import { SoundButton } from "../view/ui/SoundButton";
import { BigWinOverlay } from "../view/win/BigWinOverlay";

const PANEL_GAP = 24;
const SCREEN_MARGIN = 48;
const CORNER_MARGIN = 16;
const BACKGROUND_URL = `${import.meta.env.BASE_URL}assets/casino-bg.png`;
const SOUND_ON_URL = `${import.meta.env.BASE_URL}assets/sound-on.svg`;
const SOUND_OFF_URL = `${import.meta.env.BASE_URL}assets/sound-off.svg`;
const WILD_URL = `${import.meta.env.BASE_URL}assets/wild.png`;

export class GameApp {
  private readonly app = new Application();
  private readonly server = new MockGameServer();
  private readonly audio = new AudioManager(import.meta.env.BASE_URL);
  private readonly root = new Container();
  private background: BackgroundView | undefined;
  private reels: ReelsView | undefined;
  private controls: ControlPanel | undefined;
  private overlay: BigWinOverlay | undefined;
  private soundButton: SoundButton | undefined;
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

    const [backgroundTexture, soundOnTexture, soundOffTexture, wildTexture] = await Promise.all([
      Assets.load<Texture>(BACKGROUND_URL).catch(() => undefined),
      Assets.load<Texture>(SOUND_ON_URL).catch(() => undefined),
      Assets.load<Texture>(SOUND_OFF_URL).catch(() => undefined),
      Assets.load<Texture>(WILD_URL).catch(() => undefined),
    ]);
    const symbolTextures = new Map<SymbolId, Texture>();
    if (wildTexture) {
      symbolTextures.set(SYMBOL.wild, wildTexture);
    }
    if (backgroundTexture) {
      this.background = new BackgroundView(backgroundTexture);
      this.app.stage.addChild(this.background);
    }

    const reels = new ReelsView(initialGrid(), () => this.audio.playReelStop(), symbolTextures);
    const controls = new ControlPanel(reels.contentWidth, {
      onSpin: () => this.game?.spin(),
      onBetChange: (betCents) => this.game?.setBet(betCents),
    });
    controls.position.set(0, reels.contentHeight + PANEL_GAP);
    this.root.addChild(reels, controls);
    this.app.stage.addChild(this.root);

    const overlay = new BigWinOverlay();
    this.app.stage.addChild(overlay);

    const soundButton = new SoundButton(
      soundOnTexture,
      soundOffTexture,
      this.audio.isMuted(),
      () => {
        soundButton.setMuted(this.audio.toggleMute());
      },
    );
    this.app.stage.addChild(soundButton);

    this.reels = reels;
    this.controls = controls;
    this.overlay = overlay;
    this.soundButton = soundButton;

    this.game = new Game(this.server, reels, controls, overlay, this.audio);
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
    const { width, height } = this.app.screen;
    this.background?.resize(width, height);

    const naturalWidth = this.reels.contentWidth;
    const naturalHeight = this.reels.contentHeight + PANEL_GAP + this.controls.panelHeight;
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
    if (this.soundButton) {
      this.soundButton.position.set(
        width - CORNER_MARGIN - this.soundButton.buttonSize,
        CORNER_MARGIN,
      );
    }
  }
}
