/**
 * Randomness helpers.
 *
 * All randomness in the core flows through an injectable `rng` -- a function
 * that returns a float in [0, 1), exactly like `Math.random`. Passing the RNG
 * in (rather than calling `Math.random` directly) is what makes passage
 * assembly deterministic and therefore testable: tests supply a seeded RNG and
 * assert on the exact output.
 *
 * @typedef {() => number} Rng
 */

/** The default source of randomness used by the running app. @type {Rng} */
export const defaultRng = Math.random;

/**
 * A tiny seeded pseudo-random generator (mulberry32). Not cryptographically
 * secure -- it exists purely so tests can produce repeatable sequences.
 *
 * @param {number} seed
 * @returns {Rng}
 */
export function createSeededRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Return a new array that is a shuffled copy of `input` (Fisher-Yates).
 * The input array is never mutated.
 *
 * @template T
 * @param {T[]} input
 * @param {Rng} [rng]
 * @returns {T[]}
 */
export function shuffle(input, rng = defaultRng) {
  const out = input.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}
