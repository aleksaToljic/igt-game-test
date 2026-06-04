import { Container, Graphics } from "pixi.js";

const SIZE = 48;
const ON_COLOR = 0x46d17a;
const OFF_COLOR = 0x8a93a6;
const SLASH_COLOR = 0xef4444;

export class SoundButton extends Container {
  readonly buttonSize = SIZE;
  private readonly background = new Graphics();
  private readonly icon = new Graphics();
  private muted: boolean;

  constructor(muted: boolean, onToggle: () => void) {
    super();
    this.muted = muted;
    this.addChild(this.background, this.icon);
    this.draw();
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointertap", onToggle);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.draw();
  }

  private draw(): void {
    this.background.clear();
    this.background
      .roundRect(0, 0, SIZE, SIZE, 12)
      .fill(0x141a2e)
      .stroke({ width: 2, color: 0x2b3556 });

    this.icon.clear();
    const color = this.muted ? OFF_COLOR : ON_COLOR;
    this.icon.poly([14, 20, 20, 20, 28, 13, 28, 35, 20, 28, 14, 28]).fill(color);
    if (this.muted) {
      this.icon.moveTo(12, 13).lineTo(36, 37).stroke({ width: 3, color: SLASH_COLOR });
    } else {
      this.icon.arc(28, 24, 6, -0.8, 0.8).stroke({ width: 2.5, color });
    }
  }
}
