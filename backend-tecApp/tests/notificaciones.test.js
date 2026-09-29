import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import Notificacion from "../src/db/models/notificacion-model.js";
import NotificacionPreferencia from "../src/db/models/notificacion-preferencia-model.js";
import { seleccionarCanal } from "../src/utils/notificaciones.js";
import {
  crearNotificacion,
  marcarNotificacionLeida,
  guardarPreferencias,
} from "../src/modules/comunidad/notificaciones-controller.js";

after(cerrarServidor);

test("seleccionarCanal combina defecto y preferencias", () => {
  assert.deepEqual(seleccionarCanal("inasistencia", {}), ["panel", "whatsapp"]);
  assert.deepEqual(seleccionarCanal("nota", {}), ["panel"]);
  assert.deepEqual(seleccionarCanal("desconocido", {}), ["panel"]);
  assert.deepEqual(seleccionarCanal("inasistencia", { inasistencia: false }), []);
  assert.deepEqual(seleccionarCanal("reunion", { reunion: ["email", "sms"] }), ["email"]);
});

test("crearNotificacion valida y devuelve canales", async (t) => {
  t.mock.method(Notificacion, "create", async (d) => ({ id_notificacion: 1, ...d }));
  t.mock.method(NotificacionPreferencia, "findByPk", async () => null);

  await assert.rejects(crearNotificacion({ tipo: "x", titulo: "T" }), /destinatario/);
  const r = await crearNotificacion({ id_usuario: 4, tipo: "sancion", titulo: "Apercibido" });
  assert.equal(r.notificacion.id_notificacion, 1);
  assert.deepEqual(r.canales, ["panel", "whatsapp"]);
});

test("crearNotificacion emite evento SSE para el destinatario", async (t) => {
  t.mock.method(Notificacion, "create", async (d) => ({ id_notificacion: 9, ...d }));
  t.mock.method(NotificacionPreferencia, "findByPk", async () => null);
  const recibidos = [];
  const { suscribir, limpiarSuscriptores } = await import("../src/utils/eventos.js");
  const fuera = suscribir({ write: (e) => recibidos.push(e) });
  try {
    await crearNotificacion({ id_usuario: 4, tipo: "nota", titulo: "Nueva nota" });
  } finally {
    fuera();
    limpiarSuscriptores();
  }
  assert.equal(recibidos.length, 1);
  assert.equal(recibidos[0].tipo, "notificacion");
  assert.equal(recibidos[0].datos.id_usuario, 4);
  assert.equal(recibidos[0].datos.id_notificacion, 9);
});

test("marcarNotificacionLeida solo la propia", async (t) => {
  t.mock.method(Notificacion, "findByPk", async () => ({
    id_usuario: 4,
    leida: false,
    update: async () => true,
  }));

  const ok = await marcarNotificacionLeida(4, 1);
  assert.equal(ok.mensaje, "Notificación marcada como leída");
  await assert.rejects(marcarNotificacionLeida(5, 1), /no es tu notificación/);
});

test("guardarPreferencias rechaza valores inválidos", async (t) => {
  const fila = { update: async () => true };
  t.mock.method(NotificacionPreferencia, "findOrCreate", async () => [fila, true]);

  const prefs = await guardarPreferencias(4, { inasistencia: ["whatsapp"], nota: false });
  assert.deepEqual(prefs, { inasistencia: ["whatsapp"], nota: false });
  await assert.rejects(guardarPreferencias(4, { nota: "sms" }), /inválida/);
});

test("rutas propias exigen autenticación y aíslan por usuario", async (t) => {
  t.mock.method(Notificacion, "findAndCountAll", async () => ({ count: 1, rows: [{ id_notificacion: 1 }] }));
  mockearPermisosDeRol(t, {});
  const srv = await obtenerServidor();

  const sinToken = await srv.request("GET", "/api/comunidad/notificaciones/mias");
  assert.equal(sinToken.status, 401);

  const mias = await srv.request("GET", "/api/comunidad/notificaciones/mias", {
    token: token({ id_rol: ROLES.ALUMNO }),
  });
  assert.equal(mias.status, 200);
  assert.equal(mias.data.total, 1);
});
