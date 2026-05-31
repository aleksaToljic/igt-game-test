import { Container, Graphics, Text } from "pixi.js";

const WIDTH = 160;
const HEIGHT = 64;
const ENABLED_COLOR = 0x46d17a;
const DISABLED_COLOR = 0x37415a;

export class SpinButton extends Container {
  readonly buttonWidth = WIDTH;
  readonly buttonHeight = HEIGHT;
  private readonly background = new Graphics();
  private readonly caption: Text;
  private enabled = true;

  constructor(onPress: () => void) {
    super();
    this.caption = new Text({
      text: "SPIN",
      style: { fill: 0x0b0e1a, fontFamily: "Arial, sans-serif", fontSize: 24, fontWeight: "800" },
    });
    this.caption.anchor.set(0.5);
    this.caption.position.set(WIDTH / 2, HEIGHT / 2);
    this.addChild(this.background, this.caption);
    this.draw();

    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointertap", () => {
      if (this.enabled) {
        onPress();
      }
    });
  }

  setEnabled(enabled: boolean): void {
    if (enabled === this.enabled) {
      return;
    }
    this.enabled = enabled;
    this.cursor = enabled ? "pointer" : "default";
    this.caption.alpha = enabled ? 1 : 0.5;
    this.draw();
  }

  private draw(): void {
    this.background.clear();
    this.background
      .roundRect(0, 0, WIDTH, HEIGHT, 14)
      .fill(this.enabled ? ENABLED_COLOR : DISABLED_COLOR);
  }
}
