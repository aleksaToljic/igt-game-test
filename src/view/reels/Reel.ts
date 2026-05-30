import { Container } from "pixi.js";
import { GAME_CONFIG } from "../../config/gameConfig";
import type { SymbolId } from "../../config/symbols";
import { SymbolView } from "./SymbolView";

export class Reel extends Container {
  private readonly cells: SymbolView[] = [];

  constructor(initialColumn: readonly SymbolId[]) {
    super();
    for (let row = 0; row < GAME_CONFIG.rowCount; row += 1) {
      const cell = new SymbolView(initialColumn[row] ?? 0);
      cell.y = row * GAME_CONFIG.symbolSize;
      this.cells.push(cell);
      this.addChild(cell);
    }
  }

  setColumn(column: readonly SymbolId[]): void {
    for (let row = 0; row < this.cells.length; row += 1) {
      const cell = this.cells[row];
      const symbolId = column[row];
      if (cell && symbolId !== undefined) {
        cell.setSymbol(symbolId);
      }
    }
  }
}
