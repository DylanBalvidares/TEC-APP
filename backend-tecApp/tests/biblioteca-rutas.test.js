import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import Biblioteca from "../src/db/models/biblioteca-model.js";
import Recurso from "../src/db/models/recursos-model.js";
import Prestamo from "../src/db/models/prestamos-model.js";
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

test("rutas /biblioteca: catálogo abierto y escritura con permiso", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: [
      "biblio_crear_recurso",
      "biblio_editar_recurso",
      "biblio_eliminar_recurso",
    ],
  });
  t.mock.method(Biblioteca, "findAll", async () => filas([{ id_biblioteca: 1 }]));
  t.mock.method(Biblioteca, "findByPk", async () => fila({ id_biblioteca: 1 }));
  t.mock.method(Biblioteca, "create", async (d) => fila({ id_biblioteca: 2, ...d }));
  t.mock.method(Biblioteca, "update", async () => [1]);
  t.mock.method(Biblioteca, "destroy", async () => 1);
  const srv = await obtenerServidor();
  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  await sinToken(srv, "GET", "/api/biblioteca/biblioteca");
  await sinPermiso(srv, "POST", "/api/biblioteca/biblioteca/x", {
    body: { nombre: "Central" },
  });

  const lista = await srv.request("GET", "/api/biblioteca/biblioteca", auth);
  assert.equal(lista.status, 200);

  const una = await srv.request("GET", "/api/biblioteca/biblioteca/1", auth);
  assert.equal(una.status, 200);

  const creada = await srv.request("POST", "/api/biblioteca/biblioteca/x", {
    ...auth,
    body: { nombre: "Central" },
  });
  assert.equal(creada.status, 201);

  const mod = await srv.request("PATCH", "/api/biblioteca/biblioteca/x", {
    ...auth,
    body: { id: 1, nombre: "Central Norte" },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/biblioteca/biblioteca/1", auth);
  assert.equal(del.status, 200);
});

test("rutas /prestamos: lectura y escritura con permiso", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: ["biblio_ver_prestamos", "biblio_editar_prestamo"],
  });
  t.mock.method(Prestamo, "findAll", async () => filas([{ id_prestamo: 1 }]));
  t.mock.method(Prestamo, "findByPk", async () => fila({ id_prestamo: 1 }));
  t.mock.method(Prestamo, "update", async () => [1]);
  t.mock.method(Prestamo, "destroy", async () => 1);
  const srv = await obtenerServidor();
  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  await sinToken(srv, "GET", "/api/biblioteca/prestamos");
  await sinPermiso(srv, "DELETE", "/api/biblioteca/prestamos/1");

  const lista = await srv.request("GET", "/api/biblioteca/prestamos", auth);
  assert.equal(lista.status, 200);

  const uno = await srv.request("GET", "/api/biblioteca/prestamos/1", auth);
  assert.equal(uno.status, 200);

  const mod = await srv.request("PATCH", "/api/biblioteca/prestamos/x", {
    ...auth,
    body: { id_prestamo: 1, estado: "devuelto" },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/biblioteca/prestamos/1", auth);
  assert.equal(del.status, 200);
});

test("rutas /recursos: lectura con permiso", async (t) => {
  await permisos(t, { [ROLES.ROOT]: ["biblio_ver_recursos"] });
  t.mock.method(Recurso, "findAll", async () => filas([{ id_recurso: 1 }]));
  t.mock.method(Recurso, "findByPk", async () => fila({ id_recurso: 1 }));
  const srv = await obtenerServidor();
  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  await sinToken(srv, "GET", "/api/biblioteca/recursos");
  await sinPermiso(srv, "GET", "/api/biblioteca/recursos");

  const lista = await srv.request("GET", "/api/biblioteca/recursos", auth);
  assert.equal(lista.status, 200);

  const uno = await srv.request("GET", "/api/biblioteca/recursos/1", auth);
  assert.equal(uno.status, 200);
});
