import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { Cargo } from "../src/db/models/index.js";
import { rutasSinPermisoExplicito } from "./helpers/rutas.js";

after(cerrarServidor);

const PERMISOS = {
  [ROLES.ALUMNO]: [],
  [ROLES.ADMINISTRATIVO]: ["administrativo_ver_cargos"],
  [ROLES.ROOT]: ["administrativo_ver_cargos", "root_gestionar_cargos"],
};

function mockearCargo(t) {
  t.mock.method(Cargo, "findAll", async () => [{ id_cargo: 1, nombre: "Preceptor" }]);
  t.mock.method(Cargo, "findByPk", async () => ({ id_cargo: 1, nombre: "Preceptor" }));
  t.mock.method(Cargo, "create", async (datos) => ({ id_cargo: 9, ...datos }));
  t.mock.method(Cargo, "update", async () => [1]);
  t.mock.method(Cargo, "destroy", async () => 1);
}

test("cargos: sin token responde 401", async () => {
  const srv = await obtenerServidor();
  const res = await srv.request("GET", "/api/academico/cargos");
  assert.equal(res.status, 401);
});

test("cargos: alumno autenticado responde 403 en lectura y escritura", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  const srv = await obtenerServidor();
  const alumno = token({ id_rol: ROLES.ALUMNO });

  const lectura = await srv.request("GET", "/api/academico/cargos", { token: alumno });
  const alta = await srv.request("POST", "/api/academico/cargos", {
    token: alumno,
    body: { nombre: "Nuevo" },
  });

  assert.equal(lectura.status, 403);
  assert.equal(alta.status, 403);
});

test("cargos: administrativo lee pero no crea", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  mockearCargo(t);
  const srv = await obtenerServidor();
  const admin = token({ id_rol: ROLES.ADMINISTRATIVO });

  const lectura = await srv.request("GET", "/api/academico/cargos", { token: admin });
  const alta = await srv.request("POST", "/api/academico/cargos", {
    token: admin,
    body: { nombre: "Nuevo" },
  });

  assert.equal(lectura.status, 200);
  assert.equal(alta.status, 403);
});

test("cargos: root lee, crea, edita y borra", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  mockearCargo(t);
  const srv = await obtenerServidor();
  const root = token({ id_rol: ROLES.ROOT });

  const lectura = await srv.request("GET", "/api/academico/cargos/1", { token: root });
  const alta = await srv.request("POST", "/api/academico/cargos", {
    token: root,
    body: { nombre: "Nuevo" },
  });
  const edicion = await srv.request("PATCH", "/api/academico/cargos/1", {
    token: root,
    body: { nombre: "Editado" },
  });
  const baja = await srv.request("DELETE", "/api/academico/cargos/1", { token: root });

  assert.equal(lectura.status, 200);
  assert.equal(alta.status, 201);
  assert.equal(edicion.status, 200);
  assert.equal(baja.status, 204);
});

test("el guardrail ya no marca rutas de cargos", () => {
  const deCargos = rutasSinPermisoExplicito().filter((r) => r.includes("cargos-router"));
  assert.deepEqual(deCargos, []);
});
