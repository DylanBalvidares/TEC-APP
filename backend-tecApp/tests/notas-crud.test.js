import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import {
  Nota,
  HistorialNota,
  Alumno,
  Asignacion,
  Curso,
  Profesor,
  Personal,
} from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerNotasProfesor,
  obtenerNotasPreceptorCurso,
  obtenerMisNotasAlumno,
  obtenerHistorialAlumno,
  crearNota,
  modificarNota,
  obtenerTodasNotas,
  obtenerNota,
  eliminarNota,
} from "../src/modules/academico/notas-controller.js";

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

const NOTA = { id_alumno: 1, id_asignacion: 2, calificacion: 8.5 };

test("obtenerNotasProfesor 404 sin perfil y arma planilla", async (t) => {
  t.mock.method(Profesor, "findOne", async () => null);
  await assert.rejects(obtenerNotasProfesor(7), /perfil docente/);

  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(Asignacion, "findAll", async () => []);
  const vacia = await obtenerNotasProfesor(7);
  assert.deepEqual(vacia.notas, []);

  t.mock.method(Asignacion, "findAll", async () => [
    fila({ id_asignacion: 2, id_profesor: 3, id_curso: 1 }),
  ]);
  t.mock.method(Alumno, "findAll", async () => filas([{ id_alumno: 1 }]));
  t.mock.method(Nota, "findAll", async () => filas([{ id_nota: 9 }]));
  const res = await obtenerNotasProfesor(7);
  assert.equal(res.notas.length, 1);
  assert.equal(res.alumnos.length, 1);
});

test("obtenerNotasPreceptorCurso verifica curso a cargo", async (t) => {
  t.mock.method(Curso, "findByPk", async () => null);
  await assert.rejects(obtenerNotasPreceptorCurso(99, 4, 4), /no existe/);

  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, id_preceptor: 8 }));
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  await assert.rejects(obtenerNotasPreceptorCurso(1, 4, 4), /asignado/);

  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, id_preceptor: 5 }));
  t.mock.method(Alumno, "findAll", async () => []);
  t.mock.method(Asignacion, "findAll", async () => []);
  const res = await obtenerNotasPreceptorCurso(1, 4, 4);
  assert.deepEqual(res.notas, []);
});

test("obtenerMisNotasAlumno 404 sin alumno", async (t) => {
  t.mock.method(Alumno, "findOne", async () => null);
  await assert.rejects(obtenerMisNotasAlumno(7), /No se encontró el registro/);
});

test("crearNota valida, autoriza profesor y crea historial", async (t) => {
  await assert.rejects(crearNota({}, 7, 3), /obligatorios/);
  await assert.rejects(crearNota({ ...NOTA, calificacion: 99 }, 7, 3), /no es válida/);

  t.mock.method(Asignacion, "findByPk", async () => null);
  await assert.rejects(crearNota({ ...NOTA }, 7, 3), /no existe/);

  // Profesor sin esa asignación → 403.
  t.mock.method(Asignacion, "findByPk", async () =>
    fila({ id_asignacion: 2, id_profesor: 3, id_curso: 1 }),
  );
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 9 }));
  await assert.rejects(crearNota({ ...NOTA }, 7, 3), /no tenés asignado/);

  // Camino feliz: alumno del curso, sin nota previa.
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1, id_curso: 1 }));
  t.mock.method(Nota, "findOne", async () => null);
  t.mock.method(Nota, "create", async (d) => fila({ id_nota: 11, ...d }));
  const creadoHistorial = [];
  t.mock.method(HistorialNota, "create", async (d) => {
    creadoHistorial.push(d);
    return fila(d);
  });
  const nota = await crearNota({ ...NOTA }, 7, 3);
  assert.equal(nota.calificacion, 8.5);
  assert.equal(creadoHistorial[0].motivo, "Carga inicial de calificación");

  // Alumno de otro curso → 400.
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1, id_curso: 2 }));
  await assert.rejects(crearNota({ ...NOTA }, 7, 3), /no pertenece/);
});

