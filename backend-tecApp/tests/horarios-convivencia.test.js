import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import { Alumno } from "../src/db/models/index.js";
import Horario from "../src/db/models/horario-model.js";
import Observacion from "../src/db/models/observacion-model.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import { eliminarHorario } from "../src/modules/academico/horarios-controller.js";
import {
  listarObservaciones,
  crearObservacion,
} from "../src/modules/academico/convivencia-controller.js";

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

const PRECEPTOR = { id_usuario: 4, id_rol: 4, id_alumno: null, esRoot: false };

test("eliminarHorario 404 o confirma", async (t) => {
  t.mock.method(Horario, "findByPk", async () => null);
  await assert.rejects(eliminarHorario(99), /No se encontró/);

  t.mock.method(Horario, "findByPk", async () => fila({ id_horario: 1 }));
  const res = await eliminarHorario(1);
  assert.equal(res.ok, true);
});

test("listarObservaciones exige alumno o ambito total", async (t) => {
  // Actor propio (tutor) sin alumno → 403.
  await assert.rejects(
    listarObservaciones({ id_rol: 6 }),
    /indicá un alumno/,
  );

  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(listarObservaciones(PRECEPTOR, { id_alumno: 99 }), /No se encontró/);

  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 2 }));
  t.mock.method(Observacion, "findAll", async () => filas([{ id_observacion: 1 }]));
  assert.equal((await listarObservaciones(PRECEPTOR, { id_alumno: 2 })).length, 1);
  assert.equal((await listarObservaciones(PRECEPTOR)).length, 1);
});

test("crearObservacion valida y recorta texto", async (t) => {
  await assert.rejects(crearObservacion(PRECEPTOR, {}), /obligatorio/);
  await assert.rejects(
    crearObservacion(PRECEPTOR, { id_alumno: 2 }),
    /texto es obligatorio/,
  );

  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(
    crearObservacion(PRECEPTOR, { id_alumno: 99, texto: "x" }),
    /No se encontró/,
  );

  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 2 }));
  const crear = t.mock.method(Observacion, "create", async (d) => fila({ id_observacion: 7, ...d }));
  const obs = await crearObservacion(PRECEPTOR, { id_alumno: 2, texto: "  Llegó tarde  " });
  assert.equal(obs.id_observacion, 7);
  assert.equal(crear.mock.calls[0].arguments[0].texto, "Llegó tarde");
  assert.equal(crear.mock.calls[0].arguments[0].registrado_por, 4);
});

test("rutas /horarios y /observaciones con permisos", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: ["horario_gestionar", "preceptor_gestionar_sanciones"],
    [ROLES.PRECEPTOR]: ["preceptor_ver_sanciones"],
  });
  t.mock.method(Horario, "findByPk", async () => fila({ id_horario: 1 }));
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 2 }));
  t.mock.method(Observacion, "findAll", async () => filas([{ id_observacion: 1 }]));
  t.mock.method(Observacion, "create", async (d) => fila({ id_observacion: 7, ...d }));
  const srv = await obtenerServidor();

  await sinToken(srv, "DELETE", "/api/academico/horarios/1");
  await sinPermiso(srv, "DELETE", "/api/academico/horarios/1");

  const del = await srv.request("DELETE", "/api/academico/horarios/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(del.status, 200);

  const lista = await srv.request("GET", "/api/academico/observaciones", {
    token: token({ id_rol: ROLES.PRECEPTOR }),
  });
  assert.equal(lista.status, 200);

  const crear = await srv.request("POST", "/api/academico/observaciones", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { id_alumno: 2, texto: "Incumplimiento" },
  });
  assert.equal(crear.status, 201);
});
