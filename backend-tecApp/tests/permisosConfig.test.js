import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalizarListaPermisos,
  SOLO_AUTENTICADO,
} from "../src/utils/permisosConfig.js";

test("SOLO_AUTENTICADO produce una lista vacía (sólo autenticación)", () => {
  assert.deepEqual(normalizarListaPermisos(SOLO_AUTENTICADO), []);
});

test("un permiso string se normaliza a una lista de un elemento", () => {
  assert.deepEqual(normalizarListaPermisos("biblio_ver_recursos"), [
    "biblio_ver_recursos",
  ]);
});

test("los strings con espacios se recortan", () => {
  assert.deepEqual(normalizarListaPermisos("  root_ver_logs_sistema  "), [
    "root_ver_logs_sistema",
  ]);
});

test("un string vacío es configuración inválida (null)", () => {
  assert.equal(normalizarListaPermisos(""), null);
  assert.equal(normalizarListaPermisos("   "), null);
});

test("un array de permisos se conserva y se recorta", () => {
  assert.deepEqual(
    normalizarListaPermisos(["administrativo_ver_reportes", " root_eliminar_cualquier_contenido "]),
    ["administrativo_ver_reportes", "root_eliminar_cualquier_contenido"],
  );
});

test("un array filtra elementos inválidos", () => {
  assert.deepEqual(normalizarListaPermisos(["valido", null, 42, "", "  "]), [
    "valido",
  ]);
});

test("un array sin permisos válidos es configuración inválida (fail-closed)", () => {
  assert.equal(normalizarListaPermisos([]), null);
  assert.equal(normalizarListaPermisos([null, 3, ""]), null);
});

test("valores no soportados son configuración inválida (fail-closed)", () => {
  assert.equal(normalizarListaPermisos(undefined), null);
  assert.equal(normalizarListaPermisos(null), null);
  assert.equal(normalizarListaPermisos(42), null);
  assert.equal(normalizarListaPermisos({ permiso: "x" }), null);
});
