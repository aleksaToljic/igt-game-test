import { gsap } from "gsap";
import { Container, Graphics, Text } from "pixi.js";
import type { WinCelebration } from "../../core/Game";
import { formatCents } from "../../utils/money";

export class BigWinOverlay extends Container implements WinCelebration {
  private readonly scrim = new Graphics();
  private readonly group = new Container();
  private readonly title: Text;
  private readonly amount: Text;

  constructor() {
    super();
    this.visible = false;
    this.title = new Text({
      text: "BIG WIN",
      style: { fill: 0xfde047, fontFamily: "Arial, sans-serif", fontSize: 76, fontWeight: "800" },
    });
    this.title.anchor.set(0.5);
    this.title.y = -36;
    this.amount = new Text({
      text: "",
      style: { fill: 0xffffff, fontFamily: "Arial, sans-serif", fontSize: 56, fontWeight: "800" },
    });
    this.amount.anchor.set(0.5);
    this.amount.y = 44;
    this.group.addChild(this.title, this.amount);
    this.addChild(this.scrim, this.group);
  }

  resize(width: number, height: number): void {
    this.scrim.clear();
    this.scrim.rect(0, 0, width, height).fill({ color: 0x05070f, alpha: 0.72 });
    this.group.position.set(width / 2, height / 2);
  }

  celebrateBigWin(amountCents: number): void {
    this.amount.text = formatCents(amountCents);
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.group.scale);
    this.visible = true;
    this.alpha = 1;
    this.group.scale.set(0.6);
    gsap.to(this.group.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(1.7)" });
  }

  clear(): void {
    if (!this.visible) {
      return;
    }
    gsap.killTweensOf(this);
    gsap.to(this, {
      alpha: 0,
      duration: 0.3,
      onComplete: () => {
        this.visible = false;
      },
    });
  }
}