test("modificarNota y eliminarNota autorizan por asignacion", async (t) => {
  await assert.rejects(modificarNota({}, 7, 3), /inválida/);
  t.mock.method(Nota, "findByPk", async () => null);
  await assert.rejects(modificarNota({ id_nota: 9 }, 7, 3), /No se encontró/);

  const notaViva = () => ({
    id_nota: 9,
    id_alumno: 1,
    id_asignacion: 2,
    calificacion: 6,
    asignacione: { id_profesor: 3 },
    save: async () => true,
    destroy: async () => true,
  });
  t.mock.method(Nota, "findByPk", async () => notaViva());
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 9 }));
  await assert.rejects(
    modificarNota({ id_nota: 9, calificacion: 7 }, 7, 3),
    /permiso para modificar/,
  );
  await assert.rejects(eliminarNota(9, 7, 3), /permiso para eliminar/);

  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(HistorialNota, "create", async (d) => fila(d));
  const mod = await modificarNota({ id_nota: 9, calificacion: 7 }, 7, 3);
  assert.equal(mod.calificacion, 7);

  t.mock.method(Nota, "findByPk", async () => notaViva());
  const del = await eliminarNota(9, 7, 3);
  assert.equal(del.success, true);
});

test("obtenerHistorialAlumno autoriza alumno y preceptor", async (t) => {
  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(obtenerHistorialAlumno(99, 7, 1), /no encontrado/i);

  // Alumno que espía a otro → 403.
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 2, id_usuario: 8 }));
  await assert.rejects(obtenerHistorialAlumno(2, 7, 1), /otro alumno/);

  // Preceptor de otro curso → 403; propio → lista.
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 2, id_curso: 1 }));
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, id_preceptor: 6 }));
  await assert.rejects(obtenerHistorialAlumno(2, 7, 4), /a cargo/);

  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, id_preceptor: 5 }));
  t.mock.method(HistorialNota, "findAll", async () => filas([{ id_nota: 9 }]));
  assert.equal((await obtenerHistorialAlumno(2, 7, 4)).length, 1);
});

test("obtenerTodasNotas, obtenerNota y rutas HTTP", async (t) => {
  t.mock.method(Nota, "findAll", async () => []);
  await assert.rejects(obtenerTodasNotas(), /No se encontraron/);
  t.mock.method(Nota, "findAll", async () => filas([{ id_nota: 1 }]));
  assert.equal((await obtenerTodasNotas()).length, 1);

  await assert.rejects(obtenerNota(0), /inválida/);
  t.mock.method(Nota, "findByPk", async () => null);
  await assert.rejects(obtenerNota(99), /No se encontró/);

  await permisos(t, {
    [ROLES.PROFESOR]: [
      "profesor_ver_todos_notas",
      "profesor_crear_nota",
      "profesor_editar_nota",
      "profesor_eliminar_nota",
    ],
  });
  t.mock.method(Nota, "findByPk", async () => ({
    id_nota: 9,
    id_alumno: 1,
    id_asignacion: 2,
    calificacion: 6,
    asignacione: { id_profesor: 3, id_curso: 1 },
    save: async () => true,
    destroy: async () => true,
  }));
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(Asignacion, "findByPk", async () =>
    fila({ id_asignacion: 2, id_profesor: 3, id_curso: 1 }),
  );
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1, id_curso: 1 }));
  t.mock.method(Nota, "findOne", async () => null);
  t.mock.method(Nota, "create", async (d) => fila({ id_nota: 11, ...d }));
  t.mock.method(HistorialNota, "create", async (d) => fila(d));
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/notas");
  await sinPermiso(srv, "POST", "/api/academico/notas", { body: NOTA });

  // token() firma id_rol profesor (3) con id 1: el profesor mockeado es el dueño.
  const authProfesor = token({ id: 7, id_rol: ROLES.PROFESOR });

  const lista = await srv.request("GET", "/api/academico/notas", {
    token: authProfesor,
  });
  assert.equal(lista.status, 200);

  const una = await srv.request("GET", "/api/academico/notas/9", {
    token: authProfesor,
  });
  assert.equal(una.status, 200);

  const creada = await srv.request("POST", "/api/academico/notas", {
    token: authProfesor,
    body: NOTA,
  });
  assert.equal(creada.status, 201);

  const mod = await srv.request("PATCH", "/api/academico/notas", {
    token: authProfesor,
    body: { id_nota: 9, calificacion: 7 },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/academico/notas/9", {
    token: authProfesor,
  });
  assert.equal(del.status, 200);
});
