/**
 * Typing session engine -- a small state machine with no DOM dependencies.
 *
 * The engine owns the "what" of a run (the target text, what has been typed, how
 * many mistakes were made, per-character correctness) while the UI owns the
 * "how" (rendering spans, focusing the input, running the interval clock). This
 * split is deliberate: the engine can be exhaustively unit-tested without a
 * browser, and the UI stays a thin adapter over it.
 *
 * Error-counting rule (matches the original game): every mistake counts, even if
 * you later correct it. Concretely, whenever the typed text grows, any newly
 * added characters that do not match the target are tallied as errors. Deleting
 * and retyping therefore counts the new attempt again.
 */
import { computeStats, computeWpm, countWords } from "./stats.js";

/** Per-character render states. */
export const CharState = Object.freeze({
  /** Not yet reached. */
  PENDING: "pending",
  /** Typed correctly. */
  CORRECT: "correct",
  /** Typed incorrectly. */
  INCORRECT: "incorrect",
  /** The caret position (next character to type). */
  CURRENT: "current",
});

/** Session modes. */
export const Mode = Object.freeze({
  /** Copy a fixed passage; correctness and accuracy are measured. */
  PASSAGE: "passage",
  /** Type anything for the time limit; only raw speed is measured. */
  FREE: "free",
});

/**
 * Create a typing session for a given target passage.
 *
 * @param {string} target The passage to be copied.
 */
export function createSession(target) {
  if (typeof target !== "string" || target.length === 0) {
    throw new Error("createSession requires a non-empty target string");
  }

  let typed = "";
  let errors = 0;
  // High-water mark of the typed length, used to count each newly typed
  // character exactly once as the text grows.
  let prevLength = 0;

  return {
    /** Which mode this session is. @returns {string} */
    get mode() {
      return Mode.PASSAGE;
    },

    /** The target passage. @returns {string} */
    get target() {
      return target;
    },

    /** What has been typed so far (clamped to the target length). @returns {string} */
    get typed() {
      return typed;
    },

    /** Total mistakes made, including corrected ones. @returns {number} */
    get errors() {
      return errors;
    },

    /** True once the whole passage has been typed. @returns {boolean} */
    isComplete() {
      return typed.length >= target.length;
    },

    /**
     * Apply a new value from the input field. Typing past the end of the
     * passage is ignored (the value is clamped). Returns the accepted value so
     * callers can sync the input if it was clamped.
     *
     * @param {string} value
     * @returns {string}
     */
    setTyped(value) {
      if (value.length > target.length) {
        value = value.slice(0, target.length);
      }
      if (value.length > prevLength) {
        for (let i = prevLength; i < value.length; i++) {
          if (value[i] !== target[i]) errors++;
        }
      }
      prevLength = value.length;
      typed = value;
      return typed;
    },

    /**
     * The render state of the character at index `i`.
     * @param {number} i
     * @returns {string} one of {@link CharState}
     */
    charStateAt(i) {
      if (i < typed.length) {
        return typed[i] === target[i] ? CharState.CORRECT : CharState.INCORRECT;
      }
      if (i === typed.length) return CharState.CURRENT;
      return CharState.PENDING;
    },

    /**
     * The render state for every character in the target passage.
     * @returns {string[]}
     */
    charStates() {
      const states = new Array(target.length);
      for (let i = 0; i < target.length; i++) states[i] = this.charStateAt(i);
      return states;
    },

    /**
     * Snapshot the run's statistics at a given elapsed time.
     * @param {number} elapsedSeconds
     * @returns {{ wpm: number, accuracy: number, correctChars: number, typedChars: number, errors: number }}
     */
    stats(elapsedSeconds) {
      return computeStats({ typed, target, elapsedSeconds, errors });
    },
  };
}

/**
 * Create a free-typing session: the user types anything they like for the time
 * limit, and only raw speed is measured. There is no target, so there is no
 * concept of correctness, accuracy, errors, or per-character state -- every
 * typed character counts toward the speed.
 */
export function createFreeSession() {
  let typed = "";

  return {
    /** Which mode this session is. @returns {string} */
    get mode() {
      return Mode.FREE;
    },

    /** What has been typed so far. @returns {string} */
    get typed() {
      return typed;
    },

    /** Free typing never ends on its own -- only the clock stops it. @returns {boolean} */
    isComplete() {
      return false;
    },

    /**
     * Store the latest value from the input field. Nothing is clamped or
     * validated -- anything goes.
     * @param {string} value
     * @returns {string}
     */
    setTyped(value) {
      typed = value;
      return typed;
    },

    /**
     * Snapshot the run's statistics at a given elapsed time. Free mode reports
     * words per minute (all typed characters count), plus word and character
     * totals.
     * @param {number} elapsedSeconds
     * @returns {{ wpm: number, typedChars: number, words: number }}
     */
    stats(elapsedSeconds) {
      return {
        wpm: computeWpm(typed.length, elapsedSeconds),
        typedChars: typed.length,
        words: countWords(typed),
      };
    },
  };
}
