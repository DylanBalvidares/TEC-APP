import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import {
  Alumno,
  Profesor,
  Curso,
  Asistencia,
  Comunicado,
} from "../src/db/models/index.js";
import {
  obtenerMetricas,
  limpiarCacheMetricas,
} from "../src/modules/admin/metricas-controller.js";

after(cerrarServidor);

const instancia = (datos) => ({ ...datos, toJSON: () => ({ ...datos }) });

function mockearModelos() {
  Alumno.count = async () => 10;
  Profesor.count = async () => 5;
  Curso.count = async () => 3;
  Comunicado.count = async () => 7;
  Asistencia.findAll = async () => [
    instancia({ estado: "presente" }),
    instancia({ estado: "presente" }),
    instancia({ estado: "ausente" }),
    instancia({ estado: "tarde" }),
  ];
  Alumno.findAll = async () => [instancia({ id_alumno: 9, nombre: "Ana" })];
  Comunicado.findAll = async () => [
    instancia({ id_comunicado: 4, titulo: "Aviso" }),
  ];
}

test("obtenerMetricas agrega totales, asistencia y recientes", async () => {
  limpiarCacheMetricas();
  mockearModelos();

  const m = await obtenerMetricas();

  assert.equal(m.totales.alumnos, 10);
  assert.equal(m.totales.profesores, 5);
  assert.equal(m.totales.cursos, 3);
  assert.equal(m.totales.comunicados, 7);
  assert.deepEqual(
    { total: m.asistenciaHoy.total, presente: m.asistenciaHoy.presente },
    { total: 4, presente: 2 },
  );
  assert.equal(m.ultimosAlumnos.length, 1);
  assert.equal(m.comunicadosRecientes.length, 1);
  assert.equal(m.cache, false);
});

test("la segunda llamada usa la cache de 60 s", async () => {
  limpiarCacheMetricas();
  mockearModelos();

  await obtenerMetricas();
  Alumno.count = async () => {
    throw new Error("no debería consultar de nuevo");
  };
  const m = await obtenerMetricas();

  assert.equal(m.cache, true);
  assert.equal(m.totales.alumnos, 10);
  limpiarCacheMetricas();
});

test("GET /api/admin/metricas exige administrativo_ver_reportes", async (t) => {
  limpiarCacheMetricas();
  mockearModelos();
  mockearPermisosDeRol(t, {
    [ROLES.ADMINISTRATIVO]: ["administrativo_ver_reportes"],
    [ROLES.ROOT]: ["administrativo_ver_reportes"],
  });
  const srv = await obtenerServidor();

  const sinPermiso = await srv.request("GET", "/api/admin/metricas", {
    token: token({ id_rol: ROLES.ALUMNO }),
  });
  assert.equal(sinPermiso.status, 403);

  const admin = await srv.request("GET", "/api/admin/metricas", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
  });
  assert.equal(admin.status, 200);
  assert.equal(admin.data.ok, true);
  assert.equal(typeof admin.data.totales.alumnos, "number");
});
