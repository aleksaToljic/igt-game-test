import { Sprite, type Texture } from "pixi.js";

export class BackgroundView extends Sprite {
  constructor(texture: Texture) {
    super(texture);
    this.anchor.set(0.5);
  }

  resize(width: number, height: number): void {
    const scale = Math.max(width / this.texture.width, height / this.texture.height);
    this.scale.set(scale);
    this.position.set(width / 2, height / 2);
  }
}
