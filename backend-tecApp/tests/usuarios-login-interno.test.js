import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { comprobarContrasenaUsuario } from "../src/modules/usuarios/usuarios-controller.js";
import { Usuario } from "../src/db/models/index.js";

after(cerrarServidor);

const RUTA = "/api/usuarios/usuarios/login";

function mockearVerificacion(t, ok = true) {
  t.mock.method(Usuario, "findOne", async () => ({
    id_usuario: 7,
    contrasena: "$2b$10$hashficticio",
    id_rol: ROLES.ADMINISTRATIVO,
    toJSON() {
      return { id_usuario: 7, id_rol: ROLES.ADMINISTRATIVO };
    },
  }));
}

test("sin token responde 401", async () => {
  const srv = await obtenerServidor();
  const res = await srv.request("POST", RUTA, {
    body: { email: "a@tecnica2.edu.ar", contrasena: "x" },
  });
  assert.equal(res.status, 401);
});

test("no root no puede verificar el email de otro usuario", async (t) => {
  mockearPermisosDeRol(t, { [ROLES.ADMINISTRATIVO]: [] });
  t.mock.method(
    Usuario,
    "findOne",
    async () => {
      throw new Error("no debe consultar la base");
    },
  );

  const srv = await obtenerServidor();
  const res = await srv.request("POST", RUTA, {
    token: token({ id_rol: ROLES.ADMINISTRATIVO, email: "propio@tecnica2.edu.ar" }),
    body: { email: "otro@tecnica2.edu.ar", contrasena: "x" },
  });

  assert.equal(res.status, 403);
  assert.match(res.data.error, /propia contrase/);
});

test("root sí puede verificar otro email", async (t) => {
  mockearPermisosDeRol(t, {
    [ROLES.ROOT]: ["administrativo_editar_usuario"],
  });
  mockearVerificacion(t);

  const srv = await obtenerServidor();
  const res = await srv.request("POST", RUTA, {
    token: token({ id_rol: ROLES.ROOT, email: "root@tecnica2.edu.ar" }),
    body: { email: "otro@tecnica2.edu.ar", contrasena: "correcta" },
  });

  // bcrypt real contra hash ficticio -> 401 de credenciales, pero pasó el 403.
  assert.equal(res.status, 401);
  assert.match(res.data.error, /incorrecta/i);
});

test("tras 10 intentos el limitador responde 429", async (t) => {
  mockearPermisosDeRol(t, { [ROLES.ADMINISTRATIVO]: [] });
  const mockFindOne = t.mock.method(Usuario, "findOne", async () => null);

  const srv = await obtenerServidor();
  const propio = token({ id_rol: ROLES.ADMINISTRATIVO, email: "propio@tecnica2.edu.ar" });
  let ultimo = null;
  for (let i = 0; i < 11; i++) {
    ultimo = await srv.request("POST", RUTA, {
      token: propio,
      body: { email: "propio@tecnica2.edu.ar", contrasena: "mala" },
    });
  }

  assert.equal(ultimo.status, 429);
  assert.equal(mockFindOne.mock.calls.length <= 10, true);
});
