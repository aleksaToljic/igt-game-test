import { GAME_CONFIG, initialGrid } from "../config/gameConfig";
import type { SymbolId } from "../config/symbols";
import type { IGameServer } from "../server/IGameServer";
import type { SpinResponseDTO, WinLineDTO } from "../server/dto";
import { GameStateMachine } from "./GameStateMachine";
import { Wallet } from "./Wallet";

export interface ReelsController {
  startSpin(): void;
  stop(grid: readonly (readonly SymbolId[])[], onAllStopped: () => void): void;
  presentWins(wins: readonly WinLineDTO[]): void;
  clearWins(): void;
}

export interface GameControls {
  setBalance(cents: number): void;
  setWin(cents: number): void;
  countWin(cents: number): void;
  setEnabled(enabled: boolean): void;
}

export interface WinCelebration {
  celebrateBigWin(amountCents: number): void;
  clear(): void;
}

export interface GameAudio {
  startMusic(): void;
  playSpin(): void;
  playWin(): void;
  playBigWin(): void;
}

export class Game {
  private readonly server: IGameServer;
  private readonly reels: ReelsController;
  private readonly controls: GameControls;
  private readonly celebration: WinCelebration;
  private readonly audio: GameAudio;
  private readonly wallet: Wallet;
  private readonly machine = new GameStateMachine();
  private stopTimer: ReturnType<typeof setTimeout> | undefined;
  private presentTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(
    server: IGameServer,
    reels: ReelsController,
    controls: GameControls,
    celebration: WinCelebration,
    audio: GameAudio,
  ) {
    this.server = server;
    this.reels = reels;
    this.controls = controls;
    this.celebration = celebration;
    this.audio = audio;
    const defaultBet = GAME_CONFIG.betLevelsCents[GAME_CONFIG.defaultBetIndex] ?? 0;
    this.wallet = new Wallet(server.getBalanceCents(), defaultBet);
  }

  start(): void {
    this.controls.setBalance(this.wallet.getBalanceCents());
    this.controls.setWin(0);
    this.controls.setEnabled(true);
  }

  setBet(betCents: number): void {
    if (this.machine.is("idle")) {
      this.wallet.setBetCents(betCents);
    }
  }

  spin(): void {
    if (!this.machine.canEnter("spinning") || !this.wallet.canAfford()) {
      return;
    }
    this.clearTimers();
    this.celebration.clear();
    this.machine.enter("spinning");
    this.wallet.debitBet();
    this.controls.setBalance(this.wallet.getBalanceCents());
    this.controls.setWin(0);
    this.controls.setEnabled(false);
    this.reels.startSpin();
    this.audio.startMusic();
    this.audio.playSpin();

    const startedAt = performance.now();
    this.server
      .getResponseData({ betCents: this.wallet.getBetCents() })
      .then((response) => this.scheduleStop(response, startedAt))
      .catch(() => this.recover());
  }

  private scheduleStop(response: SpinResponseDTO, startedAt: number): void {
    const remaining = GAME_CONFIG.timing.minSpinMs - (performance.now() - startedAt);
    this.stopTimer = setTimeout(
      () => {
        this.machine.enter("stopping");
        this.reels.stop(response.grid, () => this.onReelsStopped(response));
      },
      Math.max(0, remaining),
    );
  }

  private onReelsStopped(response: SpinResponseDTO): void {
    this.wallet.setBalanceCents(response.balanceCents);
    this.controls.setBalance(this.wallet.getBalanceCents());

    if (response.totalWinCents <= 0) {
      this.machine.enter("idle");
      this.controls.setEnabled(true);
      return;
    }

    this.machine.enter("presenting");
    this.controls.countWin(response.totalWinCents);
    this.reels.presentWins(response.wins);
    if (response.totalWinCents >= GAME_CONFIG.bigWinMultiplier * this.wallet.getBetCents()) {
      this.celebration.celebrateBigWin(response.totalWinCents);
      this.audio.playBigWin();
    } else {
      this.audio.playWin();
    }
    this.presentTimer = setTimeout(() => {
      this.reels.clearWins();
      this.celebration.clear();
      this.machine.enter("idle");
      this.controls.setEnabled(true);
    }, GAME_CONFIG.timing.winPresentMs);
  }

  private recover(): void {
    this.clearTimers();
    this.wallet.setBalanceCents(this.server.getBalanceCents());
    this.controls.setBalance(this.wallet.getBalanceCents());
    this.machine.enter("stopping");
    this.reels.stop(initialGrid(), () => {
      this.machine.enter("idle");
      this.controls.setEnabled(true);
    });
  }

  private clearTimers(): void {
    if (this.stopTimer !== undefined) {
      clearTimeout(this.stopTimer);
      this.stopTimer = undefined;
    }
    if (this.presentTimer !== undefined) {
      clearTimeout(this.presentTimer);
      this.presentTimer = undefined;
    }
  }
}
