import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateTopic, validateTopics } from "../src/content/schema.js";
import { buildFromTopic, MIN_PASSAGE_LENGTH } from "../src/core/passage.js";
import { createSeededRng } from "../src/core/random.js";

const here = dirname(fileURLToPath(import.meta.url));
const topicsDir = join(here, "..", "src", "content", "topics");

function loadTopicFiles() {
  const files = readdirSync(topicsDir).filter((f) => f.endsWith(".json"));
  return files.map((file) => ({
    file,
    topic: JSON.parse(readFileSync(join(topicsDir, file), "utf8")),
  }));
}

const entries = loadTopicFiles();

describe("topic files", () => {
  it("there is at least one topic", () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)("$file is valid", ({ topic }) => {
    expect(validateTopic(topic)).toEqual([]);
  });

  it.each(entries)("$file: id matches its file name", ({ file, topic }) => {
    expect(`${topic.id}.json`).toBe(file);
  });

  it("has no duplicate ids or names across the collection", () => {
    expect(validateTopics(entries.map((e) => e.topic))).toEqual([]);
  });

  it.each(entries)("$file can fill a full-length passage", ({ topic }) => {
    const passage = buildFromTopic(topic, { rng: createSeededRng(1) });
    expect(passage.length).toBeGreaterThanOrEqual(MIN_PASSAGE_LENGTH);
  });
});
