import { describe, expect, it } from "vitest";
import { createRandom } from "../src/server/rng";

describe("createRandom", () => {
  it("is deterministic for a given seed", () => {
    const first = createRandom(42);
    const second = createRandom(42);
    const firstValues = [first.next(), first.next(), first.next()];
    const secondValues = [second.next(), second.next(), second.next()];
    expect(firstValues).toEqual(secondValues);
  });

  it("produces different sequences for different seeds", () => {
    const a = createRandom(1);
    const b = createRandom(2);
    expect(a.next()).not.toEqual(b.next());
  });

  it("returns next() within [0, 1)", () => {
    const random = createRandom(7);
    for (let iteration = 0; iteration < 1000; iteration += 1) {
      const value = random.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("returns int() within [0, maxExclusive)", () => {
    const random = createRandom(7);
    for (let iteration = 0; iteration < 1000; iteration += 1) {
      const value = random.int(5);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(5);
    }
  });

  it("throws for a non-positive bound", () => {
    const random = createRandom(7);
    expect(() => random.int(0)).toThrow();
  });
});
