/**
 * Escáner compartido del guardrail de permisos: ubica cada registración
 * `router.<verbo>("ruta", ...)` en `src/modules/**\/*-router.js` que no declare
 * un permiso explícito ni esté en la allowlist de rutas públicas.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const DIR_TESTS = path.dirname(fileURLToPath(import.meta.url));
const MODULOS = path.resolve(DIR_TESTS, "../../src/modules");

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

const MARCADOR = /comprobarPermisos?\(|soloAutenticado|LECTURA_COMUNIDAD/;
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
  return path
    .relative(path.resolve(MODULOS, "../.."), archivo)
    .replaceAll("\\", "/");
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
