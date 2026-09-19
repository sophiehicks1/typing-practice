import { describe, it, expect } from "vitest";
import {
  countCorrect,
  countWords,
  computeWpm,
  computeAccuracy,
  computeStats,
  CHARS_PER_WORD,
} from "../src/core/stats.js";

describe("countCorrect", () => {
  it("counts matching leading characters", () => {
    expect(countCorrect("hello", "hello world")).toBe(5);
  });

  it("stops counting at the first divergence position but checks each index", () => {
    // Position-by-position: 'h','e' match, 'X' != 'l', 'l' == 'l', 'o' == 'o'
    expect(countCorrect("heXlo", "hello")).toBe(4);
  });

  it("handles typed longer than target", () => {
    expect(countCorrect("hello!!!", "hello")).toBe(5);
  });

  it("returns 0 for empty typed", () => {
    expect(countCorrect("", "hello")).toBe(0);
  });
});

describe("countWords", () => {
  it("counts whitespace-separated words", () => {
    expect(countWords("the quick brown fox")).toBe(4);
  });

  it("is 0 for empty or whitespace-only input", () => {
    expect(countWords("")).toBe(0);
    expect(countWords("   ")).toBe(0);
  });

  it("collapses runs of whitespace and ignores leading/trailing space", () => {
    expect(countWords("  hello   world  ")).toBe(2);
  });
});

describe("computeWpm", () => {
  it("uses the 5-characters-per-word convention", () => {
    // 25 correct chars = 5 words; in 60s that is 5 WPM.
    expect(computeWpm(25, 60)).toBe(5);
  });

  it("scales with time", () => {
    // 25 correct chars (5 words) in 30s -> 10 WPM.
    expect(computeWpm(25, 30)).toBe(10);
  });

  it("floors elapsed time at one second to avoid huge early numbers", () => {
    // 5 chars in 0.1s would be enormous; treated as if 1s elapsed.
    expect(computeWpm(CHARS_PER_WORD, 0.1)).toBe(computeWpm(CHARS_PER_WORD, 1));
  });

  it("is zero when nothing correct", () => {
    expect(computeWpm(0, 30)).toBe(0);
  });
});

describe("computeAccuracy", () => {
  it("is 100 when nothing typed", () => {
    expect(computeAccuracy(0, 0)).toBe(100);
  });

  it("is a rounded percentage", () => {
    expect(computeAccuracy(9, 10)).toBe(90);
    expect(computeAccuracy(2, 3)).toBe(67);
  });

  it("is 100 for a perfect run", () => {
    expect(computeAccuracy(40, 40)).toBe(100);
  });
});

describe("computeStats", () => {
  it("bundles the derived numbers together", () => {
    const stats = computeStats({
      typed: "hello world",
      target: "hello there",
      elapsedSeconds: 60,
      errors: 3,
    });
    // "hello " matches (6), then "world" vs "there": none match.
    expect(stats.correctChars).toBe(6);
    expect(stats.typedChars).toBe(11);
    expect(stats.errors).toBe(3);
    expect(stats.accuracy).toBe(Math.round((6 / 11) * 100));
    expect(stats.wpm).toBe(computeWpm(6, 60));
  });

  it("defaults errors to 0", () => {
    const stats = computeStats({ typed: "ab", target: "ab", elapsedSeconds: 10 });
    expect(stats.errors).toBe(0);
  });
});
