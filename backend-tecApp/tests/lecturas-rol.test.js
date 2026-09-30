import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken } from "./helpers/crud.js";
import {
  Alumno,
  Asignacion,
  Curso,
  Profesor,
  Nota,
} from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";

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

const TODO_LECTURA = [
  "alumno_ver_perfil",
  "alumno_ver_mi_curso",
  "alumno_ver_mis_notas",
  "administrativo_ver_todos_alumnos",
  "administrativo_ver_todos_cursos",
  "profesor_ver_curso",
  "profesor_ver_todos_notas",
  "preceptor_ver_notas",
];

test("lecturas de alumno y profesor por rol", async (t) => {
  await permisos(t, {
    [ROLES.ALUMNO]: ["alumno_ver_perfil", "alumno_ver_mi_curso"],
    [ROLES.PROFESOR]: ["profesor_ver_curso"],
    [ROLES.ROOT]: TODO_LECTURA,
  });
  t.mock.method(Alumno, "findOne", async () =>
    fila({ id_alumno: 1, nombre: "Ana", id_curso: 2, curso: { nombre_curso: "3B" } }),
  );
  t.mock.method(Alumno, "findAll", async () => filas([{ id_alumno: 1 }]));
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 2 }));
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/alumnos-mi-info/7");

  const alumno = { token: token({ id_rol: ROLES.ALUMNO }) };
  const profe = { token: token({ id_rol: ROLES.PROFESOR }) };
  const root = { token: token({ id_rol: ROLES.ROOT }) };

  const miInfo = await srv.request("GET", "/api/academico/alumnos-mi-info/7", alumno);
  assert.equal(miInfo.status, 200);

  const miCurso = await srv.request("GET", "/api/academico/alumnos/mi-curso/2", alumno);
  assert.equal(miCurso.status, 200);

  const curso = await srv.request("GET", "/api/academico/alumnos/curso/2", root);
  assert.equal(curso.status, 200);

  const infoProfe = await srv.request("GET", "/api/academico/profesores-mi-info/7", profe);
  assert.equal(infoProfe.status, 200);

  const infoCurso = await srv.request("GET", "/api/academico/info-curso-alumno/2", alumno);
  assert.equal(infoCurso.status, 200);
});

test("lecturas de asignaciones por curso y profesor", async (t) => {
  await permisos(t, {
    [ROLES.ALUMNO]: ["alumno_ver_mi_curso"],
    [ROLES.PROFESOR]: ["profesor_ver_curso"],
  });
  t.mock.method(Asignacion, "findAll", async () => filas([{ id_asignacion: 1 }]));
  const srv = await obtenerServidor();

  const porCurso = await srv.request("GET", "/api/academico/asignaciones/curso/2", {
    token: token({ id_rol: ROLES.ALUMNO }),
  });
  assert.equal(porCurso.status, 200);

  const porProfe = await srv.request("GET", "/api/academico/asignaciones/profesor/3", {
    token: token({ id_rol: ROLES.PROFESOR }),
  });
  assert.equal(porProfe.status, 200);
});

test("lecturas de notas por rol", async (t) => {
  await permisos(t, {
    [ROLES.PROFESOR]: ["profesor_ver_todos_notas"],
    [ROLES.ROOT]: ["preceptor_ver_notas", "alumno_ver_mis_notas"],
  });
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(Asignacion, "findAll", async () => filas([{ id_asignacion: 2 }]));
  t.mock.method(Alumno, "findAll", async () => []);
  t.mock.method(Nota, "findAll", async () => []);
  t.mock.method(Alumno, "findOne", async () =>
    fila({ id_alumno: 1, id_curso: 2, nombre: "Ana", apellido: "P", dni: "1" }),
  );
  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 2, id_preceptor: 5 }));
  const srv = await obtenerServidor();

  // id_usuario del token = 3: dueño de las asignaciones mockeadas.
  const planilla = await srv.request("GET", "/api/academico/notas/profesor", {
    token: token({ id: 3, id_rol: ROLES.PROFESOR }),
  });
  assert.equal(planilla.status, 200);

  // ROOT con preceptor_ver_notas salta el chequeo de curso propio (solo rol 4).
  const curso = await srv.request("GET", "/api/academico/notas/preceptor/curso/2", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(curso.status, 200);

  const mias = await srv.request("GET", "/api/academico/notas/mis-notas", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(mias.status, 200);
  assert.ok("promedios" in mias.data);
});
