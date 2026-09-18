import { describe, it, expect } from "vitest";
import { createSession, CharState } from "../src/core/engine.js";

describe("createSession", () => {
  it("requires a non-empty target", () => {
    expect(() => createSession("")).toThrow();
    expect(() => createSession(null)).toThrow();
  });

  it("starts empty and incomplete", () => {
    const s = createSession("hello");
    expect(s.typed).toBe("");
    expect(s.errors).toBe(0);
    expect(s.isComplete()).toBe(false);
  });
});

describe("setTyped", () => {
  it("accepts correct input", () => {
    const s = createSession("hello");
    s.setTyped("hel");
    expect(s.typed).toBe("hel");
    expect(s.errors).toBe(0);
  });

  it("clamps input to the target length", () => {
    const s = createSession("hi");
    const accepted = s.setTyped("hiya");
    expect(accepted).toBe("hi");
    expect(s.typed).toBe("hi");
  });

  it("completes when the full target is typed", () => {
    const s = createSession("hi");
    s.setTyped("hi");
    expect(s.isComplete()).toBe(true);
  });
});

describe("error counting", () => {
  it("counts each new wrong character once as the text grows", () => {
    const s = createSession("hello");
    s.setTyped("h");
    s.setTyped("hX"); // one mistake at index 1
    expect(s.errors).toBe(1);
    s.setTyped("hXY"); // another mistake at index 2
    expect(s.errors).toBe(2);
  });

  it("does not re-count on backspace alone", () => {
    const s = createSession("hello");
    s.setTyped("hXl"); // mistake at index 1
    expect(s.errors).toBe(1);
    s.setTyped("hX"); // backspace, no new chars
    expect(s.errors).toBe(1);
  });

  it("counts a corrected mistake again when retyped (matches original game)", () => {
    const s = createSession("hello");
    s.setTyped("hX"); // mistake -> 1
    s.setTyped("h"); // backspace
    s.setTyped("he"); // correct retype, no new error
    expect(s.errors).toBe(1);

    const s2 = createSession("hello");
    s2.setTyped("hX"); // mistake -> 1
    s2.setTyped("h"); // backspace
    s2.setTyped("hY"); // wrong again -> 2
    expect(s2.errors).toBe(2);
  });
});

describe("character states", () => {
  it("reports correct, incorrect, current and pending", () => {
    const s = createSession("cat");
    s.setTyped("cX");
    expect(s.charStateAt(0)).toBe(CharState.CORRECT);
    expect(s.charStateAt(1)).toBe(CharState.INCORRECT);
    expect(s.charStateAt(2)).toBe(CharState.CURRENT);
  });

  it("marks the caret at the typed length", () => {
    const s = createSession("cat");
    s.setTyped("ca");
    expect(s.charStateAt(2)).toBe(CharState.CURRENT);
  });

  it("charStates returns one entry per target character", () => {
    const s = createSession("cat");
    expect(s.charStates()).toHaveLength(3);
  });
});

describe("stats", () => {
  it("reflects typed content and errors", () => {
    const s = createSession("hello world");
    s.setTyped("hello");
    const stats = s.stats(60);
    expect(stats.correctChars).toBe(5);
    expect(stats.typedChars).toBe(5);
    expect(stats.accuracy).toBe(100);
  });
});
