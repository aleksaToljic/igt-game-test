import { describe, expect, it } from "vitest";
import { Wallet } from "../src/core/Wallet";

describe("Wallet", () => {
  it("reports affordability against the balance", () => {
    const wallet = new Wallet(100, 100);
    expect(wallet.canAfford()).toBe(true);
    wallet.setBetCents(200);
    expect(wallet.canAfford()).toBe(false);
  });

  it("debits the current bet from the balance", () => {
    const wallet = new Wallet(500, 100);
    wallet.debitBet();
    expect(wallet.getBalanceCents()).toBe(400);
  });

  it("syncs the balance from an authoritative value", () => {
    const wallet = new Wallet(500, 100);
    wallet.setBalanceCents(1234);
    expect(wallet.getBalanceCents()).toBe(1234);
  });
});
