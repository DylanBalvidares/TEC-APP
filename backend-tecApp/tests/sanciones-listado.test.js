import { test, after } from "node:test";
import assert from "node:assert/strict";

import { fila, filas } from "./helpers/crud.js";
import { Alumno } from "../src/db/models/index.js";
import Sancion from "../src/db/models/sancion-model.js";
import {
  listarSanciones,
  eliminarSancion,
} from "../src/modules/academico/convivencia-controller.js";

after(() => {});

const PRECEPTOR = { id_usuario: 4, id_rol: 4, id_alumno: null, esRoot: false };

test("listarSanciones exige alumno o ámbito total", async (t) => {
  await assert.rejects(listarSanciones({ id_rol: 6 }), /indicá un alumno/);

  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(listarSanciones(PRECEPTOR, { id_alumno: 99 }), /No se encontró/);

  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 2 }));
  const buscar = t.mock.method(Sancion, "findAll", async () => filas([{ id_sancion: 1 }]));
  assert.equal((await listarSanciones(PRECEPTOR, { id_alumno: 2 })).length, 1);
  assert.deepEqual(buscar.mock.calls[0].arguments[0].where, { id_alumno: 2 });
  assert.equal((await listarSanciones(PRECEPTOR)).length, 1);
});

test("eliminarSancion 404 o confirma con alcance", async (t) => {
  t.mock.method(Sancion, "findByPk", async () => null);
  await assert.rejects(eliminarSancion(PRECEPTOR, 99), /No se encontró/);

  t.mock.method(Sancion, "findByPk", async () =>
    fila({ id_sancion: 1, id_alumno: 2, destroy: async () => 1 }),
  );
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 2 }));
  const res = await eliminarSancion(PRECEPTOR, 1);
  assert.equal(res.ok, true);
});
