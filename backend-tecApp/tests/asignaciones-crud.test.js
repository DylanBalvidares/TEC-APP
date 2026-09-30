import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import { Asignacion, Nota } from "../src/db/models/index.js";
import sequelize from "../src/db/conexionDB.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerTodasAsignaciones,
  obtenerAsignacion,
  obtenerAsignacionesCurso,
  obtenerAsignacionesProfesor,
  crearAsignacion,
  eliminarAsignacion,
  modificarAsignacion,
} from "../src/modules/academico/asignaciones-controller.js";

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

function transaccionFalsa(t) {
  const tx = { commit: async () => true, rollback: async () => true };
  t.mock.method(sequelize, "transaction", async () => tx);
  return tx;
}

const DATOS = { id_curso: 1, id_materia: 2, id_profesor: 3 };

test("lecturas: todas, por id, curso y profesor", async (t) => {
  t.mock.method(Asignacion, "findAll", async () => filas([{ id_asignacion: 1 }]));
  assert.equal((await obtenerTodasAsignaciones()).length, 1);

  await assert.rejects(obtenerAsignacion(0), /inválida/);
  t.mock.method(Asignacion, "findByPk", async () => null);
  await assert.rejects(obtenerAsignacion(99), /No se encontró/);
  t.mock.method(Asignacion, "findByPk", async () => fila({ id_asignacion: 1 }));
  assert.equal((await obtenerAsignacion(1)).id_asignacion, 1);

  await assert.rejects(obtenerAsignacionesCurso(-1), /inválida/);
  assert.equal((await obtenerAsignacionesCurso(1)).length, 1);
  await assert.rejects(obtenerAsignacionesProfesor(null), /inválida/);
  assert.equal((await obtenerAsignacionesProfesor(3)).length, 1);
});

test("crearAsignacion delega y 400 con fk inexistente", async (t) => {
  t.mock.method(Asignacion, "create", async (d) => fila({ id_asignacion: 5, ...d }));
  assert.equal((await crearAsignacion({ ...DATOS })).id_asignacion, 5);

  const fk = new Error("fk");
  fk.name = "SequelizeForeignKeyConstraintError";
  t.mock.method(Asignacion, "create", async () => {
    throw fk;
  });
  await assert.rejects(crearAsignacion({ ...DATOS }), /no existen/);
});

test("eliminarAsignacion borra notas en transaccion o 404", async (t) => {
  const tx = transaccionFalsa(t);
  let notasBorradas = 0;
  t.mock.method(Nota, "destroy", async () => {
    notasBorradas += 1;
    return 2;
  });
  t.mock.method(Asignacion, "destroy", async () => 0);
  await assert.rejects(eliminarAsignacion(9), /No se encontró/);
  assert.equal(notasBorradas, 1);

  transaccionFalsa(t);
  t.mock.method(Asignacion, "destroy", async () => 1);
  assert.equal(await eliminarAsignacion(9), 1);
  void tx;
});

test("modificarAsignacion valida y 404", async (t) => {
  await assert.rejects(modificarAsignacion({}), /inválida/);
  t.mock.method(Asignacion, "update", async () => [0]);
  await assert.rejects(modificarAsignacion({ id_asignacion: 9 }), /No se encontró/);
  t.mock.method(Asignacion, "update", async () => [1]);
  assert.deepEqual(await modificarAsignacion({ id_asignacion: 9, ...DATOS }), [1]);
});

test("rutas /asignaciones: lectura, escritura y 401/403", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: [
      "administrativo_ver_todos_asignaciones",
      "administrativo_crear_asignacion",
      "administrativo_editar_asignacion",
      "administrativo_eliminar_asignacion",
    ],
  });
  t.mock.method(Asignacion, "findAll", async () => filas([{ id_asignacion: 1 }]));
  t.mock.method(Asignacion, "findByPk", async () => fila({ id_asignacion: 1 }));
  t.mock.method(Asignacion, "create", async (d) => fila({ id_asignacion: 5, ...d }));
  t.mock.method(Asignacion, "update", async () => [1]);
  t.mock.method(Nota, "destroy", async () => 0);
  transaccionFalsa(t);
  t.mock.method(Asignacion, "destroy", async () => 1);
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/asignaciones");
  await sinPermiso(srv, "POST", "/api/academico/asignaciones", { body: DATOS });

  const lista = await srv.request("GET", "/api/academico/asignaciones", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(lista.status, 200);

  const una = await srv.request("GET", "/api/academico/asignaciones/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(una.status, 200);

  const creada = await srv.request("POST", "/api/academico/asignaciones", {
    token: token({ id_rol: ROLES.ROOT }),
    body: DATOS,
  });
  assert.equal(creada.status, 201);

  const mod = await srv.request("PATCH", "/api/academico/asignaciones", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { id_asignacion: 1, ...DATOS },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/academico/asignaciones/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(del.status, 200);
});
