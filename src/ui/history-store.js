/**
 * History store -- persists past results in localStorage. All parsing and
 * trimming is delegated to the pure helpers in core/history.js; this module only
 * deals with the storage API (which can be missing or throw, e.g. in private
 * browsing or when opened from file://).
 */
import { sanitizeHistory, addResult } from "../core/history.js";

const STORAGE_KEY = "typing-practice:history:v1";

/** @returns {import('../core/history.js').HistoryEntry[]} */
export function loadHistory(storage = globalThis.localStorage) {
  try {
    return sanitizeHistory(JSON.parse(storage.getItem(STORAGE_KEY)));
  } catch {
    return [];
  }
}

/**
 * Append a result and persist it. Returns the updated history even if saving
 * fails, so the chart still reflects this session.
 */
export function recordResult(history, entry, storage = globalThis.localStorage) {
  const next = addResult(history, entry);
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable or full -- keep the in-memory history only.
  }
  return next;
}
