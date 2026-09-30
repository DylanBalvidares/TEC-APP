import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import {
  Alumno,
  Asignacion,
  Curso,
  Personal,
  Profesor,
  MensajeWhatsapp,
} from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  enviarWhatsappAAlumno,
  listarMisMensajes,
  listarTodosMensajes,
  reenviarMensaje,
  eliminarMensaje,
  diagnosticarTelefonos,
  marcarMensajeLeido,
} from "../src/modules/comunidad/mensajes-controller.js";

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

const ALUMNO = {
  id_alumno: 1,
  id_curso: 2,
  nombre: "Ana",
  apellido: "Paz",
  telefono_tutor: "2901123456",
};

function alumnoConTelefono(t, datos = {}) {
  t.mock.method(Alumno, "findByPk", async () => fila({ ...ALUMNO, ...datos }));
}

test("enviarWhatsappAAlumno valida y envia en stub", async (t) => {
  await assert.rejects(enviarWhatsappAAlumno(0, "hola", 4, 4), /inválido/);
  await assert.rejects(enviarWhatsappAAlumno(1, "  ", 4, 4), /obligatorio/);
  await assert.rejects(enviarWhatsappAAlumno(1, "x".repeat(1001), 4, 4), /1000/);

  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(enviarWhatsappAAlumno(99, "hola", 4, 4), /No se encontró/);

  // Preceptor con curso a cargo (personal + curso propio).
  alumnoConTelefono(t);
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  t.mock.method(Curso, "findAll", async () => [{ id_curso: 2 }]);
  const creados = [];
  t.mock.method(MensajeWhatsapp, "create", async (d) => {
    creados.push(d);
    return fila({ id_mensaje: 3, ...d });
  });
  const res = await enviarWhatsappAAlumno(1, "Hola tutor", 4, 4);
  assert.equal(res.id_mensaje, 3);
  assert.equal(creados[0].estado, "enviado");
  assert.match(creados[0].telefono_destino, /^549/);

  // Preceptor de otro curso → 403.
  t.mock.method(Curso, "findAll", async () => [{ id_curso: 9 }]);
  await assert.rejects(enviarWhatsappAAlumno(1, "Hola", 4, 4), /permiso/);

  // Sin teléfono de tutor → 404.
  alumnoConTelefono(t, { telefono_tutor: null });
  t.mock.method(Curso, "findAll", async () => [{ id_curso: 2 }]);
  await assert.rejects(enviarWhatsappAAlumno(1, "Hola", 4, 4), /teléfono de tutor/);
});

test("listados con filtros y paginación acotada", async (t) => {
  const buscar = t.mock.method(MensajeWhatsapp, "findAndCountAll", async () => ({
    count: 1,
    rows: filas([{ id_mensaje: 1 }]),
  }));
  const mios = await listarMisMensajes(4, { limit: 500 });
  assert.equal(mios.total, 1);
  // El límite se acota a 200.
  assert.equal(buscar.mock.calls[0].arguments[0].limit, 200);

  t.mock.method(MensajeWhatsapp, "findAndCountAll", async () => ({ count: 0, rows: [] }));
  const todos = await listarTodosMensajes({ estado: "enviado", buscar: "hola" });
  assert.equal(todos.total, 0);
});

test("reenviar, eliminar y marcar leido", async (t) => {
  t.mock.method(MensajeWhatsapp, "findByPk", async () => null);
  await assert.rejects(reenviarMensaje(99, 4), /no encontrado/i);
  await assert.rejects(eliminarMensaje(99), /no encontrado/i);
  await assert.rejects(marcarMensajeLeido(99), /no encontrado/i);

  t.mock.method(MensajeWhatsapp, "findByPk", async () =>
    fila({
      id_mensaje: 1,
      id_destinatario: 1,
      telefono_destino: "5492901123456",
      nombre_destinatario: "Tutor de Ana Paz",
      cuerpo: "Hola",
      leido: false,
      update: async () => [1],
      destroy: async () => 1,
    }),
  );
  t.mock.method(MensajeWhatsapp, "create", async (d) => fila({ id_mensaje: 2, ...d }));
  const re = await reenviarMensaje(1, 4);
  assert.equal(re.mensaje, "Mensaje reenviado");

  const del = await eliminarMensaje(1);
  assert.match(del.mensaje, /eliminado/);

  const leido = await marcarMensajeLeido(1);
  assert.match(leido.mensaje, /leído/);
});

test("diagnosticarTelefonos agrega por tipo", async (t) => {
  t.mock.method(Alumno, "findAll", async () => [
    { id_alumno: 1, nombre: "Ana", apellido: "Paz", telefono_tutor: "mal" },
  ]);
  t.mock.method(Profesor, "findAll", async () => [
    { id_profesor: 2, nombre: "Juan", apellido: "P", telefono: "2901123456" },
  ]);
  t.mock.method(Personal, "findAll", async () => []);
  const res = await diagnosticarTelefonos();
  assert.equal(res.total_revisados, 2);
  assert.equal(res.total_invalidos, 1);
  assert.equal(res.invalidos[0].tipo, "alumno");
});

test("rutas /mensajes: permisos y flujos", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: [
      "whatsapp_enviar",
      "whatsapp_ver_propio",
      "whatsapp_ver_todos",
      "whatsapp_gestionar",
    ],
  });
  alumnoConTelefono(t);
  t.mock.method(MensajeWhatsapp, "create", async (d) => fila({ id_mensaje: 3, ...d }));
  t.mock.method(MensajeWhatsapp, "findAndCountAll", async () => ({
    count: 1,
    rows: filas([{ id_mensaje: 1 }]),
  }));
  t.mock.method(MensajeWhatsapp, "findByPk", async () =>
    fila({
      id_mensaje: 1,
      id_destinatario: 1,
      telefono_destino: "5492901123456",
      nombre_destinatario: "Tutor",
      cuerpo: "Hola",
      leido: false,
      update: async () => [1],
      destroy: async () => 1,
    }),
  );
  t.mock.method(Alumno, "findAll", async () => []);
  t.mock.method(Profesor, "findAll", async () => []);
  t.mock.method(Personal, "findAll", async () => []);
  // Root salta el chequeo de ámbito: Personal.findOne no se usa.
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/comunidad/mensajes/mios");
  await sinPermiso(srv, "GET", "/api/comunidad/mensajes/todos");

  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  const validar = await srv.request("POST", "/api/comunidad/mensajes/validar", {
    ...auth,
    body: { telefono: "2901123456" },
  });
  assert.equal(validar.status, 200);

  const enviar = await srv.request("POST", "/api/comunidad/mensajes/enviar-alumno/1", {
    ...auth,
    body: { cuerpo: "Hola tutor" },
  });
  assert.equal(enviar.status, 201);

  const mios = await srv.request("GET", "/api/comunidad/mensajes/mios", auth);
  assert.equal(mios.status, 200);

  const todos = await srv.request("GET", "/api/comunidad/mensajes/todos", auth);
  assert.equal(todos.status, 200);

  const diag = await srv.request("GET", "/api/comunidad/mensajes/diagnostico-telefonos", auth);
  assert.equal(diag.status, 200);

  const reenviar = await srv.request("POST", "/api/comunidad/mensajes/1/reenviar", auth);
  assert.equal(reenviar.status, 201);

  const leido = await srv.request("PATCH", "/api/comunidad/mensajes/1/leido", auth);
  assert.equal(leido.status, 200);

  const del = await srv.request("DELETE", "/api/comunidad/mensajes/1", auth);
  assert.equal(del.status, 200);
});
