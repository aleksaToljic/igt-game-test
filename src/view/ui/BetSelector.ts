import { Container, Graphics, Text } from "pixi.js";
import { formatCents } from "../../utils/money";

const WIDTH = 170;
const HEIGHT = 64;
const ROW_HEIGHT = 38;
const ROW_COLOR = 0x1b2440;
const ROW_HOVER_COLOR = 0x2b3a63;

export class BetSelector extends Container {
  private readonly levels: readonly number[];
  private selectedIndex: number;
  private readonly onChange: (betCents: number) => void;

  private readonly header = new Container();
  private readonly headerBackground = new Graphics();
  private readonly valueText: Text;
  private readonly arrow: Text;
  private readonly list = new Container();
  private readonly rowBackgrounds: Graphics[] = [];
  private isOpen = false;

  constructor(
    levels: readonly number[],
    selectedIndex: number,
    onChange: (betCents: number) => void,
  ) {
    super();
    this.levels = levels;
    this.selectedIndex = selectedIndex;
    this.onChange = onChange;

    this.valueText = new Text({
      text: "",
      style: { fill: 0xf4f4f5, fontFamily: "Arial, sans-serif", fontSize: 24, fontWeight: "800" },
    });
    this.valueText.anchor.set(0, 0.5);
    this.valueText.position.set(16, HEIGHT / 2);

    this.arrow = new Text({
      text: "▼",
      style: { fill: 0x8a93a6, fontFamily: "Arial, sans-serif", fontSize: 14 },
    });
    this.arrow.anchor.set(1, 0.5);
    this.arrow.position.set(WIDTH - 14, HEIGHT / 2);

    this.drawHeaderBackground();
    this.header.addChild(this.headerBackground, this.valueText, this.arrow);
    this.header.eventMode = "static";
    this.header.cursor = "pointer";
    this.header.on("pointertap", () => this.toggle());

    this.buildList();
    this.list.visible = false;

    this.addChild(this.list, this.header);
    this.refreshValue();
  }

  setEnabled(enabled: boolean): void {
    this.header.eventMode = enabled ? "static" : "none";
    this.header.cursor = enabled ? "pointer" : "default";
    this.alpha = enabled ? 1 : 0.6;
    if (!enabled) {
      this.close();
    }
  }

  private toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  private open(): void {
    this.isOpen = true;
    this.list.visible = true;
    this.arrow.text = "▲";
  }

  private close(): void {
    this.isOpen = false;
    this.list.visible = false;
    this.arrow.text = "▼";
    for (const rowBackground of this.rowBackgrounds) {
      rowBackground.tint = 0xffffff;
    }
  }

  private select(index: number): void {
    this.selectedIndex = index;
    this.refreshValue();
    this.close();
    this.onChange(this.levels[index] ?? 0);
  }

  private refreshValue(): void {
    this.valueText.text = formatCents(this.levels[this.selectedIndex] ?? 0);
  }

  private drawHeaderBackground(): void {
    this.headerBackground
      .roundRect(0, 0, WIDTH, HEIGHT, 12)
      .fill(0x1b2440)
      .stroke({ width: 2, color: 0x2b3556 });
  }

  private buildList(): void {
    const listHeight = this.levels.length * ROW_HEIGHT;

    const backdrop = new Graphics();
    backdrop.rect(-5000, -5000, 10000, 10000).fill({ color: 0x000000, alpha: 0.001 });
    backdrop.eventMode = "static";
    backdrop.on("pointertap", () => this.close());
    this.list.addChild(backdrop);

    const panel = new Graphics();
    panel
      .roundRect(0, 0, WIDTH, listHeight, 12)
      .fill(0x10162b)
      .stroke({ width: 2, color: 0x2b3556 });
    panel.eventMode = "static";
    this.list.addChild(panel);

    this.levels.forEach((level, index) => {
      const row = new Container();
      row.y = index * ROW_HEIGHT;
      const rowBackground = new Graphics();
      rowBackground.roundRect(4, 2, WIDTH - 8, ROW_HEIGHT - 4, 8).fill(ROW_COLOR);
      this.rowBackgrounds.push(rowBackground);
      const text = new Text({
        text: formatCents(level),
        style: { fill: 0xf4f4f5, fontFamily: "Arial, sans-serif", fontSize: 18, fontWeight: "700" },
      });
      text.anchor.set(0, 0.5);
      text.position.set(16, ROW_HEIGHT / 2);
      row.addChild(rowBackground, text);
      row.eventMode = "static";
      row.cursor = "pointer";
      row.on("pointertap", () => this.select(index));
      row.on("pointerover", () => {
        rowBackground.tint = ROW_HOVER_COLOR;
      });
      row.on("pointerout", () => {
        rowBackground.tint = 0xffffff;
      });
      this.list.addChild(row);
    });

    this.list.y = -(listHeight + 8);
  }
}
