/**
 * Typing statistics -- pure functions, no state, no DOM.
 *
 * These implement the standard conventions used by most typing tests:
 *   - A "word" is defined as 5 characters (the classic WPM convention).
 *   - WPM counts only correctly typed characters.
 *   - Accuracy is correct characters divided by characters typed.
 */

/** Characters per "word" for WPM calculation. */
export const CHARS_PER_WORD = 5;

/**
 * Count how many characters of `typed` match `target` at the same position.
 *
 * @param {string} typed
 * @param {string} target
 * @returns {number}
 */
export function countCorrect(typed, target) {
  const n = Math.min(typed.length, target.length);
  let correct = 0;
  for (let i = 0; i < n; i++) {
    if (typed[i] === target[i]) correct++;
  }
  return correct;
}

/**
 * Words per minute, based on correctly typed characters.
 *
 * Elapsed time is floored at one second so the number stays sane in the very
 * first moments of a run (dividing by a near-zero time would explode).
 *
 * @param {number} correctChars
 * @param {number} elapsedSeconds
 * @returns {number} WPM, rounded to the nearest whole number.
 */
export function computeWpm(correctChars, elapsedSeconds) {
  const minutes = Math.max(elapsedSeconds, 1) / 60;
  return Math.round(correctChars / CHARS_PER_WORD / minutes);
}

/**
 * Accuracy as a whole-number percentage.
 * With nothing typed yet, accuracy is defined as 100%.
 *
 * @param {number} correctChars
 * @param {number} typedLength
 * @returns {number} 0-100
 */
export function computeAccuracy(correctChars, typedLength) {
  if (typedLength <= 0) return 100;
  return Math.round((correctChars / typedLength) * 100);
}

/**
 * Count whitespace-separated words in a string. Used by free-typing mode, where
 * there is no target to compare against.
 *
 * @param {string} text
 * @returns {number}
 */
export function countWords(text) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

/**
 * Compute the full set of live/final stats for a run.
 *
 * @param {Object} args
 * @param {string} args.typed          What the user has typed so far.
 * @param {string} args.target         The passage being copied.
 * @param {number} args.elapsedSeconds Seconds since the run started.
 * @param {number} [args.errors]       Total mistakes made (corrected ones still count).
 * @returns {{ wpm: number, accuracy: number, correctChars: number, typedChars: number, errors: number }}
 */
export function computeStats({ typed, target, elapsedSeconds, errors = 0 }) {
  const correctChars = countCorrect(typed, target);
  return {
    wpm: computeWpm(correctChars, elapsedSeconds),
    accuracy: computeAccuracy(correctChars, typed.length),
    correctChars,
    typedChars: typed.length,
    errors,
  };
}
