import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SymbolId } from "../src/config/symbols";
import { Game, type GameControls, type ReelsController } from "../src/core/Game";
import type { IGameServer } from "../src/server/IGameServer";
import type { SpinRequestDTO, SpinResponseDTO } from "../src/server/dto";

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

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

class FakeReels implements ReelsController {
  startCount = 0;
  stopGrid: readonly (readonly SymbolId[])[] | undefined;

  startSpin(): void {
    this.startCount += 1;
  }

  stop(grid: readonly (readonly SymbolId[])[], onAllStopped: () => void): void {
    this.stopGrid = grid;
    onAllStopped();
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

function makeResponse(totalWinCents: number, balanceCents: number): SpinResponseDTO {
  return { grid: [[0, 0, 0]], wins: [], totalWinCents, balanceCents };
}

describe("Game", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("settles a winning spin: debits, then syncs balance and shows the win", async () => {
    const server = new FakeServer(10_000, makeResponse(500, 10_400));
    const reels = new FakeReels();
    const controls = new FakeControls();
    const game = new Game(server, reels, controls);
    game.start();

    game.spin();
    expect(reels.startCount).toBe(1);
    expect(controls.enabled).toBe(false);
    expect(controls.balanceCents).toBe(10_000 - DEFAULT_BET);

    await vi.runAllTimersAsync();
    expect(controls.balanceCents).toBe(10_400);
    expect(controls.winCents).toBe(500);
    expect(controls.enabled).toBe(true);
  });

  it("settles a losing spin: win is zero and controls re-enable", async () => {
    const server = new FakeServer(10_000, makeResponse(0, 9_900));
    const reels = new FakeReels();
    const controls = new FakeControls();
    const game = new Game(server, reels, controls);
    game.start();

    game.spin();
    await vi.runAllTimersAsync();
    expect(controls.winCents).toBe(0);
    expect(controls.balanceCents).toBe(9_900);
    expect(controls.enabled).toBe(true);
  });

  it("recovers from a server error: refunds the balance and re-enables", async () => {
    const server = new FakeServer(10_000, makeResponse(0, 0), true);
    const reels = new FakeReels();
    const controls = new FakeControls();
    const game = new Game(server, reels, controls);
    game.start();

    game.spin();
    await vi.runAllTimersAsync();
    expect(controls.balanceCents).toBe(10_000);
    expect(controls.enabled).toBe(true);
    expect(reels.stopGrid).toBeDefined();
  });

  it("ignores a second spin until the first returns to idle", async () => {
    const server = new FakeServer(10_000, makeResponse(0, 9_900));
    const reels = new FakeReels();
    const controls = new FakeControls();
    const game = new Game(server, reels, controls);
    game.start();

    game.spin();
    game.spin();
    expect(server.requests).toBe(1);
    expect(reels.startCount).toBe(1);
    await vi.runAllTimersAsync();
  });

  it("does not spin when the bet exceeds the balance", () => {
    const server = new FakeServer(50, makeResponse(0, 50));
    const reels = new FakeReels();
    const controls = new FakeControls();
    const game = new Game(server, reels, controls);
    game.start();

    game.spin();
    expect(reels.startCount).toBe(0);
    expect(server.requests).toBe(0);
  });
});
