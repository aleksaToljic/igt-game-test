import { GAME_CONFIG } from "../config/gameConfig";
import { PAYLINES } from "../config/paylines";
import type { SymbolId } from "../config/symbols";
import { atWrapped } from "../utils/arrays";
import type { IGameServer } from "./IGameServer";
import { evaluateSpin } from "./PaylineEvaluator";
import type { SpinRequestDTO, SpinResponseDTO } from "./dto";
import { type RandomSource, createRandom } from "./rng";

const DEFAULT_LATENCY_MS = 240;

export interface MockGameServerOptions {
  seed?: number;
  balanceCents?: number;
  latencyMs?: number;
}

export class MockGameServer implements IGameServer {
  private balanceCents: number;
  private readonly random: RandomSource;
  private readonly latencyMs: number;

  constructor(options: MockGameServerOptions = {}) {
    this.balanceCents = options.balanceCents ?? GAME_CONFIG.startingBalanceCents;
    this.random = createRandom(options.seed);
    this.latencyMs = options.latencyMs ?? DEFAULT_LATENCY_MS;
  }

  getBalanceCents(): number {
    return this.balanceCents;
  }

  async getResponseData(request: SpinRequestDTO): Promise<SpinResponseDTO> {
    await this.delay();

    const betCents = this.validateBet(request.betCents);
    this.balanceCents -= betCents;

    const grid = this.spinGrid();
    const betPerLineCents = betCents / PAYLINES.length;
    const { wins, totalWinCents } = evaluateSpin(grid, betPerLineCents);
    this.balanceCents += totalWinCents;

    return { grid, wins, totalWinCents, balanceCents: this.balanceCents };
  }

  private validateBet(betCents: number): number {
    if (!Number.isInteger(betCents) || betCents <= 0) {
      throw new Error(`Invalid bet amount: ${betCents}`);
    }
    if (betCents > this.balanceCents) {
      throw new Error("Insufficient balance for this bet");
    }
    if (betCents % PAYLINES.length !== 0) {
      throw new Error(`Bet ${betCents} is not divisible across ${PAYLINES.length} paylines`);
    }
    return betCents;
  }

  private spinGrid(): SymbolId[][] {
    const grid: SymbolId[][] = [];
    for (let reel = 0; reel < GAME_CONFIG.reelCount; reel += 1) {
      const strip = GAME_CONFIG.reelStrips[reel];
      if (!strip) {
        throw new RangeError(`Missing reel strip for reel ${reel}`);
      }
      const stop = this.random.int(strip.length);
      const column: SymbolId[] = [];
      for (let row = 0; row < GAME_CONFIG.rowCount; row += 1) {
        column.push(atWrapped(strip, stop + row));
      }
      grid.push(column);
    }
    return grid;
  }

  private delay(): Promise<void> {
    if (this.latencyMs <= 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => setTimeout(resolve, this.latencyMs));
  }
}
