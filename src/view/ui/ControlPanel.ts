import { Container, Graphics, Text } from "pixi.js";
import { GAME_CONFIG } from "../../config/gameConfig";
import { formatCents } from "../../utils/money";
import { BetSelector } from "./BetSelector";
import { SpinButton } from "./SpinButton";
import { StatDisplay } from "./StatDisplay";

const HEIGHT = 96;
const PADDING = 22;
const CAPTION_COLOR = 0x8a93a6;
const WIN_COLOR = 0xfde047;
const NEUTRAL_COLOR = 0xf4f4f5;

export interface ControlPanelCallbacks {
  onSpin: () => void;
  onBetChange: (betCents: number) => void;
}

export class ControlPanel extends Container {
  readonly panelWidth: number;
  readonly panelHeight = HEIGHT;
  private readonly balance: StatDisplay;
  private readonly win: StatDisplay;
  private readonly betSelector: BetSelector;
  private readonly spinButton: SpinButton;

  constructor(width: number, callbacks: ControlPanelCallbacks) {
    super();
    this.panelWidth = width;

    const background = new Graphics();
    background
      .roundRect(0, 0, width, HEIGHT, 16)
      .fill(0x141a2e)
      .stroke({ width: 2, color: 0x2b3556 });
    this.addChild(background);

    this.balance = new StatDisplay("BALANCE", formatCents(GAME_CONFIG.startingBalanceCents));
    this.balance.position.set(PADDING, 26);

    const betCaption = new Text({
      text: "BET",
      style: {
        fill: CAPTION_COLOR,
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        fontWeight: "700",
      },
    });
    betCaption.position.set(width * 0.31, 10);
    this.betSelector = new BetSelector(
      GAME_CONFIG.betLevelsCents,
      GAME_CONFIG.defaultBetIndex,
      callbacks.onBetChange,
    );
    this.betSelector.position.set(width * 0.31, 28);

    this.win = new StatDisplay("WIN", formatCents(0));
    this.win.position.set(width * 0.57, 26);

    this.spinButton = new SpinButton(callbacks.onSpin);
    this.spinButton.position.set(
      width - PADDING - this.spinButton.buttonWidth,
      (HEIGHT - this.spinButton.buttonHeight) / 2,
    );

    this.addChild(this.balance, betCaption, this.win, this.spinButton, this.betSelector);
  }

  setBalance(cents: number): void {
    this.balance.setValue(formatCents(cents));
  }

  setWin(cents: number): void {
    this.win.setValue(formatCents(cents));
    this.win.setValueColor(cents > 0 ? WIN_COLOR : NEUTRAL_COLOR);
  }

  setEnabled(enabled: boolean): void {
    this.spinButton.setEnabled(enabled);
    this.betSelector.setEnabled(enabled);
  }
}
