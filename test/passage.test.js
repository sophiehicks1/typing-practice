import { describe, it, expect } from "vitest";
import { buildFromTopic, buildMixed, pickPassage, RANDOM_TOPIC_ID } from "../src/core/passage.js";
import { createSeededRng } from "../src/core/random.js";

function makeTopic(id, count) {
  const sentences = [];
  for (let i = 0; i < count; i++) {
    sentences.push(`${id} sentence number ${i} padded out to a decent length.`);
  }
  return { id, name: id, description: "test topic", sentences };
}

const topicA = makeTopic("alpha", 12);
const topicB = makeTopic("bravo", 12);
const topicC = makeTopic("charlie", 12);
const topics = [topicA, topicB, topicC];

describe("buildFromTopic", () => {
  it("reaches at least the requested minimum length", () => {
    const passage = buildFromTopic(topicA, { minLength: 2000, rng: createSeededRng(1) });
    expect(passage.length).toBeGreaterThanOrEqual(2000);
  });

  it("only uses sentences from the given topic", () => {
    const passage = buildFromTopic(topicA, { minLength: 500, rng: createSeededRng(2) });
    expect(passage).not.toContain("bravo");
    expect(passage).toContain("alpha");
  });

  it("never places the same sentence back to back", () => {
    // A tiny pool forces the loop to wrap many times.
    const tiny = makeTopic("tiny", 10);
    const passage = buildFromTopic(tiny, { minLength: 3000, rng: createSeededRng(5) });
    const parts = passage.split(". ");
    for (let i = 1; i < parts.length; i++) {
      expect(parts[i]).not.toBe(parts[i - 1]);
    }
  });

  it("is deterministic for a fixed seed", () => {
    const a = buildFromTopic(topicA, { minLength: 800, rng: createSeededRng(9) });
    const b = buildFromTopic(topicA, { minLength: 800, rng: createSeededRng(9) });
    expect(a).toBe(b);
  });
});

describe("buildMixed", () => {
  it("returns a passage and the id of the opening topic", () => {
    const { passage, firstId } = buildMixed(topics, { minLength: 800, rng: createSeededRng(3) });
    expect(passage.length).toBeGreaterThanOrEqual(800);
    expect(topics.map((t) => t.id)).toContain(firstId);
  });

  it("avoids opening with the excluded topic id", () => {
    // Try many seeds; none should ever open with the avoided topic.
    for (let seed = 0; seed < 25; seed++) {
      const { firstId } = buildMixed(topics, {
        minLength: 400,
        rng: createSeededRng(seed),
        avoidFirstId: "alpha",
      });
      expect(firstId).not.toBe("alpha");
    }
  });

  it("handles an empty topic list", () => {
    expect(buildMixed([], { rng: createSeededRng(1) })).toEqual({ passage: "", firstId: null });
  });
});

describe("pickPassage", () => {
  it("mixes topics when the id is 'random'", () => {
    const { firstId } = pickPassage({
      topics,
      topicId: RANDOM_TOPIC_ID,
      minLength: 400,
      rng: createSeededRng(4),
    });
    expect(topics.map((t) => t.id)).toContain(firstId);
  });

  it("draws from a single topic when given a real id", () => {
    const { passage, firstId } = pickPassage({
      topics,
      topicId: "bravo",
      minLength: 400,
      rng: createSeededRng(4),
    });
    expect(firstId).toBe("bravo");
    expect(passage).toContain("bravo");
    expect(passage).not.toContain("alpha");
  });

  it("throws for an unknown topic id", () => {
    expect(() => pickPassage({ topics, topicId: "nope" })).toThrow(/Unknown topic id/);
  });
});
