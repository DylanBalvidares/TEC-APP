import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { fila } from "./helpers/crud.js";
import { Usuario, Alumno, Profesor, Rol } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import obtenerJWTSecret from "../src/utils/jwtSecret.js";
import {
  generarToken,
  login,
  buscarEnPadron,
  sincronizarUsuarioAlumno,
  sincronizarUsuarioProfesor,
} from "../src/modules/auth/auth-controller.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

const USUARIO_DB = {
  id_usuario: 7,
  nombre: "Ana",
  email: "ana@tecnica2.edu.ar",
  // Legacy en texto plano: verificarContrasena la acepta sin bcrypt.
  contrasena: "Secreta123",
  id_rol: 7,
  rol: { nombre_rol: "administrativo" },
};

function mockearLogin(t, { contrasena = "Secreta123", dni = "30123456" } = {}) {
  t.mock.method(Usuario, "findOne", async () => fila({ ...USUARIO_DB, contrasena }));
  // Migración legacy: con clave en texto plano el login la re-hashea.
  t.mock.method(Usuario, "update", async () => [1]);
  t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) {
      return { toJSON: () => ({ id_rol: 7, permisos: ["x_ver"] }) };
    }
    return fila({ id_rol: 7 });
  });
  t.mock.method(Alumno, "findOne", async () => (dni ? { dni } : null));
  t.mock.method(Profesor, "findOne", async () => null);
}

test("generarToken firma payload verificable", () => {
  const token = generarToken(
    { id_usuario: 7, nombre: "Ana", email: "a@b.c", id_rol: 7 },
    ["x_ver"],
  );
  const payload = jwt.verify(token, obtenerJWTSecret());
  assert.equal(payload.id, 7);
  assert.equal(payload.id_rol, 7);
  assert.deepEqual(payload.permisos, ["x_ver"]);
});

test("login exitoso devuelve token, usuario y dni", async (t) => {
  mockearLogin(t);
  const res = await login({ email: USUARIO_DB.email, contrasena: "Secreta123" });
  assert.equal(res.mensaje, "Login exitoso");
  const payload = jwt.verify(res.token, obtenerJWTSecret());
  assert.equal(payload.email, USUARIO_DB.email);
  assert.equal(res.usuario.dni, "30123456");
  assert.ok(!("contrasena" in res.usuario));
});

test("login rechaza credenciales inválidas", async (t) => {
  mockearLogin(t);
  await assert.rejects(
    login({ email: USUARIO_DB.email, contrasena: "otra" }),
    /incorrecta/,
  );
  t.mock.method(Usuario, "findOne", async () => null);
  await assert.rejects(
    login({ email: "nadie@x.edu.ar", contrasena: "Secreta123" }),
    /no encontrado/i,
  );
});

test("buscarEnPadron encuentra alumno, profesor o 404", async (t) => {
  t.mock.method(Alumno, "findOne", async () => fila({ id_alumno: 1, dni: "1" }));
  const a = await buscarEnPadron({ dni: "1", nacimiento: "2010-01-01" });
  assert.equal(a.rol, "alumno");

  t.mock.method(Alumno, "findOne", async () => null);
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 2 }));
  const p = await buscarEnPadron({ dni: "2", nacimiento: "1990-01-01" });
  assert.equal(p.rol, "profesor");

  t.mock.method(Profesor, "findOne", async () => null);
  await assert.rejects(buscarEnPadron({ dni: "9", nacimiento: "2000-01-01" }), /padrones/);
});

test("sincronizar usuario con alumno/profesor o 404", async (t) => {
  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(sincronizarUsuarioAlumno(99, 7), /no encontrado/i);
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1, update: async () => [1] }));
  assert.equal((await sincronizarUsuarioAlumno(1, 7)).id_alumno, 1);

  t.mock.method(Profesor, "findByPk", async () => null);
  await assert.rejects(sincronizarUsuarioProfesor(99, 7), /no encontrado/i);
  t.mock.method(Profesor, "findByPk", async () => fila({ id_profesor: 2, update: async () => [1] }));
  assert.equal((await sincronizarUsuarioProfesor(2, 7)).id_profesor, 2);
});

test("POST /api/auth/login y /buscar-en-padron", async (t) => {
  mockearLogin(t);
  const srv = await obtenerServidor();

  const ok = await srv.request("POST", "/api/auth/login", {
    body: { email: USUARIO_DB.email, contrasena: "Secreta123" },
  });
  assert.equal(ok.status, 200);
  assert.ok(ok.data.token);
  assert.equal(ok.data.usuario.email, USUARIO_DB.email);

  const mal = await srv.request("POST", "/api/auth/login", {
    body: { email: USUARIO_DB.email, contrasena: "otra" },
  });
  assert.equal(mal.status, 401);

  t.mock.method(Alumno, "findOne", async () => fila({ id_alumno: 1, dni: "1" }));
  const padron = await srv.request("POST", "/api/auth/buscar-en-padron", {
    body: { dni: "1", nacimiento: "2010-01-01" },
  });
  assert.equal(padron.status, 200);
  assert.equal(padron.data.valido, true);
});
