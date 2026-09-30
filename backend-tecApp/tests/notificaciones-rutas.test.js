import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken } from "./helpers/crud.js";
import Notificacion from "../src/db/models/notificacion-model.js";
import NotificacionPreferencia from "../src/db/models/notificacion-preferencia-model.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  listarMisNotificaciones,
  obtenerPreferencias,
} from "../src/modules/comunidad/notificaciones-controller.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

test("listarMisNotificaciones filtra no leídas", async (t) => {
  const buscar = t.mock.method(Notificacion, "findAndCountAll", async () => ({
    count: 1,
    rows: filas([{ id_notificacion: 1 }]),
  }));
  const todas = await listarMisNotificaciones(4);
  assert.equal(todas.total, 1);
  assert.deepEqual(buscar.mock.calls[0].arguments[0].where, { id_usuario: 4 });

  await listarMisNotificaciones(4, { soloNoLeidas: true });
  assert.deepEqual(buscar.mock.calls[1].arguments[0].where, {
    id_usuario: 4,
    leida: false,
  });
});

test("obtenerPreferencias devuelve mapa o vacío", async (t) => {
  t.mock.method(NotificacionPreferencia, "findByPk", async () => null);
  assert.deepEqual(await obtenerPreferencias(4), {});

  t.mock.method(NotificacionPreferencia, "findByPk", async () =>
    fila({ id_usuario: 4, canales: { nota: ["panel"] } }),
  );
  // fila() expone toJSON: el controller lee plano.canales.
  const prefs = await obtenerPreferencias(4);
  assert.deepEqual(prefs, { nota: ["panel"] });
});

test("rutas del centro: mías, leída y preferencias", async (t) => {
  const { Rol } = await import("../src/db/models/index.js");
  t.mock.method(Rol, "findByPk", async () => ({
    toJSON: () => ({ id_rol: 1, permisos: [] }),
  }));
  t.mock.method(Notificacion, "findAndCountAll", async () => ({
    count: 1,
    rows: filas([{ id_notificacion: 1 }]),
  }));
  t.mock.method(Notificacion, "findByPk", async () =>
    fila({ id_notificacion: 1, id_usuario: 4, leida: false, update: async () => [1] }),
  );
  t.mock.method(NotificacionPreferencia, "findByPk", async () =>
    fila({ id_usuario: 4, canales: {} }),
  );
  t.mock.method(NotificacionPreferencia, "findOrCreate", async () => [
    fila({ id_usuario: 4, update: async () => [1] }),
    true,
  ]);
  const srv = await obtenerServidor();
  // id_usuario del token = 4: dueño de la notificación mockeada.
  const auth = { token: token({ id: 4, id_rol: ROLES.ALUMNO }) };

  await sinToken(srv, "GET", "/api/comunidad/notificaciones/mias");

  const mias = await srv.request("GET", "/api/comunidad/notificaciones/mias", auth);
  assert.equal(mias.status, 200);
  assert.equal(mias.data.total, 1);

  const noLeidas = await srv.request(
    "GET",
    "/api/comunidad/notificaciones/mias?noLeidas=1",
    auth,
  );
  assert.equal(noLeidas.status, 200);

  const leida = await srv.request("PATCH", "/api/comunidad/notificaciones/1/leida", auth);
  assert.equal(leida.status, 200);

  const prefs = await srv.request("GET", "/api/comunidad/notificaciones/preferencias", auth);
  assert.equal(prefs.status, 200);

  const guardar = await srv.request("PUT", "/api/comunidad/notificaciones/preferencias", {
    ...auth,
    body: { nota: ["panel"] },
  });
  assert.equal(guardar.status, 200);
});
