// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { createPassageView } from "../src/ui/passage-view.js";
import { createSession } from "../src/core/engine.js";

describe("passage view", () => {
  let container;
  let view;

  beforeEach(() => {
    container = document.createElement("div");
    view = createPassageView(container);
  });

  it("renders one span per character", () => {
    view.mount("cat");
    expect(container.querySelectorAll("span")).toHaveLength(3);
    expect(container.textContent).toBe("cat");
  });

  it("marks the first character as current on mount", () => {
    view.mount("cat");
    expect(container.children[0].className).toBe("char--current");
  });

  it("reflects correct and incorrect typing", () => {
    view.mount("cat");
    const session = createSession("cat");
    session.setTyped("cX");
    view.update(session);
    expect(container.children[0].className).toBe("char--correct");
    expect(container.children[1].className).toBe("char--incorrect");
    expect(container.children[2].className).toBe("char--current");
  });

  it("clears state when characters are corrected", () => {
    view.mount("cat");
    const session = createSession("cat");
    session.setTyped("cX");
    view.update(session);
    session.setTyped("c");
    view.update(session);
    expect(container.children[1].className).toBe("char--current");
    expect(container.children[2].className).toBe("");
  });
});
