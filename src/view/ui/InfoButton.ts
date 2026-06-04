import { Container, Graphics, Text } from "pixi.js";

const SIZE = 48;

export class InfoButton extends Container {
  readonly buttonSize = SIZE;

  constructor(onToggle: () => void) {
    super();
    const background = new Graphics();
    background.roundRect(0, 0, SIZE, SIZE, 12).fill(0x141a2e).stroke({ width: 2, color: 0x2b3556 });

    const icon = new Text({
      text: "i",
      style: {
        fill: 0xf4f4f5,
        fontFamily: "Georgia, serif",
        fontSize: 28,
        fontWeight: "700",
        fontStyle: "italic",
      },
    });
    icon.anchor.set(0.5);
    icon.position.set(SIZE / 2, SIZE / 2);

    this.addChild(background, icon);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointertap", onToggle);
  }
}
