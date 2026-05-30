import { Container, Graphics, Text } from "pixi.js";
import { GAME_CONFIG } from "../../config/gameConfig";
import { type SymbolId, symbolById } from "../../config/symbols";

const TILE_PADDING = 8;
const CORNER_RADIUS = 16;

export class SymbolView extends Container {
  private readonly background = new Graphics();
  private readonly glyph: Text;
  private symbolId: SymbolId;

  constructor(symbolId: SymbolId) {
    super();
    this.symbolId = symbolId;
    this.glyph = new Text({
      text: "",
      style: {
        fill: 0x10131f,
        fontFamily: "Arial, sans-serif",
        fontSize: 40,
        fontWeight: "700",
      },
    });
    this.glyph.anchor.set(0.5);
    this.addChild(this.background, this.glyph);
    this.draw();
  }

  setSymbol(symbolId: SymbolId): void {
    if (symbolId === this.symbolId) {
      return;
    }
    this.symbolId = symbolId;
    this.draw();
  }

  private draw(): void {
    const size = GAME_CONFIG.symbolSize;
    const inner = size - TILE_PADDING * 2;
    const definition = symbolById(this.symbolId);
    this.background.clear();
    this.background
      .roundRect(TILE_PADDING, TILE_PADDING, inner, inner, CORNER_RADIUS)
      .fill(definition.color);
    this.glyph.text = definition.label;
    this.glyph.position.set(size / 2, size / 2);
  }
}
