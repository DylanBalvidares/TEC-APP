import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { Rol } from "../src/db/models/index.js";
import {
  esRolSistema,
  anotarEsSistema,
  IDS_ROLES_SISTEMA,
  obtenerTodosRoles,
} from "../src/modules/usuarios/roles-controller.js";

after(cerrarServidor);

test("IDS_ROLES_SISTEMA contiene los 8 roles del seed", () => {
  assert.deepEqual([...IDS_ROLES_SISTEMA].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("esRolSistema es true para id 1-8 y false para el resto", () => {
  for (let id = 1; id <= 8; id++) {
    assert.equal(esRolSistema({ id_rol: id }), true);
  }
  assert.equal(esRolSistema({ id_rol: "3" }), true);
  assert.equal(esRolSistema({ id_rol: 9 }), false);
  assert.equal(esRolSistema({ id_rol: 12 }), false);
  assert.equal(esRolSistema(null), false);
  assert.equal(esRolSistema({}), false);
});

test("anotarEsSistema propaga a toJSON en instancias Sequelize", () => {
  const sistema = Rol.build({ id_rol: 1, nombre_rol: "alumno" });
  anotarEsSistema(sistema);
  assert.equal(sistema.toJSON().es_sistema, true);

  const comun = Rol.build({ id_rol: 9, nombre_rol: "externo" });
  anotarEsSistema(comun);
  assert.equal(comun.toJSON().es_sistema, false);
});

test("anotarEsSistema funciona en objetos planos", () => {
  assert.equal(anotarEsSistema({ id_rol: 2 }).es_sistema, true);
  assert.equal(anotarEsSistema({ id_rol: 12 }).es_sistema, false);
});

test("obtenerTodosRoles devuelve la lista anotada", async (t) => {
  t.mock.method(Rol, "findAll", async () => [
    Rol.build({ id_rol: 1, nombre_rol: "alumno" }),
    Rol.build({ id_rol: 9, nombre_rol: "externo" }),
  ]);

  const roles = await obtenerTodosRoles();

  assert.equal(roles[0].toJSON().es_sistema, true);
  assert.equal(roles[1].toJSON().es_sistema, false);
});

test("GET /api/usuarios/roles expone es_sistema", async (t) => {
  mockearPermisosDeRol(t, { [ROLES.ROOT]: ["root_gestionar_roles"] });
  t.mock.method(Rol, "findAll", async () => [
    Rol.build({ id_rol: 1, nombre_rol: "alumno" }),
    Rol.build({ id_rol: 9, nombre_rol: "externo" }),
  ]);

  const srv = await obtenerServidor();
  const res = await srv.request("GET", "/api/usuarios/roles", {
    token: token({ id_rol: ROLES.ROOT }),
  });

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data));
  assert.equal(
    res.data.find((r) => r.id_rol === 1).es_sistema,
    true,
  );
  assert.equal(
    res.data.find((r) => r.id_rol === 9).es_sistema,
    false,
  );
});
