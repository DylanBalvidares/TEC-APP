import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, sinToken, sinPermiso } from "./helpers/crud.js";
import { Curso, Personal } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerCurso,
  crearCurso,
  eliminarCurso,
  modificarCurso,
  cancelarCurso,
} from "../src/modules/academico/cursos-controller.js";

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

function preceptorOk(t, nombre = "Preceptor") {
  t.mock.method(Personal, "findByPk", async () => ({
    id_personal: 4,
    estado: "activo",
    cargoPersonal: { nombre_cargo: nombre },
  }));
}

const CURSO = { nombre_curso: "3°B", nivel: "secundario", turno: "mañana" };

test("obtenerCurso valida id y 404", async (t) => {
  await assert.rejects(obtenerCurso(-1), /ID invalida/);
  t.mock.method(Curso, "findByPk", async () => null);
  await assert.rejects(obtenerCurso(99), /No se encontro/);
  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1 }));
  assert.equal((await obtenerCurso(1)).id_curso, 1);
});

test("crearCurso valida anio, preceptor y propaga fk", async (t) => {
  await assert.rejects(crearCurso({ ...CURSO, anio: 9 }), /Año de curso/);

  t.mock.method(Personal, "findByPk", async () => null);
  await assert.rejects(crearCurso({ ...CURSO, id_preceptor: 99 }), /no existe/);

  preceptorOk(t, "Administrativo");
  await assert.rejects(
    crearCurso({ ...CURSO, id_preceptor: 4 }),
    /cargo de preceptor/,
  );

  preceptorOk(t);
  t.mock.method(Curso, "create", async (d) => fila({ id_curso: 7, ...d }));
  const creado = await crearCurso({ ...CURSO, anio: "3", id_preceptor: 4 });
  assert.equal(creado.id_curso, 7);
  assert.equal(creado.anio, 3);
  assert.equal(creado.id_preceptor, 4);
});

test("eliminarCurso 404 y 400 con alumnos", async (t) => {
  t.mock.method(Curso, "destroy", async () => 0);
  await assert.rejects(eliminarCurso(9), /No se encontro/);

  const fk = new Error("fk");
  fk.name = "SequelizeForeignKeyConstraintError";
  t.mock.method(Curso, "destroy", async () => {
    throw fk;
  });
  await assert.rejects(eliminarCurso(9), /alumnos asignados/);

  t.mock.method(Curso, "destroy", async () => 1);
  assert.equal(await eliminarCurso(9), 1);
});

test("modificarCurso valida id, anio y 404", async (t) => {
  await assert.rejects(modificarCurso({}), /ID inválida/);
  await assert.rejects(modificarCurso({ id_curso: 1, anio: 0 }), /Año de curso/);

  t.mock.method(Curso, "update", async () => [0]);
  await assert.rejects(modificarCurso({ id_curso: 9 }), /No se encontró/);

  t.mock.method(Curso, "update", async () => [1]);
  const res = await modificarCurso({ id_curso: 9, nombre_curso: "4°A" });
  assert.equal(res.mensaje, "Curso actualizado correctamente");
});

test("cancelarCurso marca cancelado o 404", async (t) => {
  t.mock.method(Curso, "update", async () => [0]);
  await assert.rejects(cancelarCurso(9), /No se encontró/);

  const cambio = t.mock.method(Curso, "update", async () => [1]);
  const res = await cancelarCurso(9);
  assert.equal(res.id_curso, 9);
  assert.deepEqual(cambio.mock.calls[0].arguments[0], { estado: "cancelado" });
});

test("rutas /cursos: lectura, escritura y 204 al eliminar", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: [
      "administrativo_ver_todos_cursos",
      "administrativo_crear_curso",
      "administrativo_editar_curso",
      "administrativo_eliminar_curso",
    ],
  });
  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1 }));
  t.mock.method(Curso, "create", async (d) => fila({ id_curso: 7, ...d }));
  t.mock.method(Curso, "update", async () => [1]);
  t.mock.method(Curso, "destroy", async () => 1);
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/cursos/1");
  await sinPermiso(srv, "POST", "/api/academico/cursos", { body: CURSO });

  const uno = await srv.request("GET", "/api/academico/cursos/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(uno.status, 200);

  const creado = await srv.request("POST", "/api/academico/cursos", {
    token: token({ id_rol: ROLES.ROOT }),
    body: CURSO,
  });
  assert.equal(creado.status, 201);

  const mod = await srv.request("PATCH", "/api/academico/cursos", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { id_curso: 1, nombre_curso: "4°A" },
  });
  assert.equal(mod.status, 201);

  const canc = await srv.request("PATCH", "/api/academico/cursos/cancelar/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(canc.status, 200);

  const del = await srv.request("DELETE", "/api/academico/cursos/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(del.status, 204);
});
