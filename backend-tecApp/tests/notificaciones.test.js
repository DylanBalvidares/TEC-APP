import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { fila } from "./helpers/crud.js";
import Notificacion from "../src/db/models/notificacion-model.js";
import NotificacionPreferencia from "../src/db/models/notificacion-preferencia-model.js";
import { seleccionarCanal } from "../src/utils/notificaciones.js";
import { suscribir, limpiarSuscriptores } from "../src/utils/eventos.js";
import {
  crearNotificacion,
  crearNotificacionMasiva,
  marcarNotificacionLeida,
  marcarTodasLeidas,
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

test("crearNotificacion emite el SSE dirigido: solo lee el dueño", async (t) => {
  t.mock.method(Notificacion, "create", async (d) => ({ id_notificacion: 9, ...d }));
  t.mock.method(NotificacionPreferencia, "findByPk", async () => null);

  const recibidos = [];
  const recibidosOtros = [];
  const fuera4 = suscribir({ write: (e) => recibidos.push(e) }, { id_usuario: 4 });
  const fuera99 = suscribir({ write: (e) => recibidosOtros.push(e) }, { id_usuario: 99 });
  try {
    await crearNotificacion({ id_usuario: 4, tipo: "nota", titulo: "Nueva nota" });
  } finally {
    fuera4();
    fuera99();
    limpiarSuscriptores();
  }
  assert.equal(recibidos.length, 1);
  assert.equal(recibidos[0].tipo, "notificacion");
  assert.equal(recibidos[0].datos.id_usuario, 4);
  assert.equal(recibidos[0].datos.id_notificacion, 9);
  // El envío es dirigido: otro usuario conectado no ve la notificación.
  assert.equal(recibidosOtros.length, 0);
});

test("crearNotificacionMasiva deduplica y emite por fila", async (t) => {
  const creados = [];
  t.mock.method(Notificacion, "bulkCreate", async (datos) => {
    creados.push(...datos);
    return datos.map((d, i) => fila({ id_notificacion: 100 + i, ...d }));
  });

  // Suscriptores con identidad: cada uno solo recibe lo suyo.
  const buzones = new Map();
  const fueraDiez = suscribir({ write: (e) => buzones.set(10, [...(buzones.get(10) || []), e]) }, { id_usuario: 10 });
  const fueraVeinte = suscribir({ write: (e) => buzones.set(20, [...(buzones.get(20) || []), e]) }, { id_usuario: 20 });
  try {
    const r = await crearNotificacionMasiva([10, 20, 10, null], {
      tipo: "comunicado",
      titulo: "Comunicado general",
      cuerpo: "texto",
    });

    assert.equal(r.creadas, 2);
    assert.deepEqual(creados.map((n) => n.id_usuario).sort(), [10, 20]);
    assert.equal(creados[0].titulo, "Comunicado general");
    assert.equal(creados[0].tipo, "comunicado");
    assert.equal((buzones.get(10) || []).length, 1);
    assert.equal((buzones.get(20) || []).length, 1);
    assert.equal(buzones.get(10)[0].datos.id_notificacion, 100);
    assert.equal(buzones.get(20)[0].datos.id_notificacion, 101);
  } finally {
    fueraDiez();
    fueraVeinte();
    limpiarSuscriptores();
  }
});

test("crearNotificacionMasiva sin destinatarios no crea nada", async () => {
  const r = await crearNotificacionMasiva([], { tipo: "nota", titulo: "x" });
  assert.equal(r.creadas, 0);
  await assert.rejects(
    crearNotificacionMasiva([10], { tipo: "nota", titulo: "  " }),
    /título/i,
  );
});

test("marcarTodasLeidas actualiza solo las propias", async (t) => {
  const llamadas = [];
  t.mock.method(Notificacion, "update", async (valores, opciones) => {
    llamadas.push({ valores, opciones });
    return [2];
  });

  const r = await marcarTodasLeidas(7);
  assert.equal(r.actualizadas, 2);
  assert.equal(llamadas[0].valores.leida, true);
  assert.equal(llamadas[0].opciones.where.id_usuario, 7);
  assert.equal(llamadas[0].opciones.where.leida, false);

  await assert.rejects(marcarTodasLeidas(0), /destinatario/);
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
