/**
 * Passage assembly -- pure logic, no DOM.
 *
 * A passage is a long string built by stitching together shuffled sentences
 * until it reaches a target length. Because each round reshuffles, passages
 * effectively never repeat. Two modes are supported:
 *
 *   - Single topic: draw from one topic's sentence pool, looping (reshuffled)
 *     if the pool is shorter than the target length.
 *   - Mixed: start in one topic and spill into others to fill the length.
 *
 * All randomness is injected via `rng` so the output is deterministic in tests.
 */
import { shuffle, defaultRng } from "./random.js";

/** Default minimum passage length in characters. */
export const MIN_PASSAGE_LENGTH = 2000;

// A safety valve so a pathologically small topic pool can never spin forever.
const MAX_LOOPS = 50;

/**
 * Join a list of sentences into a single passage string.
 * @param {string[]} sentences
 * @returns {string}
 */
function joinSentences(sentences) {
  return sentences.join(" ");
}

/**
 * Build a passage from a single topic, looping through its (reshuffled) pool as
 * many times as needed to reach `minLength`. Avoids placing the same sentence
 * back-to-back across loop boundaries.
 *
 * @param {import('../content/schema.js').Topic} topic
 * @param {Object} [options]
 * @param {number} [options.minLength]
 * @param {import('./random.js').Rng} [options.rng]
 * @returns {string}
 */
export function buildFromTopic(topic, { minLength = MIN_PASSAGE_LENGTH, rng = defaultRng } = {}) {
  const chosen = [];
  let length = 0;
  let loops = 0;

  while (length < minLength && loops < MAX_LOOPS) {
    const pool = shuffle(topic.sentences, rng);
    for (let i = 0; i < pool.length && length < minLength; i++) {
      if (chosen.length && chosen[chosen.length - 1] === pool[i]) continue;
      chosen.push(pool[i]);
      length += pool[i].length + 1;
    }
    loops++;
  }

  return joinSentences(chosen);
}

/**
 * Build a passage that starts in one topic and spills into the others to fill
 * the length. Optionally avoids opening with a given topic id (so the same
 * topic does not lead two rounds in a row).
 *
 * @param {import('../content/schema.js').Topic[]} topics
 * @param {Object} [options]
 * @param {number} [options.minLength]
 * @param {import('./random.js').Rng} [options.rng]
 * @param {string|null} [options.avoidFirstId]  Topic id to avoid opening with.
 * @returns {{ passage: string, firstId: string|null }}
 */
export function buildMixed(
  topics,
  { minLength = MIN_PASSAGE_LENGTH, rng = defaultRng, avoidFirstId = null } = {},
) {
  if (topics.length === 0) return { passage: "", firstId: null };

  const order = shuffle(topics, rng);

  // If the shuffle happened to lead with the topic we want to avoid, swap it
  // with the next one so consecutive rounds do not open the same way.
  if (order.length > 1 && avoidFirstId !== null && order[0].id === avoidFirstId) {
    const tmp = order[0];
    order[0] = order[1];
    order[1] = tmp;
  }

  const chosen = [];
  let length = 0;
  for (let k = 0; k < order.length && length < minLength; k++) {
    const pool = shuffle(order[k].sentences, rng);
    for (let i = 0; i < pool.length && length < minLength; i++) {
      chosen.push(pool[i]);
      length += pool[i].length + 1;
    }
  }

  return { passage: joinSentences(chosen), firstId: order[0].id };
}

/**
 * The special topic id meaning "mix all topics together".
 */
export const RANDOM_TOPIC_ID = "random";

/**
 * High-level entry point used by the app. Picks a passage for the chosen topic
 * id, where the id may be a real topic id or {@link RANDOM_TOPIC_ID}.
 *
 * @param {Object} args
 * @param {import('../content/schema.js').Topic[]} args.topics  All available topics.
 * @param {string} args.topicId                                 Selected id, or "random".
 * @param {number} [args.minLength]
 * @param {import('./random.js').Rng} [args.rng]
 * @param {string|null} [args.avoidFirstId]  Only used for the random mix.
 * @returns {{ passage: string, firstId: string|null }}
 */
export function pickPassage({
  topics,
  topicId,
  minLength = MIN_PASSAGE_LENGTH,
  rng = defaultRng,
  avoidFirstId = null,
}) {
  if (topicId === RANDOM_TOPIC_ID) {
    return buildMixed(topics, { minLength, rng, avoidFirstId });
  }
  const topic = topics.find((t) => t.id === topicId);
  if (!topic) {
    throw new Error(`Unknown topic id: ${topicId}`);
  }
  return { passage: buildFromTopic(topic, { minLength, rng }), firstId: topic.id };
}
