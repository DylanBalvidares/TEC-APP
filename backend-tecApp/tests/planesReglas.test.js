import { test } from "node:test";
import assert from "node:assert/strict";

import {
  admiteEdicionContenido,
  esAnioValido,
  esEstadoValido,
  normalizarFiltrosVigentes,
  validarCorrelativa,
} from "../src/utils/planesReglas.js";

test("año válido es entero 1-7", () => {
  assert.equal(esAnioValido(1), true);
  assert.equal(esAnioValido(7), true);
  assert.equal(esAnioValido("3"), true);
  assert.equal(esAnioValido(0), false);
  assert.equal(esAnioValido(8), false);
  assert.equal(esAnioValido(2.5), false);
  assert.equal(esAnioValido(null), false);
  assert.equal(esAnioValido("x"), false);
});

test("estados válidos del plan", () => {
  assert.equal(esEstadoValido("borrador"), true);
  assert.equal(esEstadoValido("vigente"), true);
  assert.equal(esEstadoValido("historico"), true);
  assert.equal(esEstadoValido("activo"), false);
  assert.equal(esEstadoValido(""), false);
});

test("solo borrador y vigente admiten edición de contenido", () => {
  assert.equal(admiteEdicionContenido("borrador"), true);
  assert.equal(admiteEdicionContenido("vigente"), true);
  assert.equal(admiteEdicionContenido("historico"), false);
});

test("correlativa válida no devuelve error", () => {
  assert.equal(
    validarCorrelativa({ mismoPlan: true, esDistinta: true, anioMateria: 3, anioReq: 2 }),
    null,
  );
  assert.equal(
    validarCorrelativa({ mismoPlan: true, esDistinta: true, anioMateria: 2, anioReq: 2 }),
    null,
  );
});

test("correlativa rechaza distinto plan, misma materia y año mayor", () => {
  assert.match(
    validarCorrelativa({ mismoPlan: false, esDistinta: true, anioMateria: 3, anioReq: 1 }),
    /mismo plan/,
  );
  assert.match(
    validarCorrelativa({ mismoPlan: true, esDistinta: false, anioMateria: 3, anioReq: 3 }),
    /sí misma/,
  );
  assert.match(
    validarCorrelativa({ mismoPlan: true, esDistinta: true, anioMateria: 2, anioReq: 3 }),
    /menor o igual/,
  );
});

test("normaliza filtros de vigentes y rechaza inválidos", () => {
  assert.deepEqual(normalizarFiltrosVigentes({}), { anio: null, idCurso: null });
  assert.deepEqual(normalizarFiltrosVigentes({ anio: "3", curso: "5" }), { anio: 3, idCurso: 5 });
  assert.throws(() => normalizarFiltrosVigentes({ anio: "9" }), /anio inválido/);
  assert.throws(() => normalizarFiltrosVigentes({ curso: "x" }), /curso inválido/);
});
