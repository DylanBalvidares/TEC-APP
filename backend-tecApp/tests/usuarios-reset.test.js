import { test, after } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { Usuario } from "../src/db/models/index.js";
import { restablecerContrasena } from "../src/modules/usuarios/usuarios-controller.js";

after(cerrarServidor);

function usuarioFalso() {
  return { id_usuario: 7, email: "reset@tecnica2.edu.ar", contrasena: "vieja" };
}

test("restablecerContrasena genera temporal y guarda hash bcrypt", async (t) => {
  let guardado = null;
  t.mock.method(Usuario, "findByPk", async () => usuarioFalso());
  t.mock.method(Usuario, "update", async (valores) => {
    guardado = valores;
    return [1];
  });

  const resultado = await restablecerContrasena(7);

  assert.equal(resultado.ok, true);
  assert.match(resultado.contrasena_temporal, /^[A-Za-z0-9_-]{12}$/);
  assert.ok(await bcrypt.compare(resultado.contrasena_temporal, guardado.contrasena));
});

test("restablecerContrasena con id inválido o inexistente falla", async (t) => {
  await assert.rejects(restablecerContrasena(null), /inválida/);
  t.mock.method(Usuario, "findByPk", async () => null);
  await assert.rejects(restablecerContrasena(999), /no encontrado/i);
});

test("POST /usuarios/:id/restablecer-contrasena exige permiso", async (t) => {
  t.mock.method(Usuario, "findByPk", async () => usuarioFalso());
  t.mock.method(Usuario, "update", async () => [1]);
  mockearPermisosDeRol(t, {
    [ROLES.ROOT]: ["administrativo_editar_usuario"],
  });
  const srv = await obtenerServidor();

  const sinPermiso = await srv.request("POST", "/api/usuarios/usuarios/7/restablecer-contrasena", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
  });
  assert.equal(sinPermiso.status, 403);

  const conPermiso = await srv.request("POST", "/api/usuarios/usuarios/7/restablecer-contrasena", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(conPermiso.status, 200);
  assert.equal(conPermiso.data.ok, true);
  assert.match(conPermiso.data.contrasena_temporal, /^[A-Za-z0-9_-]{12}$/);
  assert.ok(!("contrasena" in conPermiso.data) || conPermiso.data.contrasena === undefined);
});
