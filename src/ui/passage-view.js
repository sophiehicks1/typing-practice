/**
 * Passage view -- the only place that turns engine char-states into DOM.
 *
 * It renders one <span> per character and updates them efficiently on each
 * keystroke by only touching the spans whose state could have changed.
 */
import { CharState } from "../core/engine.js";

/** Map an engine {@link CharState} to its CSS class (or "" for pending). */
const STATE_CLASS = {
  [CharState.CORRECT]: "char--correct",
  [CharState.INCORRECT]: "char--incorrect",
  [CharState.CURRENT]: "char--current",
  [CharState.PENDING]: "",
};

export function createPassageView(container) {
  /** @type {HTMLSpanElement[]} */
  let spans = [];
  let prevTyped = "";

  return {
    /**
     * Render a fresh passage. Rebuilds all spans and resets tracking.
     * @param {string} target
     */
    mount(target) {
      container.textContent = "";
      spans = new Array(target.length);
      const frag = document.createDocumentFragment();
      for (let i = 0; i < target.length; i++) {
        const span = document.createElement("span");
        span.textContent = target[i];
        spans[i] = span;
        frag.appendChild(span);
      }
      container.appendChild(frag);
      prevTyped = "";
      if (spans[0]) spans[0].className = STATE_CLASS[CharState.CURRENT];
    },

    /**
     * Update spans to reflect the session's current typed value. Only the range
     * that changed since the last update is touched.
     * @param {ReturnType<import('../core/engine.js').createSession>} session
     */
    update(session) {
      const typed = session.typed;

      // Find the first index that differs from last time.
      let start = 0;
      const maxLen = Math.max(prevTyped.length, typed.length);
      while (start < maxLen && prevTyped[start] === typed[start]) start++;

      for (let i = start; i <= maxLen && i < spans.length; i++) {
        if (spans[i]) spans[i].className = STATE_CLASS[session.charStateAt(i)];
      }
      // Ensure the caret span is marked (it may sit just past the changed range).
      if (spans[typed.length]) {
        spans[typed.length].className = STATE_CLASS[CharState.CURRENT];
      }
      prevTyped = typed;
    },

    /**
     * Scroll the current character into view.
     * @param {number} caretIndex
     */
    revealCaret(caretIndex) {
      const el = spans[caretIndex] || spans[caretIndex - 1];
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    },
  };
}
