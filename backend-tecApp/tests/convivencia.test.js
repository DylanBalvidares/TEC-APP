import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { Alumno } from "../src/db/models/index.js";
import Sancion from "../src/db/models/sancion-model.js";
import Observacion from "../src/db/models/observacion-model.js";
import {
  visibilidadConvivencia,
  VISIBILIDAD,
} from "../src/utils/convivencia.js";
import { crearSancion } from "../src/modules/academico/convivencia-controller.js";

after(cerrarServidor);

test("visibilidadConvivencia por rol", () => {
  assert.equal(visibilidadConvivencia({ id_rol: 8, esRoot: true }), VISIBILIDAD.TODO);
  assert.equal(visibilidadConvivencia({ id_rol: 4 }), VISIBILIDAD.TODO);
  assert.equal(visibilidadConvivencia({ id_rol: 7 }), VISIBILIDAD.TODO);
  assert.equal(visibilidadConvivencia({ id_rol: 3 }), VISIBILIDAD.PROPIO);
  assert.equal(visibilidadConvivencia({ id_rol: 6 }), VISIBILIDAD.PROPIO);
  assert.equal(visibilidadConvivencia({ id_rol: 1 }), VISIBILIDAD.PROPIO);
  assert.equal(visibilidadConvivencia({ id_rol: 5 }), VISIBILIDAD.NADA);
  assert.equal(visibilidadConvivencia({}), VISIBILIDAD.NADA);
});

test("crearSancion valida tipo y alumno, y rechaza lo ajeno", async (t) => {
  t.mock.method(Alumno, "findByPk", async () => ({ id_alumno: 2 }));
  const crear = t.mock.method(Sancion, "create", async (d) => ({ id_sancion: 1, ...d }));
  const preceptor = { id_usuario: 9, id_rol: 4, esRoot: false };

  await assert.rejects(
    crearSancion(preceptor, { id_alumno: 2, tipo: "expulsion", motivo: "x" }),
    /Tipo inválido/,
  );
  const ok = await crearSancion(preceptor, {
    id_alumno: 2,
    tipo: "apercibimiento",
    motivo: "Llegada tarde reiterada",
  });
  assert.equal(ok.id_sancion, 1);
  assert.equal(crear.mock.calls[0].arguments[0].registrado_por, 9);

  await assert.rejects(
    crearSancion({ id_usuario: 1, id_rol: 3, esRoot: false, id_alumno: 9 }, {
      id_alumno: 2,
      tipo: "apercibimiento",
      motivo: "x",
    }),
    /propio legajo/,
  );
});

test("rutas de convivencia: 403 a lo ajeno, CRUD con permiso", async (t) => {
  t.mock.method(Alumno, "findByPk", async () => ({ id_alumno: 2 }));
  t.mock.method(Sancion, "findAll", async () => [{ id_sancion: 1 }]);
  t.mock.method(Sancion, "create", async (d) => ({ id_sancion: 1, ...d }));
  t.mock.method(Sancion, "findByPk", async () => null);
  t.mock.method(Observacion, "findAll", async () => []);
  mockearPermisosDeRol(t, {
    [ROLES.PRECEPTOR]: ["preceptor_ver_sanciones", "preceptor_gestionar_sanciones"],
  });
  const srv = await obtenerServidor();
  const preceptor = token({ id_rol: ROLES.PRECEPTOR });

  const lista = await srv.request("GET", "/api/academico/sanciones", { token: preceptor });
  assert.equal(lista.status, 200);

  const alta = await srv.request("POST", "/api/academico/sanciones", {
    token: preceptor,
    body: { id_alumno: 2, tipo: "amonestacion", motivo: "Falta grave" },
  });
  assert.equal(alta.status, 201);

  const borrarInexistente = await srv.request("DELETE", "/api/academico/sanciones/999", {
    token: preceptor,
  });
  assert.equal(borrarInexistente.status, 404);
});
