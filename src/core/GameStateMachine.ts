export type GameState = "idle" | "spinning" | "stopping" | "presenting";

const TRANSITIONS: Readonly<Record<GameState, readonly GameState[]>> = {
  idle: ["spinning"],
  spinning: ["stopping"],
  stopping: ["presenting", "idle"],
  presenting: ["idle"],
};

export class GameStateMachine {
  private state: GameState = "idle";

  get current(): GameState {
    return this.state;
  }

  is(state: GameState): boolean {
    return this.state === state;
  }

  canEnter(next: GameState): boolean {
    return (TRANSITIONS[this.state] ?? []).includes(next);
  }

  enter(next: GameState): void {
    if (!this.canEnter(next)) {
      throw new Error(`Illegal transition ${this.state} -> ${next}`);
    }
    this.state = next;
  }
}
