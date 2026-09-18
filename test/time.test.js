import { describe, it, expect } from "vitest";
import { remainingSeconds, formatClock } from "../src/core/time.js";

describe("remainingSeconds", () => {
  it("returns the full duration at the start", () => {
    expect(remainingSeconds(1000, 30, 1000)).toBe(30);
  });

  it("decreases as time passes", () => {
    expect(remainingSeconds(1000, 30, 1000 + 10_000)).toBe(20);
  });

  it("never goes below zero", () => {
    expect(remainingSeconds(1000, 30, 1000 + 60_000)).toBe(0);
  });
});

describe("formatClock", () => {
  it("formats whole minutes and seconds", () => {
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(30)).toBe("0:30");
    expect(formatClock(0)).toBe("0:00");
  });

  it("rounds fractional seconds up", () => {
    expect(formatClock(29.1)).toBe("0:30");
    expect(formatClock(0.4)).toBe("0:01");
  });

  it("clamps negatives to zero", () => {
    expect(formatClock(-5)).toBe("0:00");
  });

  it("pads seconds under ten", () => {
    expect(formatClock(125)).toBe("2:05");
  });
});
