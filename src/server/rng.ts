export interface RandomSource {
  next(): number;
  int(maxExclusive: number): number;
}

export function createRandom(seed?: number): RandomSource {
  let state = (seed ?? Math.floor(Math.random() * 0xffffffff)) >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = state;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
  };

  return {
    next,
    int(maxExclusive: number): number {
      if (maxExclusive <= 0) {
        throw new RangeError("maxExclusive must be positive");
      }
      return Math.floor(next() * maxExclusive);
    },
  };
}
