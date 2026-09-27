import { describe, it, expect } from "vitest";

describe("infraestructura de tests", () => {
  it("ejecuta aserciones básicas", () => {
    expect(1 + 1).toBe(2);
  });

  it("tiene DOM disponible (jsdom)", () => {
    const el = document.createElement("div");
    el.className = "test";
    document.body.appendChild(el);
    expect(document.querySelector(".test")).toBeTruthy();
  });
});
