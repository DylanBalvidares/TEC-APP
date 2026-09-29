import { test } from "node:test";
import assert from "node:assert/strict";

import { Rol } from "../src/db/models/index.js";
import {
  obtenerPermisosDeRol,
  invalidarCachePermisos,
} from "../src/middlewares/comprobarPermisos.js";

function mockearRol(t, permisos) {
  return t.mock.method(Rol, "findByPk", async () => ({
    toJSON: () => ({ id_rol: 3, permisos: permisos.map((nombre_permiso) => ({ nombre_permiso })) }),
  }));
}

test("la segunda llamada no consulta el modelo (cache)", async (t) => {
  invalidarCachePermisos();
  const buscar = mockearRol(t, ["a_ver"]);

  assert.deepEqual(await obtenerPermisosDeRol(3), ["a_ver"]);
  assert.deepEqual(await obtenerPermisosDeRol(3), ["a_ver"]);
  assert.equal(buscar.mock.calls.length, 1);
});

test("invalidarCachePermisos por rol y total", async (t) => {
  invalidarCachePermisos();
  const buscar = mockearRol(t, ["a_ver"]);

  await obtenerPermisosDeRol(3);
  invalidarCachePermisos(4);
  await obtenerPermisosDeRol(3);
  assert.equal(buscar.mock.calls.length, 1);

  invalidarCachePermisos(3);
  await obtenerPermisosDeRol(3);
  assert.equal(buscar.mock.calls.length, 2);

  invalidarCachePermisos();
  await obtenerPermisosDeRol(3);
  assert.equal(buscar.mock.calls.length, 3);
});
