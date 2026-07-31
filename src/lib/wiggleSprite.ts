// Deterministic per-seed "personality" for wiggle sprites outside the hero
// (whose sprites are hand-tuned directly in Hero.astro). Spreads kick/
// friction/max/bob timing across the same ranges the hero's sprites already
// use, so a new sprite reads as its own character instead of a flat,
// synchronized block — without anyone having to hand-pick numbers per
// instance. Same seed always yields the same variant.
export type WiggleAxis = 'both' | 'vertical';

export type BobClass = 'bob-a' | 'bob-b' | 'bob-c' | 'bob-d' | 'bob-e' | 'bob-v1' | 'bob-v2';

export interface WiggleVariant {
  bobClass: BobClass;
  axis: WiggleAxis;
  kick: number;
  friction: number;
  max: number;
  bobDur: number;
  bobDelay: number;
}

const BOB_CLASSES_BOTH = ['bob-a', 'bob-b', 'bob-c', 'bob-d', 'bob-e'] as const;
const BOB_CLASSES_VERTICAL = ['bob-v1', 'bob-v2'] as const;

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(h, 31) + seed.charCodeAt(i)) >>> 0;
  }
  return h;
}

// axis: 'vertical' picks from the bob-v* idle-drift keyframes (Y-only) and
// flags that the caller should also set --magnet-axis-x:0, so the cursor
// magnet doesn't pull the sprite sideways either — see the "WIGGLE SPRITES"
// section of global.css.
export function wiggleVariant(seed: string, axis: WiggleAxis = 'both'): WiggleVariant {
  const h = hashSeed(seed);
  const bobClasses = axis === 'vertical' ? BOB_CLASSES_VERTICAL : BOB_CLASSES_BOTH;
  return {
    bobClass: bobClasses[h % bobClasses.length],
    axis,
    kick: 0.16 + ((h >>> 3) % 45) / 100, // 0.16–0.60, matches hero's sprite range
    friction: 0.73 + ((h >>> 7) % 21) / 100, // 0.73–0.93
    max: 14 + ((h >>> 11) % 17), // 14–30
    bobDur: 4.6 + ((h >>> 15) % 36) / 10, // 4.6s–8.1s
    bobDelay: -(((h >>> 19) % 41) / 10), // 0 to -4.0s
  };
}
