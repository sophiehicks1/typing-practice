import { describe, it, expect } from "vitest";
import {
  validateTopic,
  validateTopics,
  MIN_SENTENCES,
  MIN_SENTENCE_LENGTH,
} from "../src/content/schema.js";

function validSentences(count = MIN_SENTENCES) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(`This is valid sentence number ${i} with enough length here.`);
  }
  return out;
}

function validTopic(overrides = {}) {
  return {
    id: "sample-topic",
    name: "Sample topic",
    description: "A perfectly fine sample topic.",
    sentences: validSentences(),
    ...overrides,
  };
}

describe("validateTopic", () => {
  it("accepts a well-formed topic", () => {
    expect(validateTopic(validTopic())).toEqual([]);
  });

  it("rejects a non-object", () => {
    expect(validateTopic(null).length).toBeGreaterThan(0);
    expect(validateTopic("nope").length).toBeGreaterThan(0);
  });

  it("rejects a non-kebab-case id", () => {
    expect(validateTopic(validTopic({ id: "Not Kebab" }))).toContainEqual(
      expect.stringContaining("kebab-case"),
    );
  });

  it("rejects too few sentences", () => {
    const errors = validateTopic(validTopic({ sentences: validSentences(MIN_SENTENCES - 1) }));
    expect(errors).toContainEqual(expect.stringContaining("at least"));
  });

  it("rejects non-ASCII characters (e.g. smart quotes)", () => {
    const sentences = validSentences();
    sentences[0] =
      "This sentence uses a fancy quote " + String.fromCharCode(0x2019) + " right here.";
    const errors = validateTopic(validTopic({ sentences }));
    expect(errors).toContainEqual(expect.stringContaining("ASCII"));
  });

  it("rejects line breaks in a sentence", () => {
    const sentences = validSentences();
    sentences[0] = "This sentence has a\nline break in the middle of it.";
    const errors = validateTopic(validTopic({ sentences }));
    expect(errors).toContainEqual(expect.stringContaining("line breaks"));
  });

  it("rejects sentences that are too short", () => {
    const sentences = validSentences();
    sentences[0] = "Too short.";
    expect(sentences[0].length).toBeLessThan(MIN_SENTENCE_LENGTH);
    const errors = validateTopic(validTopic({ sentences }));
    expect(errors).toContainEqual(expect.stringContaining("too short"));
  });

  it("rejects duplicate sentences within a topic", () => {
    const sentences = validSentences();
    sentences[1] = sentences[0];
    const errors = validateTopic(validTopic({ sentences }));
    expect(errors).toContainEqual(expect.stringContaining("duplicate"));
  });

  it("rejects leading or trailing whitespace", () => {
    const sentences = validSentences();
    sentences[0] = "  This one has leading whitespace that is not allowed.";
    const errors = validateTopic(validTopic({ sentences }));
    expect(errors).toContainEqual(expect.stringContaining("whitespace"));
  });
});

describe("validateTopics", () => {
  it("flags duplicate ids across topics", () => {
    const a = validTopic({ id: "dup", name: "One" });
    const b = validTopic({ id: "dup", name: "Two" });
    expect(validateTopics([a, b])).toContainEqual(expect.stringContaining("duplicate topic id"));
  });

  it("flags duplicate names across topics", () => {
    const a = validTopic({ id: "one", name: "Same Name" });
    const b = validTopic({ id: "two", name: "Same Name" });
    expect(validateTopics([a, b])).toContainEqual(expect.stringContaining("duplicate topic name"));
  });

  it("passes for distinct valid topics", () => {
    const a = validTopic({ id: "one", name: "One" });
    const b = validTopic({ id: "two", name: "Two" });
    expect(validateTopics([a, b])).toEqual([]);
  });
});
