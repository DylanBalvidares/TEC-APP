import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import { Alumno } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerAlumno,
  obtenerAlumnosCurso,
  obtenerAlumnosCursoParaAlumno,
  obtenerInfoParaAlumno,
  crearAlumno,
  eliminarAlumno,
  modificarAlumno,
  darDeBajaAlumno,
} from "../src/modules/academico/alumnos-controller.js";

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

const ALUMNO = {
  nombre: "Ana",
  apellido: "Paz",
  dni: "40123456",
  fecha_nacimiento: "2010-01-01",
  nombre_tutor: "Luz Paz",
  telefono_tutor: "2901123456",
  domicilio: "Calle 1",
};

test("lecturas: por id, curso, mi-curso e info", async (t) => {
  await assert.rejects(obtenerAlumno(0), /inválida/);
  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(obtenerAlumno(99), /No se encontro/);
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1 }));
  assert.equal((await obtenerAlumno(1)).id_alumno, 1);

  await assert.rejects(obtenerAlumnosCurso(-1), /inválida/);
  t.mock.method(Alumno, "findAll", async () => []);
  await assert.rejects(obtenerAlumnosCurso(1), /asignados/);
  t.mock.method(Alumno, "findAll", async () => filas([{ id_alumno: 1 }]));
  assert.equal((await obtenerAlumnosCurso(1)).length, 1);
  assert.equal((await obtenerAlumnosCursoParaAlumno(1)).length, 1);

  await assert.rejects(obtenerInfoParaAlumno(0), /inválida/);
  t.mock.method(Alumno, "findOne", async () => null);
  // Sin alumno para ese usuario: 404 (mensaje según rama del controller).
  await assert.rejects(obtenerInfoParaAlumno(7), /404|No se|encontr/);
  t.mock.method(Alumno, "findOne", async () => fila({ id_alumno: 1 }));
  assert.equal((await obtenerInfoParaAlumno(7)).id_alumno, 1);
});

test("crearAlumno valida telefono y duplicados", async (t) => {
  await assert.rejects(
    crearAlumno({ ...ALUMNO, telefono_tutor: "mal" }),
    /Teléfono del tutor/,
  );
  t.mock.method(Alumno, "create", async (d) => fila({ id_alumno: 1, ...d }));
  assert.equal((await crearAlumno({ ...ALUMNO })).id_alumno, 1);

  const dup = new Error("dup");
  dup.name = "SequelizeUniqueConstraintError";
  t.mock.method(Alumno, "create", async () => {
    throw dup;
  });
  await assert.rejects(crearAlumno({ ...ALUMNO }), /ya existe/);

  const fk = new Error("fk");
  fk.name = "SequelizeForeignKeyConstraintError";
  t.mock.method(Alumno, "create", async () => {
    throw fk;
  });
  await assert.rejects(crearAlumno({ ...ALUMNO }), /no existe/);
});

test("eliminarAlumno 404 y 409 con registros", async (t) => {
  t.mock.method(Alumno, "destroy", async () => 0);
  await assert.rejects(eliminarAlumno(9), /No se encontro/);

  const fk = new Error("fk");
  fk.name = "SequelizeForeignKeyConstraintError";
  t.mock.method(Alumno, "destroy", async () => {
    throw fk;
  });
  await assert.rejects(eliminarAlumno(9), /asistencias|registros|vincul/);

  t.mock.method(Alumno, "destroy", async () => 1);
  assert.equal(await eliminarAlumno(9), 1);
});

test("modificarAlumno y darDeBaja", async (t) => {
  await assert.rejects(
    modificarAlumno({ telefono_tutor: "mal" }),
    /Teléfono del tutor/,
  );
  t.mock.method(Alumno, "update", async () => [0]);
  await assert.rejects(
    modificarAlumno({ id_alumno: 9, telefono_tutor: "2901123456" }),
    /No se encontro|idénticos|idénticos/,
  );
  t.mock.method(Alumno, "update", async () => [1]);
  assert.deepEqual(
    await modificarAlumno({ id_alumno: 9, nombre: "Ana" }),
    [1],
  );

  t.mock.method(Alumno, "update", async () => [0]);
  await assert.rejects(darDeBajaAlumno(9), /No se encontro/);
  t.mock.method(Alumno, "update", async () => [1]);
  const baja = await darDeBajaAlumno(9);
  assert.equal(baja.id_alumno, 9);
  assert.match(baja.mensaje, /baja/);
});

test("rutas /alumnos: lectura, escritura, baja y 401/403", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: [
      "administrativo_ver_todos_alumnos",
      "administrativo_crear_alumno",
      "administrativo_editar_alumno",
      "administrativo_eliminar_alumno",
    ],
  });
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1 }));
  t.mock.method(Alumno, "findAll", async () => filas([{ id_alumno: 1 }]));
  t.mock.method(Alumno, "create", async (d) => fila({ id_alumno: 1, ...d }));
  t.mock.method(Alumno, "update", async () => [1]);
  t.mock.method(Alumno, "destroy", async () => 1);
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/alumnos/1");
  await sinPermiso(srv, "POST", "/api/academico/alumnos", { body: ALUMNO });

  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  const uno = await srv.request("GET", "/api/academico/alumnos/1", auth);
  assert.equal(uno.status, 200);

  const creado = await srv.request("POST", "/api/academico/alumnos", {
    ...auth,
    body: ALUMNO,
  });
  assert.equal(creado.status, 201);

  const mod = await srv.request("PATCH", "/api/academico/alumnos", {
    ...auth,
    body: { id_alumno: 1, nombre: "Ana" },
  });
  assert.equal(mod.status, 200);

  const baja = await srv.request("PATCH", "/api/academico/alumnos/dar-de-baja/1", auth);
  assert.equal(baja.status, 200);

  const del = await srv.request("DELETE", "/api/academico/alumnos/1", auth);
  assert.equal(del.status, 200);
});
