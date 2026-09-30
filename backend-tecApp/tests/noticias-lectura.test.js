import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import Noticia from "../src/db/models/noticias-model.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerTodasNoticias,
  obtenerNoticia,
} from "../src/modules/comunidad/noticias-controller.js";

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

const NOTICIA = { id_noticia: 1, titulo: "Acto", contenido: "A las 10", autor_id: 10, imagen: null };

test("obtenerTodasNoticias mapea imagen_url y 404 vacía", async (t) => {
  t.mock.method(Noticia, "findAll", async () => []);
  await assert.rejects(obtenerTodasNoticias(), /No se encontraron/);

  t.mock.method(Noticia, "findAll", async () => [
    { ...NOTICIA, imagen: "foto.jpg", toJSON: () => ({ ...NOTICIA, imagen: "foto.jpg" }) },
    { ...NOTICIA, id_noticia: 2, toJSON: () => ({ ...NOTICIA, id_noticia: 2 }) },
  ]);
  const res = await obtenerTodasNoticias();
  assert.equal(res.noticias.length, 2);
  assert.equal(res.noticias[0].imagen_url, "/api/comunidad/uploads/foto.jpg");
  assert.equal(res.noticias[1].imagen_url, null);
});

test("obtenerNoticia valida y 404", async (t) => {
  await assert.rejects(obtenerNoticia(-1), /inválido/);
  t.mock.method(Noticia, "findByPk", async () => null);
  await assert.rejects(obtenerNoticia(99), /no encontrada/i);
  t.mock.method(Noticia, "findByPk", async () => fila(NOTICIA));
  assert.equal((await obtenerNoticia(1)).id_noticia, 1);
});

test("rutas /noticias: lectura, alta y edición propia", async (t) => {
  await permisos(t, {
    [ROLES.DELEGADO]: ["delegado_crear_noticia", "delegado_editar_mis_noticias"],
  });
  t.mock.method(Noticia, "findAll", async () => [{ toJSON: () => ({ ...NOTICIA }) }]);
  t.mock.method(Noticia, "findByPk", async () => fila(NOTICIA));
  t.mock.method(Noticia, "create", async (d) => fila({ id_noticia: 5, ...d }));
  t.mock.method(Noticia, "update", async () => [1]);
  const srv = await obtenerServidor();
  // El autor es el id 10 del token: la edición propia pasa autoría.
  const autor = { token: token({ id: 10, id_rol: ROLES.DELEGADO }) };

  await sinToken(srv, "GET", "/api/comunidad/noticias");
  await sinPermiso(srv, "POST", "/api/comunidad/noticias", {
    body: { titulo: "x", contenido: "y" },
  });

  const lista = await srv.request("GET", "/api/comunidad/noticias", autor);
  assert.equal(lista.status, 200);
  assert.equal(lista.data.noticias.length, 1);

  const una = await srv.request("GET", "/api/comunidad/noticias/1", autor);
  assert.equal(una.status, 200);

  const creada = await srv.request("POST", "/api/comunidad/noticias", {
    ...autor,
    body: { titulo: "Acto", contenido: "A las 10", autor_id: 999 },
  });
  assert.equal(creada.status, 201);
  // S7: el autor sale del token, no del body.
  assert.equal(creada.data.noticia.autor_id, 10);

  const mod = await srv.request("PATCH", "/api/comunidad/noticias/1", {
    ...autor,
    body: { titulo: "Acto modificado" },
  });
  assert.equal(mod.status, 200);
});
