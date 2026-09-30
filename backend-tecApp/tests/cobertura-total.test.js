import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Guardrail de cobertura total (F5): una sola ejecución de `npm test` debe
 * verificar el íntegro funcionamiento del backend.
 *
 * - Capa unitaria: toda función exportada de controllers/services/utils es
 *   nombrada (invocada) por al menos un `tests/*.test.js`.
 * - Capa HTTP: toda ruta registrada en los routers es pedida por al menos un
 *   test (las funciones solo cubiertas por HTTP se acreditan a su ruta).
 *
 * Exclusiones deliberadas (no son comportamiento testeable por unidad):
 * - `export default` de clases (ErrorHandler) y consts UPPER_SNAKE.
 * - Middlewares (infra transversal, cubierta por el guardrail de permisos).
 * - TRANSITIVAS: invocadas solo dentro de otro módulo bajo test.
 */
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(RAIZ, "src");
const DIR_TESTS = path.join(RAIZ, "tests");

const TRANSITIVAS = {
  // mensajes-crud lo ejercita en modo stub (sin WHATSAPP_TOKEN no hay red).
  enviarWhatsapp: "tests/mensajes-crud.test.js (modo stub)",
};

function listarRelativo(dir, filtro) {
  const acc = [];
  for (const entrada of fs.readdirSync(path.join(SRC, dir), { withFileTypes: true })) {
    const rel = path.join(dir, entrada.name);
    if (entrada.isDirectory()) acc.push(...listarRelativo(rel, filtro));
    else if (filtro(entrada.name)) acc.push(rel);
  }
  return acc;
}

function funcionesExportadas(rel) {
  const src = fs.readFileSync(path.join(SRC, rel), "utf8");
  const nombres = new Set();
  for (const m of src.matchAll(/export\s+(?:async\s+)?function\s+([A-Za-z_]\w*)/g)) {
    nombres.add(m[1]);
  }
  for (const m of src.matchAll(/export\s*\{([^}]+)\}/g)) {
    for (const parte of m[1].split(",")) {
      const nombre = parte.trim().split(/\s+as\s+/).pop().trim();
      if (/^[a-z_]\w*$/.test(nombre)) nombres.add(nombre);
    }
  }
  for (const m of src.matchAll(/export\s+const\s+([a-z_]\w*)\s*=/g)) {
    nombres.add(m[1]);
  }
  return nombres;
}

function archivosTest() {
  return fs
    .readdirSync(DIR_TESTS)
    .filter((f) => f.endsWith(".test.js"))
    .map((f) => path.join(DIR_TESTS, f));
}

function bloqueDeRegistro(src, inicio) {
  let profundidad = 0;
  let vioApertura = false;
  const tope = Math.min(src.length, inicio + 4000);
  for (let i = inicio; i < tope; i++) {
    if (src[i] === "(") {
      profundidad++;
      vioApertura = true;
    } else if (src[i] === ")") {
      profundidad--;
      if (vioApertura && profundidad === 0) return src.slice(inicio, i + 1);
    }
  }
  return src.slice(inicio, tope);
}

