# CLAUDE.md

Guidance for AI agents (and humans) working in this repository.

## What this is

A static, mobile-friendly typing speed test built with vanilla JS + Vite, tested
with Vitest. No framework. It began as a single HTML file and was refactored into
a modular, tested codebase whose main design goal is **easy extension** -- adding
features, new text topics, or more content to existing topics.

## Golden rules

1. **Keep game logic pure and in `src/core/`.** Anything that computes or decides
   (stats, passage assembly, typing state, timing) must be a pure function with no
   DOM access, and must have tests. The DOM lives only in `src/ui/`.
2. **Content is data.** Text lives in `src/content/topics/*.json`, one file per
   topic, auto-discovered by `src/content/loader.js`. Never hardcode passages in
   code.
3. **Everything is ASCII.** Sentences, names, and descriptions must be printable
   ASCII (no smart quotes, em dashes, or accents). This is enforced by tests.
4. **Add tests with logic changes.** Each module in `src/core/` and
   `src/content/` has a matching `test/*.test.js`. Keep randomness deterministic
   by injecting a seeded RNG (`createSeededRng`).
5. **Run `npm run check` before finishing.** It runs lint, format check, and
   tests -- the same as CI.

## Fast paths

- **Add a topic:** create `src/content/topics/<id>.json` with `id`, `name`,
  `description`, `sentences` (>= 10, each 20-120 ASCII chars). Run `npm test`.
  Full rules: `docs/adding-topics.md`.
- **Extend a topic:** append sentences to its JSON `sentences` array; run tests.
- **Change scoring / passages / timing:** edit the relevant `src/core/*.js` and
  its test.
- **Add UI behavior:** put decisions in `src/core/` (tested) and wiring in
  `src/ui/app.js`.

## Commands

```bash
npm install        # setup
npm run dev        # dev server
npm test           # tests once
npm run check      # lint + format check + tests (run before committing)
npm run build      # static production build -> dist/
```

## Map of the code

- `src/content/schema.js` -- the definition of a valid topic (validation +
  limits). Single source of truth, used by the loader and the tests.
- `src/content/loader.js` -- discovers, validates, and exports `TOPICS`.
- `src/core/random.js` -- seedable RNG + `shuffle`.
- `src/core/stats.js` -- WPM / accuracy math.
- `src/core/time.js` -- countdown + clock formatting.
- `src/core/passage.js` -- passage assembly (`pickPassage`, `buildFromTopic`,
  `buildMixed`).
- `src/core/engine.js` -- typing session state machine (`createSession`,
  `CharState`).
- `src/ui/passage-view.js` -- renders characters + states to DOM.
- `src/ui/app.js` -- wires core to the page.
- `src/main.js` -- entry point.

See `docs/architecture.md` for the full picture and `CONTRIBUTING.md` for the
workflow.
