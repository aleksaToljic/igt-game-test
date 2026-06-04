import { gsap } from "gsap";
import {
  AnimatedSprite,
  Container,
  Graphics,
  type Spritesheet,
  Text,
  type Texture,
  type Ticker,
} from "pixi.js";
import type { WinCelebration } from "../../core/Game";
import { formatCents } from "../../utils/money";

const SPLASH_ANIMATION = "big-win-splash";
const TEXT_ANIMATION = "big-win-text-animation";
const SPLASH_SOURCE_SIZE = 1080;
const TEXT_SOURCE_WIDTH = 756;
const SPLASH_SPEED = 0.275;
const TEXT_SPEED = 0.125;

export class BigWinOverlay extends Container implements WinCelebration {
  private readonly scrim = new Graphics();
  private readonly group = new Container();
  private readonly fallbackTitle: Text;
  private readonly amount: Text;
  private readonly splashFrames: Texture[] | undefined;
  private readonly textFrames: Texture[] | undefined;
  private splash: AnimatedSprite | undefined;
  private textAnimation: AnimatedSprite | undefined;
  private viewWidth = 0;
  private viewHeight = 0;

  constructor(splashSheet?: Spritesheet, textSheet?: Spritesheet) {
    super();
    this.visible = false;
    this.splashFrames = splashSheet?.animations[SPLASH_ANIMATION];
    this.textFrames = textSheet?.animations[TEXT_ANIMATION];

    this.fallbackTitle = new Text({
      text: "BIG WIN",
      style: { fill: 0xfde047, fontFamily: "Arial, sans-serif", fontSize: 76, fontWeight: "800" },
    });
    this.fallbackTitle.anchor.set(0.5);
    this.fallbackTitle.y = -36;
    this.fallbackTitle.visible = this.textFrames === undefined;

    this.amount = new Text({
      text: "",
      style: { fill: 0xffffff, fontFamily: "Arial, sans-serif", fontSize: 56, fontWeight: "800" },
    });
    this.amount.anchor.set(0.5);

    this.group.addChild(this.fallbackTitle, this.amount);
    this.addChild(this.scrim, this.group);
  }

  resize(width: number, height: number): void {
    this.viewWidth = width;
    this.viewHeight = height;
    this.scrim.clear();
    this.scrim.rect(0, 0, width, height).fill({ color: 0x05070f, alpha: 0.72 });
    this.group.position.set(width / 2, height / 2);
    this.layoutAnimations();
  }

  celebrateBigWin(amountCents: number): void {
    this.amount.text = formatCents(amountCents);
    gsap.killTweensOf(this);
    gsap.killTweensOf(this.group.scale);
    this.visible = true;
    this.alpha = 1;
    this.group.scale.set(1);

    if (this.splashFrames && this.textFrames) {
      this.amount.y = 150;
      this.playAnimations();
    } else {
      this.amount.y = 44;
      this.group.scale.set(0.6);
      gsap.to(this.group.scale, { x: 1, y: 1, duration: 0.5, ease: "back.out(1.7)" });
    }
  }

  update(ticker: Ticker): void {
    this.splash?.update(ticker);
    this.textAnimation?.update(ticker);
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
        this.destroyAnimations();
      },
    });
  }

  private playAnimations(): void {
    this.destroyAnimations();

    if (this.splashFrames) {
      const splash = new AnimatedSprite(this.splashFrames);
      splash.animationSpeed = SPLASH_SPEED;
      splash.loop = false;
      splash.autoUpdate = false;
      splash.anchor.set(0.5);
      this.splash = splash;
      this.group.addChildAt(splash, 0);
      splash.gotoAndPlay(0);
    }

    if (this.textFrames) {
      const textAnimation = new AnimatedSprite(this.textFrames);
      textAnimation.animationSpeed = TEXT_SPEED;
      textAnimation.loop = false;
      textAnimation.autoUpdate = false;
      textAnimation.anchor.set(0.5);
      textAnimation.y = -30;
      this.textAnimation = textAnimation;
      this.group.addChild(textAnimation);
      textAnimation.gotoAndPlay(0);
    }

    this.group.setChildIndex(this.amount, this.group.children.length - 1);
    this.layoutAnimations();
  }

  private layoutAnimations(): void {
    if (this.splash) {
      const target = Math.min(this.viewWidth, this.viewHeight) * 0.9;
      this.splash.scale.set(target > 0 ? target / SPLASH_SOURCE_SIZE : 1);
    }
    if (this.textAnimation) {
      const target = this.viewWidth * 0.6;
      this.textAnimation.scale.set(target > 0 ? target / TEXT_SOURCE_WIDTH : 1);
    }
  }

  private destroyAnimations(): void {
    if (this.splash) {
      this.group.removeChild(this.splash);
      this.splash.destroy();
      this.splash = undefined;
    }
    if (this.textAnimation) {
      this.group.removeChild(this.textAnimation);
      this.textAnimation.destroy();
      this.textAnimation = undefined;
    }
  }
}