function mapaRutas() {
  const app = fs.readFileSync(path.join(SRC, "app.js"), "utf8");
  const archivoRouter = {};
  for (const m of app.matchAll(/import\s+(\w+)\s+from\s+"(\.[^"]+)"\s*;/g)) {
    if (/router/i.test(m[1])) {
      archivoRouter[m[1]] =
        "src/" + m[2].replace(/^\.\//, "") + (m[2].endsWith(".js") ? "" : ".js");
    }
  }
  const rutas = [];
  for (const m of app.matchAll(/app\.use\("([^"]+)",[^;]*?(\w+Router)\s*\)\s*;/g)) {
    const [prefijo, nombre] = [m[1], m[2]];
    const rel = archivoRouter[nombre].replace(/^src\//, "");
    const src = fs.readFileSync(path.join(SRC, rel), "utf8");
    const patron = /\w+\.(get|post|put|patch|delete)\(\s*"([^"]+)"/g;
    let registro;
    while ((registro = patron.exec(src)) !== null) {
      const bloque = bloqueDeRegistro(src, registro.index);
      const llamadas = new Set();
      for (const c of bloque.matchAll(/(?:\w+\.)?([A-Za-z_]\w*)\s*\(/g)) {
        llamadas.add(c[1]);
      }
      rutas.push({
        metodo: registro[1].toUpperCase(),
        path: prefijo + registro[2],
        llamadas,
      });
    }
  }
  return rutas;
}

function patronRuta(path) {
  return new RegExp("^" + path.replace(/:[^/]+/g, "[^/]+") + "$");
}

test("toda función exportada está cubierta (unitario, ruta o transitiva)", () => {
  const fuentes = [
    ...listarRelativo("modules", (f) => f.endsWith("-controller.js")),
    path.join("modules", "comunidad", "comunidad-service.js"),
    ...listarRelativo("utils", (f) => f.endsWith(".js")),
  ];
  const universo = new Map();
  for (const rel of fuentes) {
    for (const nombre of funcionesExportadas(rel)) {
      if (!universo.has(nombre)) universo.set(nombre, []);
      universo.get(nombre).push(rel);
    }
  }

  const tests = archivosTest().map((f) => fs.readFileSync(f, "utf8"));
  const nombradas = new Set();
  for (const nombre of universo.keys()) {
    const rx = new RegExp(`\\b${nombre}\\b`);
    if (tests.some((src) => rx.test(src))) nombradas.add(nombre);
  }

  // Funciones acreditadas por su ruta HTTP.
  const rutas = mapaRutas();
  const porArchivo = tests.map((src) => ({
    metodos: new Set([...src.matchAll(/request\(\s*"([A-Z]+)"/g)].map((m) => m[1])),
    literales: [...src.matchAll(/"(\/api\/[^"]+)"/g)].map((m) => m[1].split("?")[0]),
  }));
  const porRuta = new Set();
  for (const ruta of rutas) {
    const rx = patronRuta(ruta.path);
    const pedida = porArchivo.some(
      (t) => t.metodos.has(ruta.metodo) && t.literales.some((lit) => rx.test(lit)),
    );
    if (pedida) {
      for (const nombre of ruta.llamadas) {
        if (universo.has(nombre)) porRuta.add(nombre);
      }
    }
  }

  const faltantes = [...universo.keys()].filter(
    (n) => !nombradas.has(n) && !porRuta.has(n) && !(n in TRANSITIVAS),
  );
  assert.deepEqual(
    faltantes.map((n) => `${n} (${universo.get(n).join(", ")})`),
    [],
  );
});

test("toda ruta registrada es pedida por la suite", () => {
  const rutas = mapaRutas();
  const tests = archivosTest().map((f) => fs.readFileSync(f, "utf8"));
  const porArchivo = tests.map((src) => ({
    metodos: new Set([...src.matchAll(/request\(\s*"([A-Z]+)"/g)].map((m) => m[1])),
    literales: [...src.matchAll(/"(\/api\/[^"]+)"/g)].map((m) => m[1].split("?")[0]),
  }));
  // El stream SSE se pide con fetch nativo (sin request()): cuenta como GET.
  for (const src of tests) {
    if (src.includes("/api/admin/eventos")) {
      porArchivo[tests.indexOf(src)].metodos.add("GET");
    }
  }

  const faltantes = rutas
    .filter((ruta) => {
      const rx = patronRuta(ruta.path);
      return !porArchivo.some(
        (t) => t.metodos.has(ruta.metodo) && t.literales.some((lit) => rx.test(lit)),
      );
    })
    .map((r) => `${r.metodo} ${r.path}`);
  assert.deepEqual([...new Set(faltantes)], []);
});
