import { GAME_CONFIG, initialGrid } from "../config/gameConfig";
import type { SymbolId } from "../config/symbols";
import type { IGameServer } from "../server/IGameServer";
import type { SpinResponseDTO } from "../server/dto";
import { GameStateMachine } from "./GameStateMachine";
import { Wallet } from "./Wallet";

export interface ReelsController {
  startSpin(): void;
  stop(grid: readonly (readonly SymbolId[])[], onAllStopped: () => void): void;
}

export interface GameControls {
  setBalance(cents: number): void;
  setWin(cents: number): void;
  setEnabled(enabled: boolean): void;
}

export class Game {
  private readonly server: IGameServer;
  private readonly reels: ReelsController;
  private readonly controls: GameControls;
  private readonly wallet: Wallet;
  private readonly machine = new GameStateMachine();
  private stopTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(server: IGameServer, reels: ReelsController, controls: GameControls) {
    this.server = server;
    this.reels = reels;
    this.controls = controls;
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
    this.machine.enter("spinning");
    this.wallet.debitBet();
    this.controls.setBalance(this.wallet.getBalanceCents());
    this.controls.setWin(0);
    this.controls.setEnabled(false);
    this.reels.startSpin();

    const startedAt = performance.now();
    this.server
      .getResponseData({ betCents: this.wallet.getBetCents() })
      .then((response) => this.scheduleStop(response, startedAt))
      .catch(() => this.recover());
  }

  private scheduleStop(response: SpinResponseDTO, startedAt: number): void {
    const remaining = GAME_CONFIG.timing.minSpinMs - (performance.now() - startedAt);
    this.clearStopTimer();
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
    this.controls.setWin(response.totalWinCents);
    if (response.totalWinCents > 0) {
      this.machine.enter("presenting");
    }
    this.machine.enter("idle");
    this.controls.setEnabled(true);
  }

  private recover(): void {
    this.clearStopTimer();
    this.wallet.setBalanceCents(this.server.getBalanceCents());
    this.controls.setBalance(this.wallet.getBalanceCents());
    this.machine.enter("stopping");
    this.reels.stop(initialGrid(), () => {
      this.machine.enter("idle");
      this.controls.setEnabled(true);
    });
  }

  private clearStopTimer(): void {
    if (this.stopTimer !== undefined) {
      clearTimeout(this.stopTimer);
      this.stopTimer = undefined;
    }
  }
}
