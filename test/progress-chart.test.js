// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { createProgressChart } from "../src/ui/progress-chart.js";
import { loadHistory, recordResult } from "../src/ui/history-store.js";
import { CHART_WINDOW } from "../src/core/history.js";

const entry = (wpm) => ({ wpm, mode: "passage", duration: 30, at: 0 });

describe("progress chart", () => {
  let container;
  let chart;

  beforeEach(() => {
    container = document.createElement("div");
    chart = createProgressChart(container);
  });

  it("shows a prompt instead of a chart with fewer than two results", () => {
    chart.render([entry(30)]);
    expect(container.querySelector("svg")).toBeNull();
    expect(container.querySelector(".chart-empty")).not.toBeNull();
  });

  it("draws one dot per result plus the smoothed line", () => {
    chart.render([entry(30), entry(40), entry(35)]);
    expect(container.querySelectorAll("circle.dot")).toHaveLength(3);
    expect(container.querySelector("path.avg")).not.toBeNull();
    expect(container.querySelector(".chart-legend").textContent).toContain("Smoothed average");
  });

  it("only plots the most recent window of results", () => {
    const history = Array.from({ length: CHART_WINDOW + 10 }, (_, i) => entry(i));
    chart.render(history);
    expect(container.querySelectorAll("circle.dot")).toHaveLength(CHART_WINDOW);
  });

  it("re-renders cleanly", () => {
    chart.render([entry(30), entry(40)]);
    chart.render([entry(30), entry(40), entry(50)]);
    expect(container.querySelectorAll("svg")).toHaveLength(1);
    expect(container.querySelectorAll("circle.dot")).toHaveLength(3);
  });
});

describe("history store", () => {
  function memoryStorage() {
    const data = {};
    return {
      getItem: (k) => (k in data ? data[k] : null),
      setItem: (k, v) => {
        data[k] = v;
      },
    };
  }

  it("round-trips recorded results", () => {
    const storage = memoryStorage();
    let history = loadHistory(storage);
    expect(history).toEqual([]);
    history = recordResult(history, entry(42), storage);
    expect(loadHistory(storage)).toEqual([entry(42)]);
  });

  it("survives corrupt or unavailable storage", () => {
    const corrupt = { getItem: () => "{not json", setItem: () => {} };
    expect(loadHistory(corrupt)).toEqual([]);
    const broken = {
      getItem: () => {
        throw new Error("denied");
      },
      setItem: () => {
        throw new Error("full");
      },
    };
    expect(loadHistory(broken)).toEqual([]);
    expect(recordResult([], entry(10), broken)).toEqual([entry(10)]);
  });
});
