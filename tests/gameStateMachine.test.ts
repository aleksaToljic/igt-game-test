import { describe, expect, it } from "vitest";
import { GameStateMachine } from "../src/core/GameStateMachine";

describe("GameStateMachine", () => {
  it("runs the full spin cycle", () => {
    const machine = new GameStateMachine();
    expect(machine.is("idle")).toBe(true);
    machine.enter("spinning");
    machine.enter("stopping");
    machine.enter("presenting");
    machine.enter("idle");
    expect(machine.is("idle")).toBe(true);
  });

  it("rejects an illegal transition", () => {
    const machine = new GameStateMachine();
    expect(() => machine.enter("presenting")).toThrow();
  });

  it("blocks a second spin until the cycle returns to idle", () => {
    const machine = new GameStateMachine();
    machine.enter("spinning");
    expect(machine.canEnter("spinning")).toBe(false);
  });
});
