import { describe, expect, it } from "vitest";
import { GAME_CONFIG } from "../src/config/gameConfig";
import { PAYLINES } from "../src/config/paylines";
import { MockGameServer } from "../src/server/MockGameServer";

describe("MockGameServer", () => {
  it("exposes the configured starting balance", () => {
    const server = new MockGameServer({ seed: 1, latencyMs: 0, balanceCents: 5000 });
    expect(server.getBalanceCents()).toBe(5000);
  });

  it("returns a full reelCount x rowCount grid", async () => {
    const server = new MockGameServer({ seed: 1, latencyMs: 0 });
    const response = await server.getResponseData({ betCents: 100 });
    expect(response.grid).toHaveLength(GAME_CONFIG.reelCount);
    for (const column of response.grid) {
      expect(column).toHaveLength(GAME_CONFIG.rowCount);
    }
  });

  it("debits the bet and credits the win", async () => {
    const startBalance = 10_000;
    const bet = 100;
    const server = new MockGameServer({ seed: 5, latencyMs: 0, balanceCents: startBalance });
    const response = await server.getResponseData({ betCents: bet });
    expect(response.balanceCents).toBe(startBalance - bet + response.totalWinCents);
    expect(server.getBalanceCents()).toBe(response.balanceCents);
  });

  it("is deterministic for a fixed seed", async () => {
    const a = new MockGameServer({ seed: 99, latencyMs: 0 });
    const b = new MockGameServer({ seed: 99, latencyMs: 0 });
    const responseA = await a.getResponseData({ betCents: 100 });
    const responseB = await b.getResponseData({ betCents: 100 });
    expect(responseA.grid).toEqual(responseB.grid);
    expect(responseA.totalWinCents).toBe(responseB.totalWinCents);
  });

  it("rejects a bet larger than the balance", async () => {
    const server = new MockGameServer({ seed: 1, latencyMs: 0, balanceCents: 50 });
    await expect(server.getResponseData({ betCents: 100 })).rejects.toThrow();
  });

  it("rejects a bet that is not divisible across the paylines", async () => {
    const server = new MockGameServer({ seed: 1, latencyMs: 0, balanceCents: 10_000 });
    await expect(server.getResponseData({ betCents: 99 })).rejects.toThrow();
  });

  it("offers only bet levels divisible across the paylines", () => {
    for (const betLevelCents of GAME_CONFIG.betLevelsCents) {
      expect(betLevelCents % PAYLINES.length).toBe(0);
    }
  });
});
