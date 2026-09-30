import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import { Asistencia } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerTodosAsistencias,
  obtenerTodosAsistenciasCurso,
  obtenerAsistencia,
  obtenerHistorialAsistencias,
  crearAsistencia,
  eliminarAsistencia,
  modificarAsistencia,
  guardarAsistenciasLote,
} from "../src/modules/academico/asistencias-controller.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

async function permisos(t, mapa) {
  const { Rol } = await import("../src/db/models/index.js");
  t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) {
      const lista = (mapa[Number(id)] || []).map((nombre_permiso) => ({
        nombre_permiso,
      }));
      return { toJSON: () => ({ id_rol: Number(id), permisos: lista }) };
    }
    return fila({ id_rol: Number(id) });
  });
}

const UNA = { id_alumno: 1, id_curso: 2, fecha: "2026-03-01", estado: "presente" };

test("lecturas: todas, por curso, por id e historial con filtros", async (t) => {
  t.mock.method(Asistencia, "findAll", async () => []);
  await assert.rejects(obtenerTodosAsistencias(), /No se encontraron/);
  await assert.rejects(obtenerTodosAsistenciasCurso(1), /No se encontraron/);

  t.mock.method(Asistencia, "findAll", async () => filas([{ id_asistencia: 1 }]));
  assert.equal((await obtenerTodosAsistencias()).length, 1);
  assert.equal((await obtenerTodosAsistenciasCurso(2)).length, 1);

  await assert.rejects(obtenerAsistencia(0), /inválida/);
  t.mock.method(Asistencia, "findByPk", async () => null);
  await assert.rejects(obtenerAsistencia(99), /no existe/);
  t.mock.method(Asistencia, "findByPk", async () => fila({ id_asistencia: 1 }));
  assert.equal((await obtenerAsistencia(1)).id_asistencia, 1);

  const conFiltros = t.mock.method(Asistencia, "findAll", async () => []);
  assert.deepEqual(
    await obtenerHistorialAsistencias({ id_curso: 2, fecha_desde: "2026-03-01" }),
    [],
  );
  const donde = conFiltros.mock.calls.at(-1).arguments[0].where;
  assert.equal(donde.id_curso, 2);
  assert.ok(donde.fecha);
});

test("crearAsistencia delega y 400 con alumno inexistente", async (t) => {
  t.mock.method(Asistencia, "create", async (d) => fila({ id_asistencia: 4, ...d }));
  assert.equal((await crearAsistencia({ ...UNA })).id_asistencia, 4);

  const fk = new Error("fk");
  fk.name = "SequelizeForeignKeyConstraintError";
  t.mock.method(Asistencia, "create", async () => {
    throw fk;
  });
  await assert.rejects(crearAsistencia({ ...UNA }), /alumno.*no existe/);
});

test("eliminarAsistencia 404 y 409 con dependencias", async (t) => {
  t.mock.method(Asistencia, "destroy", async () => 0);
  await assert.rejects(eliminarAsistencia(9), /No se encontro/);

  const fk = new Error("fk");
  fk.name = "SequelizeForeignKeyConstraintError";
  t.mock.method(Asistencia, "destroy", async () => {
    throw fk;
  });
  await assert.rejects(eliminarAsistencia(9), /dependencias/);

  t.mock.method(Asistencia, "destroy", async () => 1);
  assert.equal(await eliminarAsistencia(9), 1);
});

test("modificarAsistencia valida y 404", async (t) => {
  await assert.rejects(modificarAsistencia({}), /ID invalida/);
  t.mock.method(Asistencia, "update", async () => [0]);
  await assert.rejects(modificarAsistencia({ id_asistencia: 9 }), /No se encontro/);
  t.mock.method(Asistencia, "update", async () => [1]);
  assert.deepEqual(
    await modificarAsistencia({ id_asistencia: 9, estado: "ausente" }),
    [1],
  );
});

test("guardarAsistenciasLote valida y hace bulk con upsert", async (t) => {
  await assert.rejects(guardarAsistenciasLote({}), /Faltan datos/);
  await assert.rejects(
    guardarAsistenciasLote({ id_curso: 2, fecha: "2026-03-01", registros: "x" }),
    /Faltan datos/,
  );

  const bulk = t.mock.method(Asistencia, "bulkCreate", async () => [{}, {}]);
  const res = await guardarAsistenciasLote({
    registrado_por: 7,
    id_curso: 2,
    fecha: "2026-03-01",
    registros: [
      { id_alumno: 1, estado: "presente" },
      { id_alumno: 2, estado: "ausente" },
    ],
  });
  assert.equal(res.length, 2);
  assert.deepEqual(bulk.mock.calls[0].arguments[1], {
    updateOnDuplicate: ["estado"],
  });
  assert.equal(bulk.mock.calls[0].arguments[0][0].registrado_por, 7);
});

test("rutas /asistencias: lectura, escritura y 401/403", async (t) => {
  await permisos(t, {
    [ROLES.PRECEPTOR]: [
      "preceptor_ver_asistencias",
      "preceptor_registrar_asistencias",
    ],
  });
  t.mock.method(Asistencia, "findAll", async () => filas([{ id_asistencia: 1 }]));
  t.mock.method(Asistencia, "findByPk", async () => fila({ id_asistencia: 1 }));
  t.mock.method(Asistencia, "create", async (d) => fila({ id_asistencia: 4, ...d }));
  t.mock.method(Asistencia, "update", async () => [1]);
  t.mock.method(Asistencia, "destroy", async () => 1);
  t.mock.method(Asistencia, "bulkCreate", async () => [{}]);
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/asistencias");
  await sinPermiso(srv, "POST", "/api/academico/asistencias/lote", {
    body: { id_curso: 2, fecha: "2026-03-01", registros: [] },
  });

  const auth = { token: token({ id_rol: ROLES.PRECEPTOR }) };

  const lista = await srv.request("GET", "/api/academico/asistencias", auth);
  assert.equal(lista.status, 200);

  const hist = await srv.request(
    "GET",
    "/api/academico/asistencias/historial?id_curso=2",
    auth,
  );
  assert.equal(hist.status, 200);

  const curso = await srv.request("GET", "/api/academico/asistencias/curso/2", auth);
  assert.equal(curso.status, 200);

  const una = await srv.request("GET", "/api/academico/asistencias/1", auth);
  assert.equal(una.status, 200);

  const lote = await srv.request("POST", "/api/academico/asistencias/lote", {
    ...auth,
    body: {
      registrado_por: 4,
      id_curso: 2,
      fecha: "2026-03-01",
      registros: [{ id_alumno: 1, estado: "presente" }],
    },
  });
  assert.equal(lote.status, 200);

  const creada = await srv.request("POST", "/api/academico/asistencias/nueva", {
    ...auth,
    body: UNA,
  });
  assert.equal(creada.status, 200);

  const mod = await srv.request("PATCH", "/api/academico/asistencias/x", {
    ...auth,
    body: { id_asistencia: 1, estado: "ausente" },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/academico/asistencias/1", auth);
  assert.equal(del.status, 200);
});
