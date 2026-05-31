import { Container, Text } from "pixi.js";

const LABEL_COLOR = 0x8a93a6;
const VALUE_COLOR = 0xf4f4f5;

export class StatDisplay extends Container {
  private readonly value: Text;

  constructor(caption: string, initialValue: string) {
    super();
    const captionText = new Text({
      text: caption,
      style: {
        fill: LABEL_COLOR,
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        fontWeight: "700",
      },
    });
    this.value = new Text({
      text: initialValue,
      style: {
        fill: VALUE_COLOR,
        fontFamily: "Arial, sans-serif",
        fontSize: 26,
        fontWeight: "700",
      },
    });
    this.value.y = 20;
    this.addChild(captionText, this.value);
  }

  setValue(text: string): void {
    this.value.text = text;
  }

  setValueColor(color: number): void {
    this.value.style.fill = color;
  }
}
