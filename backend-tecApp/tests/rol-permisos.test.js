import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas } from "./helpers/crud.js";
import Rol from "../src/db/models/roles-model.js";
import Permiso from "../src/db/models/permisos-model.js";
import {
  invalidarCachePermisos,
  tamanoCachePermisos,
} from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerPermisosDeRolPorId,
  obtenerTodosPermisos,
  asignarPermisosARol,
} from "../src/modules/usuarios/rol-permisos-controller.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

const PERMISOS_ROOT = ["root_gestionar_permisos"];

// Un solo mock de Rol.findByPk: permisos (con include) y rol plano.
function mockearRol(t, permisosPorRol = {}) {
  return t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) {
      const lista = (permisosPorRol[Number(id)] || []).map((nombre_permiso) => ({
        nombre_permiso,
      }));
      return { toJSON: () => ({ id_rol: Number(id), permisos: lista }) };
    }
    return fila({ id_rol: Number(id), nombre_rol: "Auxiliar" });
  });
}

test("obtenerTodosPermisos ordena y 404 sin filas", async (t) => {
  const buscar = t.mock.method(Permiso, "findAll", async () => []);
  await assert.rejects(obtenerTodosPermisos(), /No se encontraron/);
  assert.deepEqual(buscar.mock.calls[0].arguments[0].order, [
    ["nombre_permiso", "ASC"],
  ]);

  t.mock.method(Permiso, "findAll", async () => filas([{ id_permiso: 1 }]));
  assert.equal((await obtenerTodosPermisos()).length, 1);
});

test("obtenerPermisosDeRolPorId devuelve la lista del rol", async (t) => {
  mockearRol(t, { 9: ["a_ver", "a_crear"] });
  assert.deepEqual(await obtenerPermisosDeRolPorId(9), ["a_ver", "a_crear"]);
});

test("asignarPermisosARol valida, deduce e invalida la cache", async (t) => {
  await assert.rejects(asignarPermisosARol(null, []), /obligatorio/);
  await assert.rejects(asignarPermisosARol(9, "no-lista"), /obligatoria/);

  t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) return { toJSON: () => ({ id_rol: 9, permisos: [] }) };
    return null;
  });
  await assert.rejects(asignarPermisosARol(99, []), /No se encontró/);
});

test("asignarPermisosARol rechaza ids invalidos y confirma", async (t) => {
  t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) return { toJSON: () => ({ id_rol: 9, permisos: [] }) };
    return fila({ id_rol: 9, setPermisos: async () => true });
  });
  t.mock.method(Permiso, "findAll", async () => [{ id_permiso: 1 }]);
  await assert.rejects(asignarPermisosARol(9, [1, 2]), /inválidos/);

  t.mock.method(Permiso, "findAll", async () => [{ id_permiso: 1 }, { id_permiso: 2 }]);
  // Llena la cache para verificar invalidación.
  await obtenerPermisosDeRolPorId(9);
  const res = await asignarPermisosARol(9, [1, 1, 2]);
  assert.equal(res.ok, true);
  assert.equal(tamanoCachePermisos(), 0);
});

test("rutas /permisos: lectura, 400 sin id y asignacion", async (t) => {
  mockearRol(t, { [ROLES.ROOT]: PERMISOS_ROOT });
  t.mock.method(Permiso, "findAll", async (opciones) => {
    if (opciones?.order) return filas([{ id_permiso: 1, nombre_permiso: "a" }]);
    return [{ id_permiso: 1 }, { id_permiso: 2 }];
  });
  const srv = await obtenerServidor();

  const sinToken = await srv.request("GET", "/api/usuarios/permisos/all");
  assert.equal(sinToken.status, 401);

  const sinPermiso = await srv.request("GET", "/api/usuarios/permisos/all", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
  });
  assert.equal(sinPermiso.status, 403);

  const catalogo = await srv.request("GET", "/api/usuarios/permisos/all", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(catalogo.status, 200);

  const sinId = await srv.request("GET", "/api/usuarios/permisos", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(sinId.status, 400);

  const porRol = await srv.request("GET", "/api/usuarios/permisos/9", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(porRol.status, 200);

  const asignar = await srv.request("PUT", "/api/usuarios/permisos/9", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { permisos: [1, 2] },
  });
  assert.equal(asignar.status, 200);
  assert.equal(asignar.data.ok, true);
});
