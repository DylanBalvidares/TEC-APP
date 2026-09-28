import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { Alumno } from "../src/db/models/index.js";
import { Profesor } from "../src/db/models/index.js";
import { Curso } from "../src/db/models/index.js";
import { Usuario } from "../src/db/models/index.js";

after(cerrarServidor);

const PERMISOS = {
  [ROLES.ADMINISTRATIVO]: [
    "administrativo_ver_todos_alumnos",
    "administrativo_ver_todos_profesores",
    "administrativo_ver_todos_cursos",
    "administrativo_crear_usuario",
  ],
  [ROLES.ROOT]: [
    "administrativo_ver_todos_alumnos",
    "administrativo_ver_todos_profesores",
    "administrativo_ver_todos_cursos",
    "administrativo_crear_usuario",
  ],
};

function mockearListados(t) {
  t.mock.method(Alumno, "findAll", async () => [{ id_alumno: 1 }]);
  t.mock.method(Alumno, "findAndCountAll", async () => ({
    count: 50,
    rows: [{ id_alumno: 11 }],
  }));
  t.mock.method(Profesor, "findAll", async () => [{ id_profesor: 1 }]);
  t.mock.method(Profesor, "findAndCountAll", async () => ({
    count: 30,
    rows: [{ id_profesor: 7 }],
  }));
  t.mock.method(Curso, "findAll", async () => [{ id_curso: 1 }]);
  t.mock.method(Curso, "findAndCountAll", async () => ({
    count: 12,
    rows: [{ id_curso: 3 }],
  }));
  t.mock.method(Usuario, "findAll", async () => [{ id_usuario: 1 }]);
  t.mock.method(Usuario, "findAndCountAll", async () => ({
    count: 40,
    rows: [{ id_usuario: 5 }],
  }));
}

test("sin page/limit devuelve el listado completo (compatibilidad)", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  mockearListados(t);
  const srv = await obtenerServidor();
  const admin = token({ id_rol: ROLES.ADMINISTRATIVO });

  const res = await srv.request("GET", "/api/academico/alumnos", { token: admin });

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data));
});

test("con page/limit devuelve el contrato { data, total, page, limit }", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  mockearListados(t);
  const srv = await obtenerServidor();
  const admin = token({ id_rol: ROLES.ADMINISTRATIVO });

  for (const ruta of [
    "/api/academico/alumnos?page=2&limit=5",
    "/api/academico/profesores?page=1&limit=5",
    "/api/academico/cursos?page=1&limit=5",
    "/api/usuarios/usuarios?page=1&limit=5",
  ]) {
    const res = await srv.request("GET", ruta, { token: admin });
    assert.equal(res.status, 200, ruta);
    assert.ok(Array.isArray(res.data.data), ruta);
    assert.equal(typeof res.data.total, "number", ruta);
    assert.equal(typeof res.data.page, "number", ruta);
    assert.equal(typeof res.data.limit, "number", ruta);
  }
});

test("pagina fuera de rango y sort no permitido devuelven 400", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  mockearListados(t);
  const srv = await obtenerServidor();
  const admin = token({ id_rol: ROLES.ADMINISTRATIVO });

  const pagina = await srv.request("GET", "/api/academico/alumnos?page=0&limit=5", {
    token: admin,
  });
  assert.equal(pagina.status, 400);

  const orden = await srv.request("GET", "/api/academico/alumnos?page=1&sort=contrasena", {
    token: admin,
  });
  assert.equal(orden.status, 400);

  const limite = await srv.request("GET", "/api/academico/alumnos?page=1&limit=500", {
    token: admin,
  });
  assert.equal(limite.status, 400);
});
