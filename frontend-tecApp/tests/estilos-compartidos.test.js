import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Q4 — Los tokens compartidos viven en src/assets/admin-shared.css
 * (importado global en main.js). Las vistas NO deben re-declarar una copia
 * exacta: con <style scoped> el duplicado gana por especificidad y el
 * compartido deja de ser fuente única. Los overrides intencionales
 * (valores distintos, ej. Overview con .metrics de 4 columnas) sí están
 * permitidos: este test solo falla ante cuerpos idénticos al compartido.
 */

const DIR_VISTAS = path.resolve(
  process.cwd(),
  "src/components/administrador/views",
);
const COMPARTIDO = path.resolve(process.cwd(), "src/assets/admin-shared.css");

const FAMILIAS = [
  ".tb-btn",
  ".error-banner",
  ".metrics",
  ".metric-card",
  ".metric-label",
  ".metric-value",
  ".metric-badge",
  ".badge-",
  ".status-pill",
  ".sp-",
];

function esToken(selector) {
  if (selector.startsWith("@keyframes")) return true;
  return FAMILIAS.some((f) => selector === f || selector.startsWith(f));
}

function normalizar(s) {
  return s.replace(/\s+/g, " ").trim();
}

// Divide reglas de nivel superior con balanceo de llaves.
function reglasTop(css) {
  const limpio = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  let i = 0;
  while (i < limpio.length) {
    const j = limpio.indexOf("{", i);
    if (j < 0) break;
    const selector = limpio
      .slice(i, j)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .join(", ");
    let profundidad = 1;
    let k = j + 1;
    while (k < limpio.length && profundidad > 0) {
      if (limpio[k] === "{") profundidad += 1;
      else if (limpio[k] === "}") profundidad -= 1;
      k += 1;
    }
    out.push({ selector, cuerpo: limpio.slice(j + 1, k - 1) });
    i = k;
  }
  return out;
}

function estilosDe(vista) {
  const texto = fs.readFileSync(path.join(DIR_VISTAS, vista), "utf8");
  return [...texto.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
}

function mapaCompartido() {
  const css = fs.readFileSync(COMPARTIDO, "utf8");
  const mapa = new Map();
  for (const { selector, cuerpo } of reglasTop(css)) {
    if (!esToken(selector)) continue;
    if (!mapa.has(selector)) mapa.set(selector, new Set());
    mapa.get(selector).add(normalizar(cuerpo));
  }
  return mapa;
}

function duplicadosEn(vista, compartido) {
  const dups = [];
  for (const bloque of estilosDe(vista)) {
    for (const { selector, cuerpo } of reglasTop(bloque)) {
      if (!esToken(selector)) continue;
      if (compartido.has(selector) && compartido.get(selector).has(normalizar(cuerpo))) {
        dups.push(selector);
      }
    }
  }
  return dups;
}

describe("estilos compartidos del panel admin", () => {
  it("admin-shared.css define los tokens esperados", () => {
    const compartido = mapaCompartido();
    expect(compartido.has("@keyframes fadeIn")).toBe(true);
    expect(compartido.has(".metrics")).toBe(true);
    expect(compartido.has(".metric-card")).toBe(true);
    expect(compartido.has(".tb-btn")).toBe(true);
    expect(compartido.has(".error-banner")).toBe(true);
    expect(compartido.has(".badge-green")).toBe(true);
  });

  it("ninguna vista re-declara una copia exacta de un token compartido", () => {
    const compartido = mapaCompartido();
    const vistas = fs.readdirSync(DIR_VISTAS).filter((f) => f.endsWith(".vue"));
    expect(vistas.length).toBeGreaterThan(0);
    const hallazgos = [];
    for (const vista of vistas) {
      for (const selector of duplicadosEn(vista, compartido)) {
        hallazgos.push(`${vista} :: ${selector}`);
      }
    }
    expect(hallazgos).toEqual([]);
  });
});
