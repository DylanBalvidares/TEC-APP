import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { Alumno, Profesor, Usuario } from "../src/db/models/index.js";
import { rutasSinPermisoExplicito } from "./helpers/rutas.js";

after(cerrarServidor);

// S4: validar-identidad lo usan administrativo y preceptor; sincronizar sólo
// administrativo. Root hereda todo vía permisos (no hay bypass por id).
const PERMISOS = {
  [ROLES.ALUMNO]: [],
  [ROLES.PRECEPTOR]: ["preceptor_ver_perfil_alumno"],
  [ROLES.ADMINISTRATIVO]: [
    "administrativo_ver_todos_alumnos",
    "administrativo_crear_alumno",
    "administrativo_editar_alumno",
    "administrativo_ver_todos_profesores",
    "administrativo_crear_profesor",
    "administrativo_editar_profesor",
  ],
  [ROLES.ROOT]: [
    "administrativo_ver_todos_alumnos",
    "administrativo_crear_alumno",
    "administrativo_editar_alumno",
    "administrativo_ver_todos_profesores",
    "administrativo_crear_profesor",
    "administrativo_editar_profesor",
  ],
};

function mockearModelos(t) {
  t.mock.method(Alumno, "findOne", async () => ({ id_alumno: 3, dni: "123" }));
  t.mock.method(Alumno, "update", async () => [1]);
  t.mock.method(Profesor, "findOne", async () => ({ id_profesor: 5, dni: "456" }));
  t.mock.method(Profesor, "update", async () => [1]);
  t.mock.method(Usuario, "findByPk", async () => ({
    id_usuario: 9,
    id_rol: ROLES.ADMINISTRATIVO,
  }));
}

test("S4: alumno no puede validar identidad ni sincronizar usuarios", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  const srv = await obtenerServidor();
  const alumno = token({ id_rol: ROLES.ALUMNO });

  const validarAlumno = await srv.request("POST", "/api/academico/alumnos/validar-identidad", {
    token: alumno,
    body: { dni: "1", nacimiento: "2010-01-01" },
  });
  const sincronizarAlumno = await srv.request(
    "PATCH",
    "/api/academico/alumnos/sincronizar-usuario-alumno",
    { token: alumno, body: { idAlumno: 3, idUsuario: 9 } },
  );
  const validarProfesor = await srv.request(
    "POST",
    "/api/academico/profesores/validar-identidad",
    { token: alumno, body: { dni: "1", nacimiento: "1980-01-01" } },
  );
  const sincronizarProfesor = await srv.request(
    "PATCH",
    "/api/academico/profesores/sincronizar-usuario-profesor",
    { token: alumno, body: { idProfesor: 5, idUsuario: 9 } },
  );

  assert.equal(validarAlumno.status, 403);
  assert.equal(sincronizarAlumno.status, 403);
  assert.equal(validarProfesor.status, 403);
  assert.equal(sincronizarProfesor.status, 403);
});

test("S4: preceptor valida identidad de alumno pero no sincroniza ni toca profesores", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  mockearModelos(t);
  const srv = await obtenerServidor();
  const preceptor = token({ id_rol: ROLES.PRECEPTOR });

  const validar = await srv.request("POST", "/api/academico/alumnos/validar-identidad", {
    token: preceptor,
    body: { dni: "123", nacimiento: "2010-01-01" },
  });
  const sincronizar = await srv.request(
    "PATCH",
    "/api/academico/alumnos/sincronizar-usuario-alumno",
    { token: preceptor, body: { idAlumno: 3, idUsuario: 9 } },
  );
  const validarProfesor = await srv.request(
    "POST",
    "/api/academico/profesores/validar-identidad",
    { token: preceptor, body: { dni: "456", nacimiento: "1980-01-01" } },
  );

  assert.equal(validar.status, 200);
  assert.equal(sincronizar.status, 403);
  assert.equal(validarProfesor.status, 403);
});

test("S4: root valida y sincroniza alumnos y profesores", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  mockearModelos(t);
  const srv = await obtenerServidor();
  const root = token({ id_rol: ROLES.ROOT });

  const validarAlumno = await srv.request("POST", "/api/academico/alumnos/validar-identidad", {
    token: root,
    body: { dni: "123", nacimiento: "2010-01-01" },
  });
  const sincronizarAlumno = await srv.request(
    "PATCH",
    "/api/academico/alumnos/sincronizar-usuario-alumno",
    { token: root, body: { idAlumno: 3, idUsuario: 9 } },
  );
  const validarProfesor = await srv.request(
    "POST",
    "/api/academico/profesores/validar-identidad",
    { token: root, body: { dni: "456", nacimiento: "1980-01-01" } },
  );
  const sincronizarProfesor = await srv.request(
    "PATCH",
    "/api/academico/profesores/sincronizar-usuario-profesor",
    { token: root, body: { idProfesor: 5, idUsuario: 9 } },
  );

  assert.equal(validarAlumno.status, 200);
  assert.equal(sincronizarAlumno.status, 200);
  assert.equal(validarProfesor.status, 200);
  assert.equal(sincronizarProfesor.status, 200);
});

test("S4: el guardrail ya no marca validar-identidad ni sincronizar", () => {
  const marcadas = rutasSinPermisoExplicito().filter(
    (r) => r.includes("validar-identidad") || r.includes("sincronizar-usuario"),
  );
  assert.deepEqual(marcadas, []);
});
