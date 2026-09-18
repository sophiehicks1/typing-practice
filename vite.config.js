import { defineConfig } from "vite";

// Vite doubles as the dev server, the production bundler, and (via Vitest,
// which reads this file) the test runner config. Keeping everything here means
// there is a single source of truth for how the project is built and tested.
export default defineConfig({
  // Relative base so the built site works from any sub-path (e.g. GitHub Pages).
  base: "./",
  build: {
    outDir: "dist",
    target: "es2018",
  },
  test: {
    // Unit tests are plain Node by default; suites that touch the DOM opt in
    // with a `// @vitest-environment jsdom` comment at the top of the file.
    environment: "node",
    include: ["test/**/*.test.js"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.js"],
      exclude: ["src/main.js", "src/ui/**"],
    },
  },
});
