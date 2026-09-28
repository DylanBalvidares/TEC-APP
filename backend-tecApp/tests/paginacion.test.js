import { test } from "node:test";
import assert from "node:assert/strict";

import {
  pidePaginacion,
  parsearPaginacion,
  respuestaPaginada,
} from "../src/utils/paginacion.js";

const COLUMNAS = ["apellido", "nombre", "dni", "estado"];

test("pidePaginacion solo con page/limit presentes", () => {
  assert.equal(pidePaginacion({}), false);
  assert.equal(pidePaginacion({ q: "ana" }), false);
  assert.equal(pidePaginacion({ sort: "apellido" }), false);
  assert.equal(pidePaginacion({ page: "2" }), true);
  assert.equal(pidePaginacion({ limit: "10" }), true);
});

test("valores por defecto sin parametros", () => {
  assert.deepEqual(parsearPaginacion({}, { columnas: COLUMNAS }), {
    page: 1,
    limit: 20,
    offset: 0,
    q: "",
    sort: null,
    order: "ASC",
  });
});

test("calcula offset y normaliza order", () => {
  const r = parsearPaginacion(
    { page: "3", limit: "10", order: "DESC" },
    { columnas: COLUMNAS },
  );
  assert.equal(r.offset, 20);
  assert.equal(r.order, "DESC");
});

test("recorta q a 100 caracteres", () => {
  const r = parsearPaginacion({ page: "1", q: `  ${"x".repeat(200)}  ` }, { columnas: COLUMNAS });
  assert.equal(r.q.length, 100);
});

test("resuelve alias de columna", () => {
  const r = parsearPaginacion({ sort: "curso" }, { columnas: COLUMNAS.concat("id_curso"), alias: { curso: "id_curso" } });
  assert.equal(r.sort, "id_curso");
});

test("rechaza page/limit invalidos", () => {
  for (const query of [{ page: "0" }, { page: "-1" }, { page: "abc" }, { page: "1.5" }]) {
    assert.throws(() => parsearPaginacion(query, { columnas: COLUMNAS }), /page inválido/);
  }
  for (const query of [{ limit: "0" }, { limit: "101" }, { limit: "abc" }]) {
    assert.throws(() => parsearPaginacion(query, { columnas: COLUMNAS }), /limit inválido/);
  }
});

test("rechaza sort fuera de la allowlist y order desconocido", () => {
  assert.throws(
    () => parsearPaginacion({ sort: "password" }, { columnas: COLUMNAS }),
    /sort inválido/,
  );
  assert.throws(
    () => parsearPaginacion({ order: "sideways" }, { columnas: COLUMNAS }),
    /order inválido/,
  );
});

test("respuestaPaginada arma el contrato uniforme", () => {
  assert.deepEqual(
    respuestaPaginada({ filas: [1, 2], total: 50, page: 2, limit: 10 }),
    { data: [1, 2], total: 50, page: 2, limit: 10 },
  );
});
