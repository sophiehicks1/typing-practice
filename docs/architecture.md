# Architecture

The guiding principle is a clean split between **pure logic** and **the DOM**.
Everything that makes a decision (how a passage is built, how WPM is computed, how
a keystroke changes the on-screen state) lives in `src/core/` as pure,
side-effect-free functions. Everything that touches the browser lives in
`src/ui/`. This is what makes the interesting parts of the app testable without a
browser, and it keeps the UI a thin adapter.

```
                 +-------------------+
   topics/*.json | src/content       |  discovers + validates topics
                 |  schema, loader   |
                 +---------+---------+
                           |
                           v
   +-----------+   +-------------------+   +-----------------+
   | src/core  |   | src/ui            |   | index.html      |
   | (pure)    |<--| app.js (glue)     |-->| DOM elements    |
   |           |   | passage-view.js   |   |                 |
   | random    |   +-------------------+   +-----------------+
   | stats     |
   | time      |            ^
   | passage   |            |
   | engine    |     src/main.js boots the app
   +-----------+
```

## Modules

### `src/content`

- **`schema.js`** -- the single source of truth for what a valid topic is. Exports
  `validateTopic`, `validateTopics`, and the limit constants. Used by both the
  loader (fail fast in dev) and the tests (fail in CI).
- **`loader.js`** -- uses Vite's `import.meta.glob` to import every topic JSON,
  validates the collection, freezes it, and exports `TOPICS` (sorted by name) and
  `getTopicById`.

### `src/core` (pure, no DOM)

- **`random.js`** -- `defaultRng`, `createSeededRng(seed)`, and `shuffle`.
  Randomness is always injected as an `rng` argument so tests are deterministic.
- **`stats.js`** -- `countCorrect`, `computeWpm`, `computeAccuracy`,
  `computeStats`. Implements the standard 5-characters-per-word convention; WPM
  counts only correct characters.
- **`time.js`** -- `remainingSeconds` and `formatClock` for the countdown.
- **`passage.js`** -- `buildFromTopic`, `buildMixed`, and `pickPassage`. Assembles
  a passage of at least `MIN_PASSAGE_LENGTH` characters, either from one topic or
  by mixing all of them.
- **`engine.js`** -- `createSession(target)`, a state machine that tracks what has
  been typed, counts errors (corrected mistakes still count), and reports
  per-character render states via `CharState`. Also `createFreeSession()` for
  free-typing mode (no target: it stores anything typed and reports raw speed,
  word count, and character count). Both expose a `mode` (`Mode.PASSAGE` /
  `Mode.FREE`) so the UI knows which to render.

### `src/ui` (DOM glue)

- **`passage-view.js`** -- the only module that turns `CharState` values into DOM
  classes. Efficiently updates only the spans whose state could have changed.
- **`app.js`** -- the controller. Reads settings from the setup screen, drives the
  countdown interval, feeds input into the engine, and renders results. It
  contains no game math -- it delegates all of that to `src/core`.

### `src/main.js`

Loads styles and calls `startApp()` once the DOM is ready.

## Why this shape

- **Testability.** Passage assembly, stats, timing, and the typing engine are
  pure functions with injected randomness/time, so they are covered by fast,
  deterministic unit tests. The one DOM module has jsdom tests.
- **Extensibility.** Content is data (`*.json`), discovered automatically and
  validated centrally. Adding a topic touches no code.
- **Low barrier.** Plain ES modules and vanilla JS -- no framework to learn.
  JSDoc types document intent and give editors autocomplete without a build step.

## Testing strategy

- One test file per module under `test/`.
- Core modules: pure unit tests with a seeded RNG for determinism.
- Content: `test/content.test.js` validates every real topic file and confirms
  each can fill a full-length passage.
- UI: `test/passage-view.test.js` runs under jsdom (opted in with a
  `// @vitest-environment jsdom` comment at the top of the file).

Run the same suite CI runs with `npm run check`.
