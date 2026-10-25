import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");

describe("título de la pestaña", () => {
  it("usa Tec-app en lugar de Gestión Escolar", () => {
    expect(html).toMatch(/<title>\s*Tec-app\s*<\/title>/i);
    expect(html).not.toMatch(/<title>[^<]*Gestión Escolar[^<]*<\/title>/i);
  });
});
