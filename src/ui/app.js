/**
 * App controller -- wires the pure core (engine, passage, stats, time) to the
 * DOM. This is the only "impure" part of the codebase: it touches elements,
 * runs the interval clock, and reads the input field. All real decisions live in
 * the core modules, which keeps this file mostly plumbing.
 */
import { TOPICS } from "../content/loader.js";
import { createSession } from "../core/engine.js";
import { pickPassage, RANDOM_TOPIC_ID } from "../core/passage.js";
import { remainingSeconds, formatClock } from "../core/time.js";
import { createPassageView } from "./passage-view.js";

/** How often the countdown clock ticks, in milliseconds. */
const TICK_MS = 100;
/** Remaining seconds at which the clock turns red. */
const WARN_AT = 10;
/** Default run length, in seconds. */
const DEFAULT_DURATION = 30;

const byId = (id) => document.getElementById(id);

export function startApp() {
  const els = {
    app: byId("app"),
    text: byId("text"),
    input: byId("input"),
    panel: byId("panel"),
    timer: byId("timer"),
    liveWpm: byId("liveWpm"),
    liveAcc: byId("liveAcc"),
    hint: byId("hint"),
    setup: byId("setup"),
    results: byId("results"),
    autocorrect: byId("autocorrectChk"),
    times: byId("times"),
    customSec: byId("customSec"),
    themeSel: byId("themeSel"),
    finalWpm: byId("finalWpm"),
    finalErr: byId("finalErr"),
    finalAcc: byId("finalAcc"),
    finalChars: byId("finalChars"),
    doneNote: byId("doneNote"),
    startBtn: byId("startBtn"),
    againBtn: byId("againBtn"),
    changeBtn: byId("changeBtn"),
  };

  const passageView = createPassageView(els.text);

  // ----- Session state -----
  let duration = DEFAULT_DURATION;
  let selectedTopicId = RANDOM_TOPIC_ID;
  let lastFirstId = null;
  let session = null;
  let started = false;
  let finished = false;
  let startTime = 0;
  let tick = null;

  // ----- Keyboard-aware sizing (mobile) -----
  function fit() {
    const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    els.app.style.height = h + "px";
  }
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", fit);
    window.visualViewport.addEventListener("scroll", fit);
  }
  window.addEventListener("resize", fit);

  // ----- Topic dropdown: "Random" first, then each topic by name -----
  function buildTopicOptions() {
    const random = document.createElement("option");
    random.value = RANDOM_TOPIC_ID;
    random.textContent = "Random (mixed topics)";
    els.themeSel.appendChild(random);
    TOPICS.forEach((topic) => {
      const option = document.createElement("option");
      option.value = topic.id;
      option.textContent = topic.name;
      els.themeSel.appendChild(option);
    });
  }

  // ----- Clock -----
  function updateTimer() {
    const remain = remainingSeconds(startTime, duration, Date.now());
    els.timer.textContent = formatClock(remain);
    els.timer.classList.toggle("warn", remain <= WARN_AT);
    updateLive();
    if (remain <= 0) finish(false);
  }

  function elapsed() {
    return started ? (Date.now() - startTime) / 1000 : 0;
  }

  function updateLive() {
    const stats = session.stats(elapsed());
    els.liveWpm.textContent = String(stats.wpm);
    els.liveAcc.textContent = stats.accuracy + "%";
  }

  // ----- Typing -----
  function onInput() {
    if (finished || !session) return;

    const accepted = session.setTyped(els.input.value);
    // Sync the field back if the engine clamped an over-long value.
    if (accepted !== els.input.value) els.input.value = accepted;

    if (!started) startRun();

    passageView.update(session);
    passageView.revealCaret(session.typed.length);
    updateLive();

    if (session.isComplete()) finish(true);
  }

  function startRun() {
    started = true;
    startTime = Date.now();
    els.hint.textContent = "";
    tick = setInterval(updateTimer, TICK_MS);
  }

  function finish(completed) {
    if (finished) return;
    finished = true;
    if (tick) clearInterval(tick);

    els.input.disabled = true;
    els.input.blur();

    const cappedElapsed = started ? Math.min(duration, (Date.now() - startTime) / 1000) : 0;
    const stats = session.stats(cappedElapsed);

    els.finalWpm.innerHTML = stats.wpm + "<span> WPM</span>";
    els.finalErr.textContent = String(stats.errors);
    els.finalAcc.textContent = stats.accuracy + "%";
    els.finalChars.textContent = String(stats.typedChars);
    els.doneNote.textContent = completed ? "Passage finished early. Nice." : "";

    els.setup.classList.add("hidden");
    els.results.classList.remove("hidden");
  }

  // ----- Setup screen wiring -----
  function selectDuration(seconds, { clearCustom = true, clearChips = false } = {}) {
    duration = seconds;
    if (clearCustom) els.customSec.value = "";
    if (clearChips) {
      Array.prototype.forEach.call(els.times.children, (c) => c.classList.remove("sel"));
    }
  }

  els.themeSel.addEventListener("change", () => {
    selectedTopicId = els.themeSel.value;
  });

  els.times.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    Array.prototype.forEach.call(els.times.children, (c) => c.classList.remove("sel"));
    chip.classList.add("sel");
    selectDuration(parseInt(chip.getAttribute("data-sec"), 10));
  });

  els.customSec.addEventListener("input", () => {
    const value = parseInt(els.customSec.value, 10);
    if (value >= 5 && value <= 600) {
      selectDuration(value, { clearCustom: false, clearChips: true });
    }
  });

  // ----- Run lifecycle -----
  function reset() {
    started = false;
    finished = false;
    els.input.value = "";
    els.input.disabled = false;
    els.timer.classList.remove("warn");
    els.timer.textContent = formatClock(duration);
    els.liveWpm.textContent = "0";
    els.liveAcc.textContent = "100%";
    els.hint.textContent = "Timer starts on your first keystroke.";
    passageView.mount(session.target);
    els.panel.scrollTop = 0;
  }

  function begin() {
    els.results.classList.add("hidden");
    els.setup.classList.add("hidden");

    const { passage, firstId } = pickPassage({
      topics: TOPICS,
      topicId: selectedTopicId,
      avoidFirstId: lastFirstId,
    });
    lastFirstId = firstId;
    session = createSession(passage);

    reset();

    // Apply the autocorrect choice; capitalization stays on either way.
    const autocorrectOn = els.autocorrect.checked;
    els.input.setAttribute("autocorrect", autocorrectOn ? "on" : "off");
    els.input.setAttribute("autocapitalize", "sentences");
    els.input.spellcheck = autocorrectOn;

    // Focusing inside the tap opens the mobile keyboard.
    els.input.focus();
  }

  els.startBtn.addEventListener("click", begin);
  els.againBtn.addEventListener("click", begin);
  els.changeBtn.addEventListener("click", () => {
    els.results.classList.add("hidden");
    els.setup.classList.remove("hidden");
  });
  els.input.addEventListener("input", onInput);

  // ----- Initialize -----
  buildTopicOptions();
  fit();
  // Prime a passage so the panel is not blank behind the setup overlay.
  const initial = pickPassage({
    topics: TOPICS,
    topicId: selectedTopicId,
    avoidFirstId: lastFirstId,
  });
  lastFirstId = initial.firstId;
  session = createSession(initial.passage);
  els.timer.textContent = formatClock(duration);
  passageView.mount(session.target);
}
