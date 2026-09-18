/**
 * Topic loader.
 *
 * Every JSON file in `src/content/topics/` is discovered automatically with
 * Vite's `import.meta.glob`. That means adding a new topic is as simple as
 * dropping a well-formed JSON file into that folder -- there is no central list
 * to update. See `docs/adding-topics.md`.
 *
 * Topics are validated at load time. In development an invalid topic throws so
 * the mistake is impossible to miss; the same rules are enforced in CI by
 * `test/content.test.js`.
 */
import { validateTopics } from "./schema.js";

// `eager: true` returns the parsed modules directly (no promises). Each JSON
// module's default export is the topic object.
const modules = import.meta.glob("./topics/*.json", { eager: true });

/** @type {import('./schema.js').Topic[]} */
const topics = Object.keys(modules)
  .sort()
  .map((path) => modules[path].default);

const problems = validateTopics(topics);
if (problems.length > 0) {
  throw new Error("Invalid topic content found:\n" + problems.map((p) => `  - ${p}`).join("\n"));
}

// Present topics alphabetically by display name for a stable, predictable picker.
topics.sort((a, b) => a.name.localeCompare(b.name));

/**
 * All valid topics, sorted by display name.
 * @type {ReadonlyArray<import('./schema.js').Topic>}
 */
export const TOPICS = Object.freeze(topics);

/**
 * Look up a topic by its id.
 * @param {string} id
 * @returns {import('./schema.js').Topic | undefined}
 */
export function getTopicById(id) {
  return TOPICS.find((topic) => topic.id === id);
}
