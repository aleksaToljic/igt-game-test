import { SYMBOL, type SymbolId } from "./symbols";

export interface SpinTiming {
  spinUpMs: number;
  minSpinMs: number;
  reelStopStaggerMs: number;
  decelerateMs: number;
  bounceMs: number;
  spinSpeed: number;
}

export interface GameConfig {
  reelCount: number;
  rowCount: number;
  symbolSize: number;
  reelGap: number;
  startingBalanceCents: number;
  betLevelsCents: readonly number[];
  defaultBetIndex: number;
  reelStrips: readonly (readonly SymbolId[])[];
  timing: SpinTiming;
}

const S = SYMBOL;

const reelStrips: readonly (readonly SymbolId[])[] = [
  [
    S.ten,
    S.gem,
    S.jack,
    S.king,
    S.ace,
    S.queen,
    S.ten,
    S.seven,
    S.jack,
    S.king,
    S.wild,
    S.queen,
    S.ten,
    S.ace,
    S.crown,
    S.jack,
    S.king,
    S.queen,
    S.ten,
    S.gem,
    S.ace,
    S.jack,
  ],
  [
    S.jack,
    S.king,
    S.ten,
    S.ace,
    S.queen,
    S.gem,
    S.jack,
    S.ten,
    S.crown,
    S.king,
    S.queen,
    S.ace,
    S.jack,
    S.ten,
    S.wild,
    S.king,
    S.gem,
    S.queen,
    S.ten,
    S.ace,
    S.seven,
    S.jack,
  ],
  [
    S.queen,
    S.ten,
    S.king,
    S.jack,
    S.ace,
    S.ten,
    S.gem,
    S.queen,
    S.jack,
    S.seven,
    S.king,
    S.ten,
    S.ace,
    S.crown,
    S.jack,
    S.queen,
    S.king,
    S.wild,
    S.ten,
    S.ace,
    S.jack,
    S.gem,
  ],
  [
    S.king,
    S.ace,
    S.ten,
    S.queen,
    S.jack,
    S.king,
    S.ten,
    S.gem,
    S.ace,
    S.queen,
    S.crown,
    S.jack,
    S.king,
    S.ten,
    S.seven,
    S.ace,
    S.queen,
    S.jack,
    S.wild,
    S.king,
    S.ten,
    S.gem,
  ],
  [
    S.ace,
    S.jack,
    S.queen,
    S.ten,
    S.king,
    S.ace,
    S.gem,
    S.jack,
    S.ten,
    S.queen,
    S.king,
    S.seven,
    S.ace,
    S.jack,
    S.crown,
    S.ten,
    S.queen,
    S.king,
    S.ace,
    S.wild,
    S.jack,
    S.ten,
  ],
];

export const GAME_CONFIG: GameConfig = {
  reelCount: 5,
  rowCount: 3,
  symbolSize: 150,
  reelGap: 12,
  startingBalanceCents: 100_000,
  betLevelsCents: [20, 40, 100, 200, 400, 1000, 2000],
  defaultBetIndex: 2,
  reelStrips,
  timing: {
    spinUpMs: 220,
    minSpinMs: 520,
    reelStopStaggerMs: 180,
    decelerateMs: 600,
    bounceMs: 180,
    spinSpeed: 3.2,
  },
};
