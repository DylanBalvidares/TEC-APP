import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { fila } from "./helpers/crud.js";
import Rol from "../src/db/models/roles-model.js";
import { Usuario } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  crearRol,
  modificarRol,
  eliminarRol,
  obtenerTodosRoles,
} from "../src/modules/usuarios/roles-controller.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

const rolNuevo = () => fila({ id_rol: 9, nombre_rol: "Auxiliar" });

test("crearRol valida nombre, duplicados y anota es_sistema", async (t) => {
  await assert.rejects(crearRol({}), /obligatorio/);
  await assert.rejects(crearRol({ nombre_rol: "x".repeat(51) }), /superar/);

  t.mock.method(Rol, "findOne", async () => fila({ id_rol: 3 }));
  await assert.rejects(crearRol({ nombre_rol: "Profe" }), /Ya existe/);

  t.mock.method(Rol, "findOne", async () => null);
  t.mock.method(Rol, "create", async (datos) => fila({ id_rol: 9, ...datos }));
  const rol = await crearRol({ nombre_rol: "  Auxiliar " });
  assert.equal(rol.nombre_rol, "Auxiliar");
  assert.equal(rol.es_sistema, false);
});

test("modificarRol protege roles del sistema y duplicados", async (t) => {
  await assert.rejects(modificarRol(null, { nombre_rol: "X" }), /obligatorio/);

  t.mock.method(Rol, "findByPk", async () => null);
  await assert.rejects(modificarRol(99, { nombre_rol: "X" }), /No se encontró/);

  t.mock.method(Rol, "findByPk", async () => fila({ id_rol: 3 }));
  await assert.rejects(modificarRol(3, { nombre_rol: "X" }), /sistema/);

  t.mock.method(Rol, "findByPk", async () => fila({ id_rol: 9, update: async () => [1] }));
  t.mock.method(Rol, "findOne", async () => fila({ id_rol: 10 }));
  await assert.rejects(modificarRol(9, { nombre_rol: "Otro" }), /Ya existe/);

  t.mock.method(Rol, "findOne", async () => null);
  const rol = await modificarRol(9, { nombre_rol: "Auxiliar Nuevo" });
  assert.equal(rol.es_sistema, false);
});

test("eliminarRol protege sistema, con usuarios y 404", async (t) => {
  await assert.rejects(eliminarRol(null), /obligatorio/);

  t.mock.method(Rol, "findByPk", async () => null);
  await assert.rejects(eliminarRol(99), /No se encontró/);

  t.mock.method(Rol, "findByPk", async () => fila({ id_rol: 8 }));
  await assert.rejects(eliminarRol(8), /sistema/);

  t.mock.method(Rol, "findByPk", async () => fila({ id_rol: 9 }));
  t.mock.method(Usuario, "count", async () => 2);
  await assert.rejects(eliminarRol(9), /usuarios asignados/);

  t.mock.method(Usuario, "count", async () => 0);
  const res = await eliminarRol(9);
  assert.equal(res.ok, true);
});

test("obtenerTodosRoles anota es_sistema y 404 sin filas", async (t) => {
  t.mock.method(Rol, "findAll", async () => []);
  await assert.rejects(obtenerTodosRoles(), /No se encontraron/);

  t.mock.method(Rol, "findAll", async () => [
    fila({ id_rol: 1 }),
    fila({ id_rol: 9 }),
  ]);
  const roles = await obtenerTodosRoles();
  assert.deepEqual(roles.map((r) => r.es_sistema), [true, false]);
});

test("rutas /roles exigen root_gestionar_roles en escritura", async (t) => {
  // Un solo mock de findByPk: permisos (con include) y resto null.
  const permisos = { [ROLES.ROOT]: ["root_gestionar_roles"] };
  t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) {
      const lista = (permisos[Number(id)] || []).map((nombre_permiso) => ({
        nombre_permiso,
      }));
      return { toJSON: () => ({ id_rol: Number(id), permisos: lista }) };
    }
    return null;
  });
  t.mock.method(Rol, "findAll", async () => [fila({ id_rol: 1 })]);
  t.mock.method(Rol, "findOne", async () => null);
  t.mock.method(Rol, "create", async (datos) => rolNuevo());
  const srv = await obtenerServidor();

  const sinToken = await srv.request("GET", "/api/usuarios/roles");
  assert.equal(sinToken.status, 401);

  const sinPermiso = await srv.request("POST", "/api/usuarios/roles", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
    body: { nombre_rol: "Auxiliar" },
  });
  assert.equal(sinPermiso.status, 403);

  const creado = await srv.request("POST", "/api/usuarios/roles", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { nombre_rol: "Auxiliar" },
  });
  assert.equal(creado.status, 201);

  const listado = await srv.request("GET", "/api/usuarios/roles", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(listado.status, 200);
});
