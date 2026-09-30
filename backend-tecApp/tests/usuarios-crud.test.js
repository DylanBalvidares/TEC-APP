import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { fila } from "./helpers/crud.js";
import { Usuario, Rol } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  buscarUsuarioPorDni,
  crearUsuario,
  eliminarUsuario,
  modificarUsuario,
} from "../src/modules/usuarios/usuarios-controller.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

const NUEVO = {
  nombre: "Ana",
  apellido: "Paz",
  email: "ana@tecnica2.edu.ar",
  contrasena: "Secreta123",
  id_rol: ROLES.ADMINISTRATIVO,
};

function mockearRolParaCrear(t, permisosPorRol = {}) {
  // Un solo mock de Rol.findByPk: sirve a obtenerPermisosDeRol (con include)
  // y al findByPk propio de crearUsuario (atributos nombre_rol).
  t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) {
      const permisos = (permisosPorRol[Number(id)] || []).map((nombre_permiso) => ({
        nombre_permiso,
      }));
      return { toJSON: () => ({ id_rol: Number(id), permisos }) };
    }
    return { nombre_rol: "administrativo" };
  });
}

test("crearUsuario exige contrasena y guarda hash sin exponerlo", async (t) => {
  await assert.rejects(crearUsuario({ ...NUEVO, contrasena: undefined }), /obligatoria/);

  mockearRolParaCrear(t);
  let guardado = null;
  t.mock.method(Usuario, "create", async (datos) => {
    guardado = datos;
    return fila({ id_usuario: 5, ...datos });
  });

  const res = await crearUsuario({ ...NUEVO });

  assert.equal(res.id_usuario, 5);
  assert.equal(res.email, NUEVO.email);
  assert.ok(!("contrasena" in res));
  assert.ok(await bcrypt.compare(NUEVO.contrasena, guardado.contrasena));
});

test("modificarUsuario valida id, 404 y hashea cambio de clave", async (t) => {
  await assert.rejects(modificarUsuario({ nombre: "X" }), /ID inválida/);

  t.mock.method(Usuario, "update", async () => [0]);
  await assert.rejects(modificarUsuario({ id_usuario: 9 }), /No se encontró/);

  let guardado = null;
  t.mock.method(Usuario, "update", async (datos) => {
    guardado = datos;
    return [1];
  });
  const res = await modificarUsuario({ id_usuario: 9, nombre: "Ana", contrasena: "Nueva123" });
  assert.equal(res.ok, true);
  assert.ok(await bcrypt.compare("Nueva123", guardado.contrasena));
});

test("eliminarUsuario 404 si no hay filas y devuelve conteo", async (t) => {
  t.mock.method(Usuario, "destroy", async () => 0);
  await assert.rejects(eliminarUsuario(9), /No se encontró/);

  t.mock.method(Usuario, "destroy", async () => 1);
  assert.equal(await eliminarUsuario(9), 1);
});

test("buscarUsuarioPorDni valida y excluye contrasena", async (t) => {
  await assert.rejects(buscarUsuarioPorDni(null), /DNI inválido/);

  const buscar = t.mock.method(Usuario, "findOne", async () => fila({ id_usuario: 3 }));
  await buscarUsuarioPorDni("30123456");
  assert.deepEqual(buscar.mock.calls[0].arguments[0].attributes, {
    exclude: ["contrasena"],
  });

  t.mock.method(Usuario, "findOne", async () => null);
  await assert.rejects(buscarUsuarioPorDni("999"), /no encontrado/i);
});

test("POST /usuarios/registro exige permiso y crea (201)", async (t) => {
  mockearRolParaCrear(t, { [ROLES.ROOT]: ["administrativo_crear_usuario"] });
  t.mock.method(Usuario, "create", async (datos) => fila({ id_usuario: 5, ...datos }));
  const srv = await obtenerServidor();

  const sinToken = await srv.request("POST", "/api/usuarios/usuarios/registro", { body: NUEVO });
  assert.equal(sinToken.status, 401);

  const sinPermiso = await srv.request("POST", "/api/usuarios/usuarios/registro", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
    body: NUEVO,
  });
  assert.equal(sinPermiso.status, 403);

  const ok = await srv.request("POST", "/api/usuarios/usuarios/registro", {
    token: token({ id_rol: ROLES.ROOT }),
    body: NUEVO,
  });
  assert.equal(ok.status, 201);
  assert.ok(!("contrasena" in ok.data));
});

test("PATCH /usuarios y DELETE /usuarios/:id con permisos", async (t) => {
  mockearPermisosDeRol(t, {
    [ROLES.ROOT]: ["administrativo_editar_usuario", "administrativo_eliminar_usuario"],
  });
  // esUsuarioRoot hace findByPk con include rol: usuario común, no root.
  t.mock.method(Usuario, "findByPk", async () => ({
    toJSON: () => ({ id_usuario: 9 }),
    rol: { nombre_rol: "administrativo" },
  }));
  t.mock.method(Usuario, "update", async () => [1]);
  t.mock.method(Usuario, "destroy", async () => 1);
  const srv = await obtenerServidor();

  const delSinToken = await srv.request("DELETE", "/api/usuarios/usuarios/9");
  assert.equal(delSinToken.status, 401);

  const patchSinPermiso = await srv.request("PATCH", "/api/usuarios/usuarios", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
    body: { id_usuario: 9, nombre: "Ana" },
  });
  assert.equal(patchSinPermiso.status, 403);

  const patch = await srv.request("PATCH", "/api/usuarios/usuarios", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { id_usuario: 9, nombre: "Ana" },
  });
  assert.equal(patch.status, 200);

  const del = await srv.request("DELETE", "/api/usuarios/usuarios/9", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(del.status, 200);
  assert.equal(del.data.ok, true);
});
