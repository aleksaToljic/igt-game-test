import { gsap } from "gsap";
import { Container } from "pixi.js";
import { GAME_CONFIG } from "../../config/gameConfig";
import type { SymbolId } from "../../config/symbols";
import { atWrapped } from "../../utils/arrays";
import { SymbolView } from "./SymbolView";

type ReelPhase = "idle" | "accelerating" | "spinning" | "stopping" | "done";

const BUFFER_ROWS = 1;
const STOP_EXTRA_ROTATIONS = GAME_CONFIG.rowCount + 1;
const BOUNCE_OFFSET = 14;

function easeOutCubic(progress: number): number {
  const remaining = 1 - progress;
  return 1 - remaining * remaining * remaining;
}

export class Reel extends Container {
  private readonly strip: readonly SymbolId[];
  private readonly cells: SymbolView[] = [];

  private phase: ReelPhase = "idle";
  private traveled = 0;
  private rotationsDone = 0;
  private velocity = 0;
  private accelElapsed = 0;
  private stripCursor = 0;

  private startTraveled = 0;
  private endTraveled = 0;
  private decelElapsed = 0;
  private stopFeed: SymbolId[] = [];
  private stopFeedCursor = 0;
  private targetColumn: readonly SymbolId[] = [];
  private onStopped: (() => void) | undefined;

  constructor(strip: readonly SymbolId[], initialColumn: readonly SymbolId[]) {
    super();
    this.strip = strip;
    const cellCount = GAME_CONFIG.rowCount + BUFFER_ROWS;
    for (let index = 0; index < cellCount; index += 1) {
      const cell = new SymbolView(0);
      this.cells.push(cell);
      this.addChild(cell);
    }
    this.seedInitialColumn(initialColumn);
    this.layoutCells();
  }

  visibleSymbol(row: number): SymbolView | undefined {
    return this.cells[BUFFER_ROWS + row];
  }

  visibleSymbols(): SymbolView[] {
    return this.cells.slice(BUFFER_ROWS, BUFFER_ROWS + GAME_CONFIG.rowCount);
  }

  startSpin(): void {
    if (this.phase !== "idle" && this.phase !== "done") {
      return;
    }
    gsap.killTweensOf(this);
    this.y = 0;
    this.velocity = 0;
    this.accelElapsed = 0;
    this.phase = "accelerating";
  }

  stopAt(targetColumn: readonly SymbolId[], onStopped: () => void): void {
    if (this.phase !== "spinning" && this.phase !== "accelerating") {
      onStopped();
      return;
    }
    const currentRotation = Math.floor(this.traveled / GAME_CONFIG.symbolSize);
    const rotations = 1 + STOP_EXTRA_ROTATIONS;
    this.targetColumn = targetColumn;
    this.startTraveled = this.traveled;
    this.endTraveled = (currentRotation + rotations) * GAME_CONFIG.symbolSize;
    this.decelElapsed = 0;
    this.stopFeed = this.buildStopFeed(targetColumn, rotations);
    this.stopFeedCursor = 0;
    this.onStopped = onStopped;
    this.phase = "stopping";
  }

  update(deltaMs: number): void {
    if (this.phase === "accelerating") {
      this.accelElapsed += deltaMs;
      const progress = Math.min(this.accelElapsed / GAME_CONFIG.timing.spinUpMs, 1);
      this.velocity = GAME_CONFIG.timing.spinSpeed * progress;
      this.traveled += this.velocity * deltaMs;
      if (progress >= 1) {
        this.phase = "spinning";
      }
    } else if (this.phase === "spinning") {
      this.traveled += GAME_CONFIG.timing.spinSpeed * deltaMs;
    } else if (this.phase === "stopping") {
      this.decelElapsed += deltaMs;
      const progress = Math.min(this.decelElapsed / GAME_CONFIG.timing.decelerateMs, 1);
      this.traveled =
        this.startTraveled + (this.endTraveled - this.startTraveled) * easeOutCubic(progress);
      if (progress >= 1) {
        this.finishStop();
        return;
      }
    } else {
      return;
    }
    this.syncRotations();
    this.layoutCells();
  }

  private finishStop(): void {
    this.traveled = this.endTraveled;
    this.syncRotations();
    this.applyTargetColumn();
    this.layoutCells();
    this.phase = "done";
    this.playBounce();
    const callback = this.onStopped;
    this.onStopped = undefined;
    callback?.();
  }

  private syncRotations(): void {
    const rotationsNeeded = Math.floor(this.traveled / GAME_CONFIG.symbolSize);
    while (this.rotationsDone < rotationsNeeded) {
      this.rotateDown();
      this.rotationsDone += 1;
    }
  }

  private rotateDown(): void {
    const cell = this.cells.pop();
    if (!cell) {
      return;
    }
    this.cells.unshift(cell);
    cell.setSymbol(this.nextSymbol());
  }

  private nextSymbol(): SymbolId {
    if (this.phase === "stopping" && this.stopFeedCursor < this.stopFeed.length) {
      const symbol = this.stopFeed[this.stopFeedCursor] ?? 0;
      this.stopFeedCursor += 1;
      return symbol;
    }
    const symbol = atWrapped(this.strip, this.stripCursor);
    this.stripCursor += 1;
    return symbol;
  }

  private buildStopFeed(targetColumn: readonly SymbolId[], rotations: number): SymbolId[] {
    const feed: SymbolId[] = [];
    for (let index = 0; index < rotations; index += 1) {
      feed.push(atWrapped(this.strip, this.stripCursor + index));
    }
    for (let row = 0; row < GAME_CONFIG.rowCount; row += 1) {
      const feedIndex = rotations - 2 - row;
      const symbol = targetColumn[row];
      if (feedIndex >= 0 && symbol !== undefined) {
        feed[feedIndex] = symbol;
      }
    }
    return feed;
  }

  private applyTargetColumn(): void {
    for (let row = 0; row < GAME_CONFIG.rowCount; row += 1) {
      const cell = this.cells[BUFFER_ROWS + row];
      const symbol = this.targetColumn[row];
      if (cell && symbol !== undefined) {
        cell.setSymbol(symbol);
      }
    }
  }

  private seedInitialColumn(initialColumn: readonly SymbolId[]): void {
    const bufferCell = this.cells[0];
    if (bufferCell) {
      bufferCell.setSymbol(atWrapped(this.strip, 0));
    }
    for (let row = 0; row < GAME_CONFIG.rowCount; row += 1) {
      const cell = this.cells[BUFFER_ROWS + row];
      const symbol = initialColumn[row];
      if (cell && symbol !== undefined) {
        cell.setSymbol(symbol);
      }
    }
  }

  private layoutCells(): void {
    const size = GAME_CONFIG.symbolSize;
    const offset = this.traveled - this.rotationsDone * size;
    for (let index = 0; index < this.cells.length; index += 1) {
      const cell = this.cells[index];
      if (cell) {
        cell.y = (index - BUFFER_ROWS) * size + offset;
      }
    }
  }

  private playBounce(): void {
    gsap.fromTo(
      this,
      { y: 0 },
      {
        y: BOUNCE_OFFSET,
        duration: GAME_CONFIG.timing.bounceMs / 2000,
        yoyo: true,
        repeat: 1,
        ease: "sine.out",
      },
    );
  }
}
