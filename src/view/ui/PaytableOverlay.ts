import { Container, Graphics, Text, type Texture } from "pixi.js";
import { GAME_CONFIG } from "../../config/gameConfig";
import { PAYLINES } from "../../config/paylines";
import { PAYTABLE } from "../../config/paytable";
import { SYMBOLS, type SymbolId } from "../../config/symbols";
import { SymbolView } from "../reels/SymbolView";

const PANEL_WIDTH = 400;
const PADDING = 24;
const ROW_HEIGHT = 56;
const ICON_SIZE = 44;
const MATCH_COUNTS = [3, 4, 5];
const PAYOUT_COLUMNS = [210, 290, 370];
const TITLE_COLOR = 0xfde047;
const TEXT_COLOR = 0xf4f4f5;
const MUTED_COLOR = 0x8a93a6;

export class PaytableOverlay extends Container {
  private readonly scrim = new Graphics();
  private readonly panel = new Container();
  private readonly panelHeight: number;

  constructor(textures?: ReadonlyMap<SymbolId, Texture>) {
    super();
    this.visible = false;
    this.eventMode = "static";

    this.scrim.eventMode = "static";
    this.scrim.cursor = "pointer";
    this.scrim.on("pointertap", () => this.close());
    this.addChild(this.scrim);

    const background = new Graphics();
    this.panel.addChild(background);

    const title = new Text({
      text: "PAYTABLE",
      style: {
        fill: TITLE_COLOR,
        fontFamily: "Arial, sans-serif",
        fontSize: 28,
        fontWeight: "800",
      },
    });
    title.anchor.set(0.5, 0);
    title.position.set(PANEL_WIDTH / 2, PADDING);
    this.panel.addChild(title);

    const headerY = PADDING + 50;
    MATCH_COUNTS.forEach((count, index) => {
      const header = new Text({
        text: `${count}`,
        style: {
          fill: MUTED_COLOR,
          fontFamily: "Arial, sans-serif",
          fontSize: 15,
          fontWeight: "700",
        },
      });
      header.anchor.set(1, 0.5);
      header.position.set(PAYOUT_COLUMNS[index] ?? 0, headerY);
      this.panel.addChild(header);
    });

    const rowsTop = headerY + 24;
    const ordered = [...SYMBOLS].sort(
      (first, second) => (PAYTABLE[second.id][5] ?? 0) - (PAYTABLE[first.id][5] ?? 0),
    );
    ordered.forEach((symbol, index) => {
      const rowY = rowsTop + index * ROW_HEIGHT;
      const icon = new SymbolView(symbol.id, textures);
      icon.scale.set(ICON_SIZE / GAME_CONFIG.symbolSize);
      icon.position.set(PADDING, rowY);
      this.panel.addChild(icon);

      if (textures?.has(symbol.id)) {
        const isWild = symbol.kind === "wild";
        const name = new Text({
          text: symbol.label,
          style: {
            fill: isWild ? TITLE_COLOR : TEXT_COLOR,
            fontFamily: "Arial, sans-serif",
            fontSize: 16,
            fontWeight: isWild ? "800" : "700",
          },
        });
        name.anchor.set(0, 0.5);
        name.position.set(PADDING + ICON_SIZE + 16, rowY + ICON_SIZE / 2);
        this.panel.addChild(name);
      }

      MATCH_COUNTS.forEach((count, columnIndex) => {
        const value = new Text({
          text: `${PAYTABLE[symbol.id][count] ?? 0}`,
          style: {
            fill: symbol.kind === "wild" ? TITLE_COLOR : TEXT_COLOR,
            fontFamily: "Arial, sans-serif",
            fontSize: 17,
            fontWeight: "700",
          },
        });
        value.anchor.set(1, 0.5);
        value.position.set(PAYOUT_COLUMNS[columnIndex] ?? 0, rowY + ICON_SIZE / 2);
        this.panel.addChild(value);
      });
    });

    const notesTop = rowsTop + ordered.length * ROW_HEIGHT + 8;
    const notes = new Text({
      text: [
        "WILD substitutes for every symbol.",
        `${PAYLINES.length} lines pay left to right from reel 1.`,
        "Line win = payout shown above × bet per line.",
        "",
        "How to play: pick a BET, then press SPIN.",
      ].join("\n"),
      style: {
        fill: MUTED_COLOR,
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        lineHeight: 21,
      },
    });
    notes.position.set(PADDING, notesTop);
    this.panel.addChild(notes);

    this.panelHeight = notesTop + notes.height + PADDING;
    background
      .roundRect(0, 0, PANEL_WIDTH, this.panelHeight, 20)
      .fill(0x141a2e)
      .stroke({ width: 2, color: 0x2b3556 });

    const close = new Text({
      text: "✕",
      style: {
        fill: MUTED_COLOR,
        fontFamily: "Arial, sans-serif",
        fontSize: 22,
        fontWeight: "700",
      },
    });
    close.anchor.set(0.5);
    close.position.set(PANEL_WIDTH - PADDING, PADDING + 8);
    close.eventMode = "static";
    close.cursor = "pointer";
    close.on("pointertap", () => this.close());
    this.panel.addChild(close);

    this.addChild(this.panel);
  }

  isOpen(): boolean {
    return this.visible;
  }

  toggle(): void {
    this.visible = !this.visible;
  }

  close(): void {
    this.visible = false;
  }

  resize(width: number, height: number): void {
    this.scrim.clear();
    this.scrim.rect(0, 0, width, height).fill({ color: 0x05070f, alpha: 0.78 });
    const scale = Math.min(1, (width - 32) / PANEL_WIDTH, (height - 32) / this.panelHeight);
    this.panel.scale.set(scale);
    this.panel.position.set(
      Math.round((width - PANEL_WIDTH * scale) / 2),
      Math.round((height - this.panelHeight * scale) / 2),
    );
  }
}
