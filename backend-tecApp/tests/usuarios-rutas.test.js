import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, sinToken, sinPermiso } from "./helpers/crud.js";
import { Usuario, Rol } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

async function permisos(t, mapa) {
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

test("GET /usuarios/buscar y /usuarios/:id", async (t) => {
  await permisos(t, { [ROLES.ROOT]: ["administrativo_editar_usuario"] });
  t.mock.method(Usuario, "findOne", async () => fila({ id_usuario: 1 }));
  t.mock.method(Usuario, "findByPk", async () => fila({ id_usuario: 1 }));
  const srv = await obtenerServidor();
  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  await sinToken(srv, "GET", "/api/usuarios/usuarios/buscar?email=a@b.c");
  await sinPermiso(srv, "GET", "/api/usuarios/usuarios/buscar?email=a@b.c");

  const buscar = await srv.request(
    "GET",
    "/api/usuarios/usuarios/buscar?email=a@b.c",
    auth,
  );
  assert.equal(buscar.status, 200);

  const uno = await srv.request("GET", "/api/usuarios/usuarios/1", auth);
  assert.equal(uno.status, 200);

  t.mock.method(Usuario, "findByPk", async () => null);
  const ausente = await srv.request("GET", "/api/usuarios/usuarios/99", auth);
  assert.equal(ausente.status, 404);
});

test("PUT y DELETE /roles/:id", async (t) => {
  t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) {
      const lista =
        Number(id) === ROLES.ROOT ? [{ nombre_permiso: "root_gestionar_roles" }] : [];
      return { toJSON: () => ({ id_rol: Number(id), permisos: lista }) };
    }
    if (Number(id) === 9) {
      return fila({ id_rol: 9, update: async () => [1], destroy: async () => 1 });
    }
    if (Number(id) >= 1 && Number(id) <= 8) {
      return fila({ id_rol: Number(id) });
    }
    return null;
  });
  t.mock.method(Rol, "findOne", async () => null);
  t.mock.method(Usuario, "count", async () => 0);
  const srv = await obtenerServidor();
  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  await sinToken(srv, "PUT", "/api/usuarios/roles/9", { body: {} });
  await sinPermiso(srv, "PUT", "/api/usuarios/roles/9", { body: {} });

  const mod = await srv.request("PUT", "/api/usuarios/roles/9", {
    ...auth,
    body: { nombre_rol: "Auxiliar" },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/usuarios/roles/9", auth);
  assert.equal(del.status, 200);
  assert.equal(del.data.ok, true);

  const sistema = await srv.request("DELETE", "/api/usuarios/roles/3", auth);
  assert.equal(sistema.status, 400);
});
