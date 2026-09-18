/**
 * Topic schema and validation.
 *
 * A "topic" is a themed pool of sentences that passages are assembled from.
 * Each topic lives in its own JSON file under `src/content/topics/`. This module
 * is the single source of truth for what makes a topic valid, and it is used in
 * two places:
 *
 *   1. The loader (`loader.js`) validates every topic at load time, so a broken
 *      topic fails loudly during development instead of silently misbehaving.
 *   2. The content test (`test/content.test.js`) validates every topic file, so
 *      a bad edit is caught in CI before it ever ships.
 *
 * If you are adding or editing a topic, these are the rules your content must
 * satisfy. See `docs/adding-topics.md` for a friendly walkthrough.
 *
 * @typedef {Object} Topic
 * @property {string} id           Stable, unique, kebab-case identifier. Also the file name.
 * @property {string} name         Human-readable label shown in the topic picker.
 * @property {string} description  One-sentence summary of the topic.
 * @property {string[]} sentences  The sentence pool passages are drawn from.
 */

/** Minimum number of sentences a topic must provide. */
export const MIN_SENTENCES = 10;

/** Longest a single sentence may be, in characters. Keeps passages readable. */
export const MAX_SENTENCE_LENGTH = 120;

/** Shortest a single sentence may be, in characters. Avoids stub fragments. */
export const MIN_SENTENCE_LENGTH = 20;

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** True if every character in `str` is printable ASCII (space through tilde). */
function isPrintableAscii(str) {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 0x20 || code > 0x7e) return false;
  }
  return true;
}

/**
 * Validate a single topic object.
 *
 * @param {unknown} topic
 * @returns {string[]} A list of human-readable problems. Empty means valid.
 */
export function validateTopic(topic) {
  const errors = [];

  if (typeof topic !== "object" || topic === null) {
    return ["topic must be an object"];
  }

  const { id, name, description, sentences } = /** @type {Topic} */ (topic);

  if (typeof id !== "string" || !ID_PATTERN.test(id)) {
    errors.push(`id must be a kebab-case string, got ${JSON.stringify(id)}`);
  }
  if (typeof name !== "string" || name.trim() === "") {
    errors.push("name must be a non-empty string");
  } else if (!isPrintableAscii(name)) {
    errors.push(`name must be printable ASCII: ${JSON.stringify(name)}`);
  }
  if (typeof description !== "string" || description.trim() === "") {
    errors.push("description must be a non-empty string");
  } else if (!isPrintableAscii(description)) {
    errors.push(`description must be printable ASCII: ${JSON.stringify(description)}`);
  }

  if (!Array.isArray(sentences)) {
    errors.push("sentences must be an array");
    return errors;
  }
  if (sentences.length < MIN_SENTENCES) {
    errors.push(`sentences must have at least ${MIN_SENTENCES} entries, got ${sentences.length}`);
  }

  const seen = new Set();
  sentences.forEach((sentence, index) => {
    const where = `sentences[${index}]`;
    if (typeof sentence !== "string") {
      errors.push(`${where} must be a string`);
      return;
    }
    if (/[\r\n\t]/.test(sentence)) {
      errors.push(`${where} must not contain line breaks or tabs`);
    }
    if (!isPrintableAscii(sentence)) {
      errors.push(`${where} must be printable ASCII (no smart quotes or accents)`);
    }
    if (sentence !== sentence.trim()) {
      errors.push(`${where} must not have leading or trailing whitespace`);
    }
    if (sentence.length < MIN_SENTENCE_LENGTH) {
      errors.push(`${where} is too short (min ${MIN_SENTENCE_LENGTH} chars)`);
    }
    if (sentence.length > MAX_SENTENCE_LENGTH) {
      errors.push(`${where} is too long (max ${MAX_SENTENCE_LENGTH} chars)`);
    }
    const key = sentence.toLowerCase();
    if (seen.has(key)) {
      errors.push(`${where} is a duplicate sentence`);
    }
    seen.add(key);
  });

  return errors;
}

/**
 * Validate a whole collection of topics, including cross-topic rules
 * (unique ids and names).
 *
 * @param {Topic[]} topics
 * @returns {string[]} A list of human-readable problems. Empty means valid.
 */
export function validateTopics(topics) {
  const errors = [];
  const ids = new Set();
  const names = new Set();

  topics.forEach((topic) => {
    const topicErrors = validateTopic(topic);
    const label = topic && topic.id ? topic.id : "<unknown>";
    topicErrors.forEach((message) => errors.push(`[${label}] ${message}`));

    if (topic && typeof topic.id === "string") {
      if (ids.has(topic.id)) errors.push(`duplicate topic id: ${topic.id}`);
      ids.add(topic.id);
    }
    if (topic && typeof topic.name === "string") {
      const nameKey = topic.name.toLowerCase();
      if (names.has(nameKey)) errors.push(`duplicate topic name: ${topic.name}`);
      names.add(nameKey);
    }
  });

  return errors;
}
