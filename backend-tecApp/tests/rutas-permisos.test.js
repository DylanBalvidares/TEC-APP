/**
 * Guardrail de autorización: cada registración `router.<verbo>("ruta", ...)`
 * en `src/modules/**\/*-router.js` debe declarar un permiso explícito
 * (`comprobarPermiso(`, `comprobarPermisos(` o `soloAutenticado`) en el mismo
 * bloque, o estar en la allowlist de rutas públicas con comentario.
 *
 * Hoy el árbol tiene rutas sin ninguno de los dos (cargos, GETs de comunidad,
 * login interno, validar-identidad). El test las lista siempre. La aserción
 * que las rechaza se activa con EXIGIR_PERMISOS=1, que es el gate de cierre de
 * S1–S5. Hasta entonces `npm test` sigue verde y este archivo documenta el bug.
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const MODULOS = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/modules",
);

/**
 * Rutas que NO llevan comprobarPermiso porque son el flujo público de auth.
 * Cualquier alta acá exige un comentario que diga por qué.
 */
const ALLOWLIST = new Set([
  // Credenciales: no hay sesión todavía.
  "src/modules/auth/auth-router.js POST /login",
  // Alta inicial: el usuario aún no existe.
  "src/modules/auth/auth-router.js POST /iniciar-registro",
  // Paso del registro: busca en el padrón antes de tener cuenta.
  "src/modules/auth/auth-router.js POST /buscar-en-padron",
  // Confirma el código enviado por mail durante el registro.
  "src/modules/auth/auth-router.js POST /verificar-codigo",
]);

const MARCADOR = /comprobarPermiso\(|comprobarPermisos\(|soloAutenticado/;
const REGISTRO =
  /(\w+)\.(get|post|put|patch|delete)\(\s*[\r\n]*\s*(["'`])([^"'`]+)\3/g;

function listarRouters(dir, acc = []) {
  for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
    const ruta = path.join(dir, entrada.name);
    if (entrada.isDirectory()) listarRouters(ruta, acc);
    else if (entrada.name.endsWith("-router.js")) acc.push(ruta);
  }
  return acc;
}

function rutaRelativa(archivo) {
  return path.relative(path.resolve(MODULOS, "../.."), archivo).replaceAll("\\", "/");
}

/**
 * Recorta el bloque de la registración: desde la llamada hasta el cierre del
 * callback en la misma profundidad de paréntesis, con tope para no tragarse
 * el archivo entero si el formato está roto.
 */
function bloqueDeRegistro(src, inicio) {
  let profundidad = 0;
  let vioApertura = false;
  const tope = Math.min(src.length, inicio + 2500);

  for (let i = inicio; i < tope; i++) {
    const c = src[i];
    if (c === "(") {
      profundidad++;
      vioApertura = true;
    } else if (c === ")") {
      profundidad--;
      if (vioApertura && profundidad === 0) return src.slice(inicio, i + 1);
    }
  }

  return src.slice(inicio, tope);
}

export function rutasSinPermisoExplicito() {
  const sinPermiso = [];

  for (const archivo of listarRouters(MODULOS)) {
    const src = fs.readFileSync(archivo, "utf8");
    const rel = rutaRelativa(archivo);
    REGISTRO.lastIndex = 0;

    let match;
    while ((match = REGISTRO.exec(src))) {
      const verbo = match[2].toUpperCase();
      const ruta = match[4];
      const clave = `${rel} ${verbo} ${ruta}`;
      if (ALLOWLIST.has(clave)) continue;

      const bloque = bloqueDeRegistro(src, match.index);
      if (!MARCADOR.test(bloque)) {
        const linea = src.slice(0, match.index).split("\n").length;
        sinPermiso.push(`${clave} (L${linea})`);
      }
    }
  }

  return sinPermiso.sort();
}

test("toda ruta de módulo declara permiso, soloAutenticado o está en la allowlist", () => {
  const sinPermiso = rutasSinPermisoExplicito();

  if (sinPermiso.length > 0) {
    console.error(
      `[rutas-permisos] ${sinPermiso.length} ruta(s) sin permiso explícito:\n` +
        sinPermiso.map((r) => `  - ${r}`).join("\n"),
    );
  }

  if (process.env.EXIGIR_PERMISOS === "1") {
    assert.deepEqual(
      sinPermiso,
      [],
      "Hay rutas sin comprobarPermiso/comprobarPermisos/soloAutenticado ni allowlist",
    );
    return;
  }

  // Hasta cerrar S1–S5 el hueco es conocido. No puede crecer en silencio:
  // si aparece una ruta nueva sin permiso, este número cambia y el test falla.
  assert.equal(
    sinPermiso.length,
    16,
    "Cambió la cantidad de rutas sin permiso. Si cerraste S1–S5, corré con EXIGIR_PERMISOS=1. Si agregaste una ruta, declarale permiso o allowlist.",
  );
});
