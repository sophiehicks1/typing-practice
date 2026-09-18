/**
 * Entry point. Loads global styles and boots the app controller once the DOM is
 * ready. Everything else lives in `src/core` (pure logic), `src/content`
 * (topics), and `src/ui` (DOM glue).
 */
import "./styles.css";
import { startApp } from "./ui/app.js";

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startApp);
} else {
  startApp();
}
