# Contributing

Thanks for improving Typing Practice. This project is intentionally small and
dependency-light so that changes are easy to make and easy to review.

## Setup

```bash
npm install
npm run dev
```

## The workflow

1. Make your change.
2. Add or update tests for it (see below).
3. Run the full check:

   ```bash
   npm run check
   ```

   This runs ESLint, a Prettier format check, and the whole test suite -- exactly
   what CI runs. If it passes locally, CI should pass too.

4. Commit with a clear message and open a pull request.

## Where things live

Read [`docs/architecture.md`](docs/architecture.md) first -- it explains the
core/UI split. The short version:

- Game logic (math, passage assembly, typing state) goes in `src/core/` as pure
  functions. No DOM access here.
- Anything touching the page goes in `src/ui/`.
- Text content goes in `src/content/topics/` as JSON. See
  [`docs/adding-topics.md`](docs/adding-topics.md).

## Testing expectations

- Every module in `src/core/` and `src/content/` has a matching test file in
  `test/`. New logic there should come with tests.
- Keep core tests deterministic by passing a seeded RNG
  (`createSeededRng`) rather than relying on `Math.random`.
- Tests that need the DOM run under jsdom -- add
  `// @vitest-environment jsdom` as the first line of the test file.
- Content changes are covered automatically by `test/content.test.js`; just run
  `npm test`.

## Style

- Code is formatted by Prettier and linted by ESLint; run `npm run format` before
  committing.
- Prefer clear names and short functions over comments, but document the "why"
  where behavior is non-obvious.
- Keep text content **printable ASCII** (no smart quotes or accents) -- this is
  enforced by the content tests.

## Common tasks

- **Add a topic:** [`docs/adding-topics.md`](docs/adding-topics.md).
- **Change scoring:** edit `src/core/stats.js` and its test.
- **Change passage length or assembly:** edit `src/core/passage.js` and its test.
- **Add a UI feature:** put the logic in `src/core/` (with tests) and the wiring
  in `src/ui/app.js`.
