/**
 * Time helpers -- pure functions used by the countdown clock.
 */

/**
 * Seconds remaining in a run, never negative.
 *
 * @param {number} startedAtMs   Timestamp (ms) when the run started.
 * @param {number} durationSec   Total run length in seconds.
 * @param {number} nowMs         Current timestamp (ms).
 * @returns {number} Remaining seconds (may be fractional), floored at 0.
 */
export function remainingSeconds(startedAtMs, durationSec, nowMs) {
  const elapsed = (nowMs - startedAtMs) / 1000;
  return Math.max(0, durationSec - elapsed);
}

/**
 * Format a number of seconds as "m:ss" (e.g. 65 -> "1:05").
 * Fractional seconds are rounded up so the clock only reads 0:00 when time is
 * genuinely up.
 *
 * @param {number} totalSeconds
 * @returns {string}
 */
export function formatClock(totalSeconds) {
  const whole = Math.max(0, Math.ceil(totalSeconds));
  const minutes = Math.floor(whole / 60);
  const seconds = whole % 60;
  return `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
}
