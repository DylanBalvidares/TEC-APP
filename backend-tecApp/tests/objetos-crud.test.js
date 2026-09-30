import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import ObjetoPerdido from "../src/db/models/objetos-perdidos-model.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerTodosObjetos,
  obtenerObjeto,
  reportarObjeto,
  actualizarEstadoObjeto,
  eliminarObjeto,
} from "../src/modules/comunidad/objetos-perdidos-controller.js";

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

test("obtenerTodosObjetos ordena y 404 vacío", async (t) => {
  const buscar = t.mock.method(ObjetoPerdido, "findAll", async () => []);
  await assert.rejects(obtenerTodosObjetos(), /No se encontraron/);
  assert.deepEqual(buscar.mock.calls[0].arguments[0].order, [
    ["fecha_encontrado", "DESC"],
  ]);
  t.mock.method(ObjetoPerdido, "findAll", async () => filas([{ id_objeto: 1 }]));
  assert.equal((await obtenerTodosObjetos()).length, 1);
});

test("obtenerObjeto valida y 404", async (t) => {
  await assert.rejects(obtenerObjeto(-1), /inválido/);
  t.mock.method(ObjetoPerdido, "findByPk", async () => null);
  await assert.rejects(obtenerObjeto(99), /no encontrado/i);
  t.mock.method(ObjetoPerdido, "findByPk", async () => fila({ id_objeto: 1 }));
  assert.equal((await obtenerObjeto(1)).id_objeto, 1);
});

test("reportarObjeto exige nombre y fija perdido", async (t) => {
  await assert.rejects(reportarObjeto({}), /requerido/);
  const crear = t.mock.method(ObjetoPerdido, "create", async (d) =>
    fila({ id_objeto: 3, ...d }),
  );
  const obj = await reportarObjeto({ nombre: "Mochila" });
  assert.equal(obj.estado, "perdido");
  assert.equal(crear.mock.calls[0].arguments[0].nombre, "Mochila");
});

test("actualizarEstadoObjeto valida flujo de estados", async (t) => {
  await assert.rejects(actualizarEstadoObjeto(0, "perdido"), /inválido/);
  await assert.rejects(actualizarEstadoObjeto(1, "volado"), /inválido/);
  t.mock.method(ObjetoPerdido, "update", async () => [0]);
  await assert.rejects(actualizarEstadoObjeto(9, "reclamado"), /404|encontr/);
  t.mock.method(ObjetoPerdido, "update", async () => [1]);
  assert.equal(await actualizarEstadoObjeto(9, "reclamado"), 1);
});

test("eliminarObjeto 404 o conteo", async (t) => {
  t.mock.method(ObjetoPerdido, "destroy", async () => 0);
  await assert.rejects(eliminarObjeto(9), /no encontrado/i);
  t.mock.method(ObjetoPerdido, "destroy", async () => 1);
  assert.equal(await eliminarObjeto(9), 1);
});

test("rutas /objetos-perdidos: lectura, escritura y 401/403", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: ["administrativo_ver_reportes", "root_eliminar_cualquier_contenido"],
  });
  t.mock.method(ObjetoPerdido, "findAll", async () => filas([{ id_objeto: 1 }]));
  t.mock.method(ObjetoPerdido, "findByPk", async () => fila({ id_objeto: 1 }));
  t.mock.method(ObjetoPerdido, "create", async (d) => fila({ id_objeto: 3, ...d }));
  t.mock.method(ObjetoPerdido, "update", async () => [1]);
  t.mock.method(ObjetoPerdido, "destroy", async () => 1);
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/comunidad/objetos-perdidos");
  await sinPermiso(srv, "PUT", "/api/comunidad/objetos-perdidos/1", {
    body: { estado: "reclamado" },
  });

  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  const lista = await srv.request("GET", "/api/comunidad/objetos-perdidos", auth);
  assert.equal(lista.status, 200);

  const uno = await srv.request("GET", "/api/comunidad/objetos-perdidos/1", auth);
  assert.equal(uno.status, 200);

  const creado = await srv.request("POST", "/api/comunidad/objetos-perdidos", {
    ...auth,
    body: { nombre: "Mochila" },
  });
  assert.equal(creado.status, 201);

  const mod = await srv.request("PUT", "/api/comunidad/objetos-perdidos/1", {
    ...auth,
    body: { estado: "reclamado" },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/comunidad/objetos-perdidos/1", auth);
  assert.equal(del.status, 200);
});
