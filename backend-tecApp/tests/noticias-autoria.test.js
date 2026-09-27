import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import {
  actualizarNoticia,
  crearNoticia,
  eliminarNoticia,
} from "../src/modules/comunidad/noticias-controller.js";
import Noticia from "../src/db/models/noticias-model.js";

after(cerrarServidor);

const NOTICIA_PROPIA = { autor_id: 10 };
const NOTICIA_AJENA = { autor_id: 99 };

function mockearNoticia(t, noticia = NOTICIA_PROPIA) {
  t.mock.method(Noticia, "findByPk", async () => noticia);
  t.mock.method(Noticia, "update", async () => [1]);
  t.mock.method(Noticia, "destroy", async () => 1);
}

function mockearCreacion(t) {
  const creadas = [];
  t.mock.method(Noticia, "create", async (datos) => {
    creadas.push(datos);
    return { id_noticia: 1, ...datos };
  });
  return creadas;
}

const PERMISOS_DELEGADO = {
  [ROLES.DELEGADO]: [
    "delegado_crear_noticia",
    "delegado_editar_mis_noticias",
    "delegado_eliminar_mis_noticias",
  ],
  [ROLES.ROOT]: ["root_eliminar_cualquier_contenido"],
};

test("S6: editar noticia ajena sin ser root responde 403 (unitario)", async (t) => {
  mockearNoticia(t, NOTICIA_AJENA);

  await assert.rejects(
    () => actualizarNoticia(1, { titulo: "x" }, { idUsuario: 10 }),
    (error) => error.status === 403 || error.statusCode === 403,
  );
});

test("S6: eliminar noticia ajena sin ser root responde 403 (unitario)", async (t) => {
  mockearNoticia(t, NOTICIA_AJENA);

  await assert.rejects(
    () => eliminarNoticia(1, { idUsuario: 10 }),
    (error) => error.status === 403 || error.statusCode === 403,
  );
});

test("S6: el autor edita su noticia (unitario)", async (t) => {
  mockearNoticia(t, NOTICIA_PROPIA);
  const filas = await actualizarNoticia(
    1,
    { titulo: "nuevo" },
    { idUsuario: 10 },
  );
  assert.equal(filas, 1);
});

test("S6: root edita noticia ajena (unitario)", async (t) => {
  mockearNoticia(t, NOTICIA_AJENA);
  const filas = await eliminarNoticia(1, { idUsuario: 8, esRoot: true });
  assert.equal(filas, 1);
});

test("S7: el autor_id del body se ignora y se persiste el del token (unitario)", async (t) => {
  const creadas = mockearCreacion(t);
  await crearNoticia({ titulo: "t", contenido: "c", autor_id: 999 }, null, 10);
  assert.equal(creadas.length, 1);
  assert.equal(creadas[0].autor_id, 10);
});

test("S6+S7: DELETE /noticias/:id de otro autor responde 403 (e2e)", async (t) => {
  mockearPermisosDeRol(t, PERMISOS_DELEGADO);
  t.mock.method(Noticia, "findByPk", async () => NOTICIA_AJENA);

  const srv = await obtenerServidor();
  const res = await srv.request("DELETE", "/api/comunidad/noticias/1", {
    token: token({ id: 10, id_rol: ROLES.DELEGADO }),
  });

  assert.equal(res.status, 403);
});
