import { Container, Graphics, Sprite, type Texture } from "pixi.js";

const SIZE = 48;
const ICON_HEIGHT = 26;

export class SoundButton extends Container {
  readonly buttonSize = SIZE;
  private readonly background = new Graphics();
  private readonly icon = new Sprite();
  private readonly onTexture: Texture | undefined;
  private readonly offTexture: Texture | undefined;
  private muted: boolean;

  constructor(
    onTexture: Texture | undefined,
    offTexture: Texture | undefined,
    muted: boolean,
    onToggle: () => void,
  ) {
    super();
    this.onTexture = onTexture;
    this.offTexture = offTexture;
    this.muted = muted;

    this.icon.anchor.set(0.5);
    this.icon.position.set(SIZE / 2, SIZE / 2);
    this.addChild(this.background, this.icon);
    this.drawBackground();
    this.updateIcon();

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointertap", onToggle);
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.updateIcon();
  }

  private drawBackground(): void {
    this.background
      .roundRect(0, 0, SIZE, SIZE, 12)
      .fill(0x141a2e)
      .stroke({ width: 2, color: 0x2b3556 });
  }

  private updateIcon(): void {
    const texture = this.muted ? this.offTexture : this.onTexture;
    this.icon.visible = texture !== undefined;
    if (!texture) {
      return;
    }
    this.icon.texture = texture;
    this.icon.scale.set(ICON_HEIGHT / texture.height);
  }
}
