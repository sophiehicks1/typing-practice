import { describe, it, expect } from "vitest";
import { createSeededRng, shuffle } from "../src/core/random.js";

describe("createSeededRng", () => {
  it("produces values in [0, 1)", () => {
    const rng = createSeededRng(1);
    for (let i = 0; i < 100; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = createSeededRng(42);
    const b = createSeededRng(42);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = createSeededRng(1);
    const b = createSeededRng(2);
    expect(a()).not.toEqual(b());
  });
});

describe("shuffle", () => {
  it("does not mutate the input array", () => {
    const input = [1, 2, 3, 4, 5];
    const copy = input.slice();
    shuffle(input, createSeededRng(7));
    expect(input).toEqual(copy);
  });

  it("returns a permutation of the input", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const result = shuffle(input, createSeededRng(3));
    expect(result.slice().sort((a, b) => a - b)).toEqual(input);
  });

  it("is deterministic with a seeded rng", () => {
    const input = [1, 2, 3, 4, 5];
    const first = shuffle(input, createSeededRng(99));
    const second = shuffle(input, createSeededRng(99));
    expect(first).toEqual(second);
  });
});
