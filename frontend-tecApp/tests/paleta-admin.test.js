import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = join(dirname(fileURLToPath(import.meta.url)), "..", "src");

function* archivosVue(dir) {
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) yield* archivosVue(ruta);
    else if (ruta.endsWith(".vue")) yield ruta;
  }
}

// Tokens usados en el admin (componentes + css compartido), excluyendo los
// que pertenecen a otros sistemas (style.css global, auth, etc.).
const ALCANCE = ["components/administrador", "components/ui", "assets/admin-shared.css"];
const EXTERNOS = new Set(["--color-primary", "--color-primary-dark"]);

function tokensUsados() {
  const usados = new Set();
  const patron = /var\(\s*(--[\w-]+)/g;
  const fuentes = [...archivosVue(join(SRC, "components/administrador"))];
  for (const ruta of archivosVue(join(SRC, "components/ui"))) fuentes.push(ruta);
  fuentes.push(join(SRC, "assets/admin-shared.css"));
  for (const ruta of fuentes) {
    const texto = readFileSync(ruta, "utf8");
    // Solo <style> en los .vue (el template/script no definen paleta).
    const css = ruta.endsWith(".vue")
      ? [...texto.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n")
      : texto;
    for (const m of css.matchAll(patron)) {
      if (ALCANCE.some((a) => ruta.includes(a)) && !EXTERNOS.has(m[1])) {
        usados.add(m[1]);
      }
    }
  }
  return usados;
}

function bloque(css, selector) {
  const inicio = css.indexOf(selector);
  if (inicio === -1) return "";
  const apertura = css.indexOf("{", inicio);
  let nivel = 0;
  for (let i = apertura; i < css.length; i++) {
    if (css[i] === "{") nivel++;
    if (css[i] === "}") {
      nivel--;
      if (nivel === 0) return css.slice(apertura, i);
    }
  }
  return "";
}

describe("paleta admin", () => {
  const css = readFileSync(join(SRC, "assets/admin-shared.css"), "utf8");
  const raiz = bloque(css, ":root");
  const oscuro = bloque(css, 'html[data-tema="oscuro"]');

  it("todo token usado en el admin está definido en :root", () => {
    const faltantes = [...tokensUsados()].filter((t) => !raiz.includes(`${t}:`));
    expect(faltantes).toEqual([]);
  });

  it("todo token del admin tiene valor en modo oscuro", () => {
    const faltantes = [...tokensUsados()].filter((t) => !oscuro.includes(`${t}:`));
    expect(faltantes).toEqual([]);
  });

  it("los componentes del chrome usan tokens en vez de fondo fijo claro", () => {
    const topbar = readFileSync(
      join(SRC, "components/administrador/views/Topbar.vue"),
      "utf8",
    );
    expect(topbar).not.toMatch(/\.topbar\s*{[^}]*background(-color)?:\s*#fff/);
    const sidebar = readFileSync(
      join(SRC, "components/administrador/views/Sidebar.vue"),
      "utf8",
    );
    expect(sidebar).toMatch(/\.nav-item\.active\s*{[^}]*var\(--nav-active-bg/);
  });
});
