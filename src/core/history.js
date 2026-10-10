/**
 * Score history -- pure functions for recording past results, smoothing them,
 * and laying out the WPM progress chart. No DOM, no storage: the UI decides
 * where history is persisted and how the layout is drawn.
 */

/** Maximum number of results kept in history (oldest are dropped first). */
export const MAX_HISTORY = 200;
/** Number of most recent results shown on the progress chart. */
export const CHART_WINDOW = 50;
/** Weight of the newest score in the exponential moving average (0-1). */
export const SMOOTHING_ALPHA = 0.3;

/**
 * A recorded result.
 * @typedef {{ wpm: number, mode: string, duration: number, at: number }} HistoryEntry
 */

function isValidEntry(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    Number.isFinite(entry.wpm) &&
    entry.wpm >= 0 &&
    typeof entry.mode === "string" &&
    Number.isFinite(entry.duration) &&
    Number.isFinite(entry.at)
  );
}

/**
 * Turn whatever was stored (possibly missing, corrupt, or from an older
 * version) into a clean history array. Invalid entries are dropped.
 *
 * @param {unknown} raw  Typically the result of JSON.parse.
 * @returns {HistoryEntry[]}
 */
export function sanitizeHistory(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isValidEntry).slice(-MAX_HISTORY);
}

/**
 * Return a new history with `entry` appended, trimmed to `max` entries.
 *
 * @param {HistoryEntry[]} history
 * @param {HistoryEntry} entry
 * @param {number} [max]
 * @returns {HistoryEntry[]}
 */
export function addResult(history, entry, max = MAX_HISTORY) {
  return [...history, entry].slice(-max);
}

/**
 * Exponential moving average. The first output equals the first input; each
 * later output moves `alpha` of the way from the previous average toward the
 * new value.
 *
 * @param {number[]} values
 * @param {number} [alpha]
 * @returns {number[]} Same length as `values`.
 */
export function smooth(values, alpha = SMOOTHING_ALPHA) {
  const out = [];
  let avg = 0;
  values.forEach((value, i) => {
    avg = i === 0 ? value : avg + alpha * (value - avg);
    out.push(avg);
  });
  return out;
}

/**
 * Round a chart's upper bound up to a tidy number (a multiple of 10, with a
 * little headroom), never below 10.
 *
 * @param {number} maxValue
 * @returns {number}
 */
export function niceMax(maxValue) {
  return Math.max(10, Math.ceil((maxValue * 1.1) / 10) * 10);
}

/**
 * Compute chart geometry for a series of WPM scores: one point per raw score,
 * the matching smoothed-average points, and y-axis gridline positions.
 *
 * x runs from left to right in run order; y is 0 WPM at the bottom.
 *
 * @param {number[]} scores  WPM values, oldest first.
 * @param {Object} box
 * @param {number} box.width
 * @param {number} box.height
 * @param {{ top: number, right: number, bottom: number, left: number }} box.pad
 * @param {number} [alpha]   Smoothing factor passed to {@link smooth}.
 * @returns {{
 *   raw: { x: number, y: number, value: number }[],
 *   smoothed: { x: number, y: number, value: number }[],
 *   ticks: { y: number, value: number }[],
 *   yMax: number,
 * }}
 */
export function chartLayout(scores, { width, height, pad }, alpha = SMOOTHING_ALPHA) {
  const yMax = niceMax(scores.length ? Math.max(...scores) : 0);
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const n = scores.length;

  const xAt = (i) => pad.left + (n > 1 ? (i / (n - 1)) * plotW : plotW / 2);
  const yAt = (v) => pad.top + plotH - (v / yMax) * plotH;
  const toPoints = (values) => values.map((value, i) => ({ x: xAt(i), y: yAt(value), value }));

  return {
    raw: toPoints(scores),
    smoothed: toPoints(smooth(scores, alpha)),
    ticks: [0, yMax / 2, yMax].map((value) => ({ y: yAt(value), value })),
    yMax,
  };
}
