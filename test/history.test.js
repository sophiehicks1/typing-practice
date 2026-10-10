import { describe, it, expect } from "vitest";
import {
  sanitizeHistory,
  addResult,
  smooth,
  niceMax,
  chartLayout,
  MAX_HISTORY,
} from "../src/core/history.js";

const entry = (wpm, at = 0) => ({ wpm, mode: "passage", duration: 30, at });

describe("sanitizeHistory", () => {
  it("returns [] for non-arrays", () => {
    expect(sanitizeHistory(null)).toEqual([]);
    expect(sanitizeHistory({ wpm: 3 })).toEqual([]);
    expect(sanitizeHistory("nope")).toEqual([]);
  });

  it("drops malformed entries and keeps valid ones", () => {
    const good = entry(40);
    const raw = [good, null, { wpm: "fast" }, { ...good, wpm: -1 }, { wpm: 10 }];
    expect(sanitizeHistory(raw)).toEqual([good]);
  });

  it("keeps at most MAX_HISTORY of the newest entries", () => {
    const raw = Array.from({ length: MAX_HISTORY + 5 }, (_, i) => entry(i));
    const clean = sanitizeHistory(raw);
    expect(clean).toHaveLength(MAX_HISTORY);
    expect(clean[0].wpm).toBe(5);
  });
});

describe("addResult", () => {
  it("appends without mutating the input", () => {
    const history = [entry(10)];
    const next = addResult(history, entry(20));
    expect(next.map((e) => e.wpm)).toEqual([10, 20]);
    expect(history).toHaveLength(1);
  });

  it("drops the oldest entries past the limit", () => {
    const next = addResult([entry(1), entry(2), entry(3)], entry(4), 3);
    expect(next.map((e) => e.wpm)).toEqual([2, 3, 4]);
  });
});

describe("smooth", () => {
  it("returns [] for no values", () => {
    expect(smooth([])).toEqual([]);
  });

  it("starts at the first value and moves alpha of the way each step", () => {
    expect(smooth([10, 20, 20], 0.5)).toEqual([10, 15, 17.5]);
  });

  it("is a flat line for constant input", () => {
    expect(smooth([30, 30, 30, 30])).toEqual([30, 30, 30, 30]);
  });

  it("with alpha 1 reproduces the input", () => {
    expect(smooth([5, 50, 12], 1)).toEqual([5, 50, 12]);
  });
});

describe("niceMax", () => {
  it("rounds up to a multiple of 10 with headroom", () => {
    expect(niceMax(45)).toBe(50);
    expect(niceMax(50)).toBe(60);
    expect(niceMax(87)).toBe(100);
  });

  it("never goes below 10", () => {
    expect(niceMax(0)).toBe(10);
    expect(niceMax(3)).toBe(10);
  });
});

describe("chartLayout", () => {
  const box = { width: 300, height: 140, pad: { top: 10, right: 10, bottom: 20, left: 30 } };

  it("spans the plot area left to right in run order", () => {
    const { raw } = chartLayout([20, 30, 40], box);
    expect(raw[0].x).toBe(30);
    expect(raw[2].x).toBe(290);
    expect(raw[1].x).toBe(160);
  });

  it("maps 0 WPM to the bottom and yMax to the top", () => {
    const { ticks, yMax } = chartLayout([20, 45], box);
    expect(yMax).toBe(50);
    expect(ticks).toEqual([
      { y: 120, value: 0 },
      { y: 65, value: 25 },
      { y: 10, value: 50 },
    ]);
  });

  it("pairs each raw point with a smoothed point at the same x", () => {
    const { raw, smoothed } = chartLayout([10, 20, 20], box, 0.5);
    expect(smoothed.map((p) => p.x)).toEqual(raw.map((p) => p.x));
    expect(smoothed.map((p) => p.value)).toEqual([10, 15, 17.5]);
    expect(raw.map((p) => p.value)).toEqual([10, 20, 20]);
  });

  it("centers a single point horizontally", () => {
    const { raw } = chartLayout([25], box);
    expect(raw[0].x).toBe(160);
  });

  it("handles an empty series", () => {
    const layout = chartLayout([], box);
    expect(layout.raw).toEqual([]);
    expect(layout.smoothed).toEqual([]);
    expect(layout.yMax).toBe(10);
  });
});
