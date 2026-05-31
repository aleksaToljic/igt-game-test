import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SymbolId } from "../src/config/symbols";
import {
  Game,
  type GameControls,
  type ReelsController,
  type WinCelebration,
} from "../src/core/Game";
import type { IGameServer } from "../src/server/IGameServer";
import type { SpinRequestDTO, SpinResponseDTO, WinLineDTO } from "../src/server/dto";

const DEFAULT_BET = 100;

class FakeControls implements GameControls {
  balanceCents = -1;
  winCents = -1;
  enabled = true;

  setBalance(cents: number): void {
    this.balanceCents = cents;
  }

  setWin(cents: number): void {
    this.winCents = cents;
  }

  countWin(cents: number): void {
    this.winCents = cents;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

class FakeReels implements ReelsController {
  startCount = 0;
  stopGrid: readonly (readonly SymbolId[])[] | undefined;
  presentedWins: readonly WinLineDTO[] | undefined;
  cleared = false;

  startSpin(): void {
    this.startCount += 1;
  }

  stop(grid: readonly (readonly SymbolId[])[], onAllStopped: () => void): void {
    this.stopGrid = grid;
    onAllStopped();
  }

  presentWins(wins: readonly WinLineDTO[]): void {
    this.presentedWins = wins;
  }

  clearWins(): void {
    this.cleared = true;
  }
}

class FakeCelebration implements WinCelebration {
  bigWinCents: number | undefined;
  cleared = false;

  celebrateBigWin(amountCents: number): void {
    this.bigWinCents = amountCents;
  }

  clear(): void {
    this.cleared = true;
  }
}

class FakeServer implements IGameServer {
  requests = 0;

  constructor(
    private balance: number,
    private readonly response: SpinResponseDTO,
    private readonly reject = false,
  ) {}

  getBalanceCents(): number {
    return this.balance;
  }

  getResponseData(_request: SpinRequestDTO): Promise<SpinResponseDTO> {
    this.requests += 1;
    if (this.reject) {
      return Promise.reject(new Error("server rejected"));
    }
    this.balance = this.response.balanceCents;
    return Promise.resolve(this.response);
  }
}

function lineWin(amountCents: number): WinLineDTO {
  return {
    lineIndex: 0,
    symbol: 0,
    matchCount: 3,
    positions: [
      { reel: 0, row: 1 },
      { reel: 1, row: 1 },
      { reel: 2, row: 1 },
    ],
    amountCents,
  };
}

function response(totalWinCents: number, balanceCents: number): SpinResponseDTO {
  const wins = totalWinCents > 0 ? [lineWin(totalWinCents)] : [];
  return { grid: [[0, 0, 0]], wins, totalWinCents, balanceCents };
}

function setup(server: IGameServer) {
  const reels = new FakeReels();
  const controls = new FakeControls();
  const celebration = new FakeCelebration();
  const game = new Game(server, reels, controls, celebration);
  game.start();
  return { game, reels, controls, celebration };
}

describe("Game", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("settles a big winning spin: counts up, presents, celebrates and clears", async () => {
    const { game, reels, controls, celebration } = setup(
      new FakeServer(10_000, response(500, 10_400)),
    );

    game.spin();
    expect(reels.startCount).toBe(1);
    expect(controls.enabled).toBe(false);
    expect(controls.balanceCents).toBe(10_000 - DEFAULT_BET);

    await vi.runAllTimersAsync();
    expect(controls.balanceCents).toBe(10_400);
    expect(controls.winCents).toBe(500);
    expect(reels.presentedWins?.length).toBe(1);
    expect(celebration.bigWinCents).toBe(500);
    expect(reels.cleared).toBe(true);
    expect(celebration.cleared).toBe(true);
    expect(controls.enabled).toBe(true);
  });

  it("presents a small win without a big-win celebration", async () => {
    const { game, reels, controls, celebration } = setup(
      new FakeServer(10_000, response(100, 10_000)),
    );

    game.spin();
    await vi.runAllTimersAsync();
    expect(controls.winCents).toBe(100);
    expect(reels.presentedWins?.length).toBe(1);
    expect(celebration.bigWinCents).toBeUndefined();
    expect(controls.enabled).toBe(true);
  });

  it("settles a losing spin: no win, no celebration, controls re-enable", async () => {
    const { game, reels, controls, celebration } = setup(
      new FakeServer(10_000, response(0, 9_900)),
    );

    game.spin();
    await vi.runAllTimersAsync();
    expect(controls.winCents).toBe(0);
    expect(controls.balanceCents).toBe(9_900);
    expect(reels.presentedWins).toBeUndefined();
    expect(celebration.bigWinCents).toBeUndefined();
    expect(controls.enabled).toBe(true);
  });

  it("recovers from a server error: refunds the balance and re-enables", async () => {
    const { game, reels, controls } = setup(new FakeServer(10_000, response(0, 0), true));

    game.spin();
    await vi.runAllTimersAsync();
    expect(controls.balanceCents).toBe(10_000);
    expect(controls.enabled).toBe(true);
    expect(reels.stopGrid).toBeDefined();
  });

  it("ignores a second spin until the first returns to idle", async () => {
    const server = new FakeServer(10_000, response(0, 9_900));
    const { game, reels } = setup(server);

    game.spin();
    game.spin();
    expect(server.requests).toBe(1);
    expect(reels.startCount).toBe(1);
    await vi.runAllTimersAsync();
  });

  it("does not spin when the bet exceeds the balance", () => {
    const server = new FakeServer(50, response(0, 50));
    const { game, reels } = setup(server);

    game.spin();
    expect(reels.startCount).toBe(0);
    expect(server.requests).toBe(0);
  });
});
