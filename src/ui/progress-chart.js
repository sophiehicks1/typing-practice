/**
 * Progress chart -- draws recent WPM scores (dots) and their smoothed average
 * (line) as an inline SVG, with a hover/tap crosshair and tooltip. All geometry
 * comes from core/history.js; this module only builds DOM.
 */
import { chartLayout, CHART_WINDOW } from "../core/history.js";

const SVG_NS = "http://www.w3.org/2000/svg";
const WIDTH = 320;
const HEIGHT = 150;
const PAD = { top: 10, right: 10, bottom: 10, left: 30 };

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, String(value));
  return el;
}

const toPath = (points) =>
  points.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");

export function createProgressChart(container) {
  return {
    /**
     * Render the chart for a history (oldest first). Only the most recent
     * {@link CHART_WINDOW} results are shown.
     * @param {import('../core/history.js').HistoryEntry[]} history
     */
    render(history) {
      container.textContent = "";
      const recent = history.slice(-CHART_WINDOW);
      const firstRun = history.length - recent.length + 1;

      const title = document.createElement("div");
      title.className = "chart-title";
      title.textContent = "Your progress";
      container.appendChild(title);

      if (recent.length < 2) {
        const empty = document.createElement("p");
        empty.className = "chart-empty";
        empty.textContent = "Finish another test to start tracking your progress.";
        container.appendChild(empty);
        return;
      }

      const layout = chartLayout(
        recent.map((e) => e.wpm),
        { width: WIDTH, height: HEIGHT, pad: PAD },
      );
      const last = layout.smoothed[layout.smoothed.length - 1];

      const legend = document.createElement("div");
      legend.className = "chart-legend";
      legend.innerHTML =
        '<span><i class="key key--raw"></i>Each test</span>' +
        '<span><i class="key key--avg"></i>Smoothed average</span>';
      container.appendChild(legend);

      const wrap = document.createElement("div");
      wrap.className = "chart-wrap";
      container.appendChild(wrap);

      const svg = svgEl("svg", {
        viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
        class: "chart",
        role: "img",
        "aria-label":
          `WPM over your last ${recent.length} tests. ` +
          `Smoothed average now ${Math.round(last.value)} WPM.`,
      });

      layout.ticks.forEach((tick) => {
        svg.appendChild(
          svgEl("line", {
            x1: PAD.left,
            x2: WIDTH - PAD.right,
            y1: tick.y,
            y2: tick.y,
            class: tick.value === 0 ? "axis" : "grid",
          }),
        );
        const label = svgEl("text", { x: PAD.left - 6, y: tick.y + 4, class: "tick" });
        label.textContent = String(tick.value);
        svg.appendChild(label);
      });

      layout.raw.forEach((p) => {
        svg.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 4, class: "dot" }));
      });
      svg.appendChild(svgEl("path", { d: toPath(layout.smoothed), class: "avg" }));
      svg.appendChild(svgEl("circle", { cx: last.x, cy: last.y, r: 4.5, class: "avg-end" }));

      // Hover layer: crosshair + highlighted point, driven by the nearest run.
      const cross = svgEl("line", {
        y1: PAD.top,
        y2: HEIGHT - PAD.bottom,
        class: "cross",
        visibility: "hidden",
      });
      const focus = svgEl("circle", { r: 5, class: "focus", visibility: "hidden" });
      svg.appendChild(cross);
      svg.appendChild(focus);
      wrap.appendChild(svg);

      const tip = document.createElement("div");
      tip.className = "chart-tip";
      tip.hidden = true;
      wrap.appendChild(tip);

      const show = (event) => {
        const box = svg.getBoundingClientRect();
        if (!box.width) return;
        const x = ((event.clientX - box.left) / box.width) * WIDTH;
        let i = 0;
        layout.raw.forEach((p, j) => {
          if (Math.abs(p.x - x) < Math.abs(layout.raw[i].x - x)) i = j;
        });
        const raw = layout.raw[i];
        cross.setAttribute("x1", raw.x);
        cross.setAttribute("x2", raw.x);
        focus.setAttribute("cx", raw.x);
        focus.setAttribute("cy", raw.y);
        cross.setAttribute("visibility", "visible");
        focus.setAttribute("visibility", "visible");
        tip.innerHTML =
          `<b>Test ${firstRun + i}</b>` +
          `<span>${raw.value} WPM</span>` +
          `<span>avg ${Math.round(layout.smoothed[i].value)}</span>`;
        tip.hidden = false;
        const left = (raw.x / WIDTH) * 100;
        tip.style.left = `${left}%`;
        tip.style.transform = `translateX(${left > 60 ? "-100%" : left < 40 ? "0" : "-50%"})`;
      };
      const hide = () => {
        cross.setAttribute("visibility", "hidden");
        focus.setAttribute("visibility", "hidden");
        tip.hidden = true;
      };
      svg.addEventListener("pointermove", show);
      svg.addEventListener("pointerdown", show);
      svg.addEventListener("pointerleave", hide);
    },
  };
}
