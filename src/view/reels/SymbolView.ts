import { gsap } from "gsap";
import { Container, Graphics, Text } from "pixi.js";
import { GAME_CONFIG } from "../../config/gameConfig";
import { type SymbolId, symbolById } from "../../config/symbols";

const TILE_PADDING = 8;
const CORNER_RADIUS = 16;
const GLOW_COLOR = 0xfde047;
const DIMMED_ALPHA = 0.32;
const PULSE_SCALE = 1.12;
const PULSE_DURATION = 0.42;

export class SymbolView extends Container {
  private readonly content = new Container();
  private readonly glow = new Graphics();
  private readonly background = new Graphics();
  private readonly glyph: Text;
  private symbolId: SymbolId;
  private winning = false;

  constructor(symbolId: SymbolId) {
    super();
    this.symbolId = symbolId;
    const size = GAME_CONFIG.symbolSize;
    this.glyph = new Text({
      text: "",
      style: { fill: 0x10131f, fontFamily: "Arial, sans-serif", fontSize: 40, fontWeight: "700" },
    });
    this.glyph.anchor.set(0.5);
    this.glyph.position.set(size / 2, size / 2);
    this.content.addChild(this.glow, this.background, this.glyph);
    this.content.pivot.set(size / 2, size / 2);
    this.content.position.set(size / 2, size / 2);
    this.addChild(this.content);
    this.draw();
  }

  setSymbol(symbolId: SymbolId): void {
    if (symbolId === this.symbolId) {
      return;
    }
    this.symbolId = symbolId;
    this.draw();
  }

  setDimmed(dimmed: boolean): void {
    this.content.alpha = dimmed ? DIMMED_ALPHA : 1;
  }

  playWin(): void {
    if (this.winning) {
      return;
    }
    this.winning = true;
    gsap.to(this.content.scale, {
      x: PULSE_SCALE,
      y: PULSE_SCALE,
      duration: PULSE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    gsap.to(this.glow, {
      alpha: 1,
      duration: PULSE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
  }

  stopWin(): void {
    if (!this.winning) {
      return;
    }
    this.winning = false;
    gsap.killTweensOf(this.content.scale);
    gsap.killTweensOf(this.glow);
    this.content.scale.set(1);
    this.glow.alpha = 0;
  }

  private draw(): void {
    const size = GAME_CONFIG.symbolSize;
    const inner = size - TILE_PADDING * 2;
    const definition = symbolById(this.symbolId);

    this.background.clear();
    this.background
      .roundRect(TILE_PADDING, TILE_PADDING, inner, inner, CORNER_RADIUS)
      .fill(definition.color);

    this.glow.clear();
    this.glow
      .roundRect(TILE_PADDING - 4, TILE_PADDING - 4, inner + 8, inner + 8, CORNER_RADIUS + 4)
      .stroke({ width: 6, color: GLOW_COLOR });
    this.glow.alpha = 0;

    this.glyph.text = definition.label;
  }
}
