import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import { Alumno, Personal, Curso, Correo } from "../src/db/models/index.js";
import Notificacion from "../src/db/models/notificacion-model.js";
import NotificacionPreferencia from "../src/db/models/notificacion-preferencia-model.js";
import sequelize from "../src/db/conexionDB.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  fijarTransporter,
  reiniciarTransporter,
} from "../src/utils/sendMail.js";
import {
  enviarEmailAAlumno,
  obtenerCorreosDeAlumno,
  marcarCorreoLeido,
} from "../src/modules/academico/email-controller.js";

after(() => {
  cerrarServidor();
  reiniciarTransporter();
});
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
  id_usuario: 10,
  nombre: "Ana",
  apellido: "Paz",
};

function accesoPreceptor(t) {
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  t.mock.method(Curso, "findAll", async () => [{ id_curso: 2 }]);
}

function mailOk(t) {
  const enviados = [];
  fijarTransporter({
    sendMail: async (opciones) => {
      enviados.push(opciones);
      return { messageId: "mail-1" };
    },
  });
  t.mock.method(Correo, "create", async (d) => fila({ id_correo: 1, ...d }));
  return enviados;
}

function emailEnDb(t, email = "ana@tecnica2.edu.ar") {
  t.mock.method(sequelize, "query", async () => [{ email }]);
}

test("enviarEmailAAlumno valida, envía y persiste", async (t) => {
  mailOk(t);
  await assert.rejects(enviarEmailAAlumno(1, {}, 4), /obligatorios/);
  await assert.rejects(
    enviarEmailAAlumno(-1, { asunto: "a", mensaje: "m" }, 4),
    /inválido/,
  );

  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(
    enviarEmailAAlumno(99, { asunto: "a", mensaje: "m" }, 4),
    /No se encontró/,
  );

  t.mock.method(Alumno, "findByPk", async () => fila({ ...ALUMNO }));
  accesoPreceptor(t);
  emailEnDb(t);
  const res = await enviarEmailAAlumno(1, { asunto: "Nota", mensaje: "Hola" }, 4);
  assert.match(res.mensaje, /ana@tecnica2\.edu\.ar/);
});

test("enviarEmailAAlumno usa el email del legajo si no hay cuenta de usuario", async (t) => {
  const enviados = mailOk(t);
  t.mock.method(Alumno, "findByPk", async () =>
    fila({ ...ALUMNO, id_usuario: null, email: "ana.paz@gmail.com" }),
  );
  accesoPreceptor(t);

  const res = await enviarEmailAAlumno(1, { asunto: "Nota", mensaje: "Hola" }, 4);
  assert.match(res.mensaje, /ana\.paz@gmail\.com/);
  assert.equal(enviados[0].to, "ana.paz@gmail.com");
});

test("enviarEmailAAlumno prefiere el email de la cuenta sobre el del legajo", async (t) => {
  mailOk(t);
  t.mock.method(Alumno, "findByPk", async () =>
    fila({ ...ALUMNO, email: "ana.paz@gmail.com" }),
  );
  accesoPreceptor(t);
  emailEnDb(t); // email de la cuenta: ana@tecnica2.edu.ar

  const res = await enviarEmailAAlumno(1, { asunto: "Nota", mensaje: "Hola" }, 4);
  assert.match(res.mensaje, /ana@tecnica2\.edu\.ar/);
});

test("enviarEmailAAlumno rechaza si no hay cuenta ni email de legajo", async (t) => {
  mailOk(t);
  t.mock.method(Alumno, "findByPk", async () =>
    fila({ ...ALUMNO, id_usuario: null }),
  );
  accesoPreceptor(t);

  await assert.rejects(
    enviarEmailAAlumno(1, { asunto: "Nota", mensaje: "Hola" }, 4),
    /cuenta de usuario ni email/,
  );
});

test("enviarEmailAAlumno persiste fallido si el mailer falla", async (t) => {
  fijarTransporter({
    sendMail: async () => {
      throw new Error("smtp caído");
    },
  });
  const creados = [];
  t.mock.method(Correo, "create", async (d) => {
    creados.push(d);
    return fila({ id_correo: 1, ...d });
  });
  t.mock.method(Alumno, "findByPk", async () => fila({ ...ALUMNO }));
  accesoPreceptor(t);
  emailEnDb(t);

  await assert.rejects(
    enviarEmailAAlumno(1, { asunto: "Nota", mensaje: "Hola" }, 4),
    /smtp caído|Error al enviar/,
  );
  assert.equal(creados[0].estado, "fallido");
});

test("enviarEmailAAlumno exige preceptor del curso", async (t) => {
  mailOk(t);
  t.mock.method(Alumno, "findByPk", async () => fila({ ...ALUMNO }));
  t.mock.method(Personal, "findOne", async () => null);
  await assert.rejects(
    enviarEmailAAlumno(1, { asunto: "a", mensaje: "m" }, 4),
    /personal/,
  );
});

test("enviarEmailAAlumno deja notificación de panel al alumno con cuenta", async (t) => {
  mailOk(t);
  t.mock.method(Alumno, "findByPk", async () => fila({ ...ALUMNO })); // id_usuario 10
  accesoPreceptor(t);
  emailEnDb(t);

  const notificaciones = [];
  t.mock.method(Notificacion, "create", async (d) => {
    notificaciones.push(d);
    return fila({ id_notificacion: 5, ...d });
  });
  t.mock.method(NotificacionPreferencia, "findByPk", async () => null);

  const res = await enviarEmailAAlumno(1, { asunto: "Informe", mensaje: "Detalle" }, 4);
  assert.match(res.mensaje, /enviado/);
  assert.equal(notificaciones.length, 1);
  assert.equal(notificaciones[0].id_usuario, 10);
  assert.equal(notificaciones[0].tipo, "comunicado");
  assert.equal(notificaciones[0].titulo, "Informe");

  // Un alumno sin cuenta no puede recibir notificación: no hay id_usuario.
  t.mock.method(Alumno, "findByPk", async () =>
    fila({ ...ALUMNO, id_usuario: null, email: "ana.paz@gmail.com" }),
  );
  await enviarEmailAAlumno(1, { asunto: "Nota", mensaje: "Hola" }, 4);
  assert.equal(notificaciones.length, 1);
});

test("el fallo de la notificación no rompe el envío del email", async (t) => {
  mailOk(t);
  t.mock.method(Alumno, "findByPk", async () => fila({ ...ALUMNO }));
  accesoPreceptor(t);
  emailEnDb(t);
  t.mock.method(Notificacion, "create", async () => {
    throw new Error("db caída al notificar");
  });

  const res = await enviarEmailAAlumno(1, { asunto: "Nota", mensaje: "Hola" }, 4);
  assert.match(res.mensaje, /enviado/);
});

test("obtenerCorreosDeAlumno y marcarCorreoLeido", async (t) => {
  await assert.rejects(obtenerCorreosDeAlumno(0, null), /inválido/);
  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(obtenerCorreosDeAlumno(99, null), /No se encontró/);

  t.mock.method(Alumno, "findByPk", async () => fila({ ...ALUMNO }));
  t.mock.method(Correo, "findAll", async () => filas([{ id_correo: 1 }]));
  assert.equal((await obtenerCorreosDeAlumno(1, null)).length, 1);

  await assert.rejects(marcarCorreoLeido(0), /inválido/);
  t.mock.method(Correo, "findByPk", async () => null);
  await assert.rejects(marcarCorreoLeido(99), /No se encontró/);
  t.mock.method(Correo, "findByPk", async () =>
    fila({ id_correo: 1, leido: false, update: async () => [1] }),
  );
  assert.equal((await marcarCorreoLeido(1)).id_correo, 1);
});

test("rutas /correos y /enviar-email con permisos", async (t) => {
  await permisos(t, {
    [ROLES.PRECEPTOR]: ["preceptor_enviar_email_alumno", "alumno_ver_perfil"],
  });
  mailOk(t);
  t.mock.method(Alumno, "findByPk", async () => fila({ ...ALUMNO }));
  accesoPreceptor(t);
  emailEnDb(t);
  t.mock.method(Correo, "findAll", async () => filas([{ id_correo: 1 }]));
  t.mock.method(Correo, "findByPk", async () =>
    fila({ id_correo: 1, leido: false, update: async () => [1] }),
  );
  const srv = await obtenerServidor();
  // token() no permite id_usuario libre: el header lo deriva del id (1).
  const auth = { token: token({ id: 4, id_rol: ROLES.PRECEPTOR }) };

  await sinToken(srv, "GET", "/api/academico/alumnos/1/correos");
  await sinPermiso(srv, "GET", "/api/academico/alumnos/1/correos");

  const lista = await srv.request("GET", "/api/academico/alumnos/1/correos", auth);
  assert.equal(lista.status, 200);

  const leido = await srv.request("PATCH", "/api/academico/correos/1/leido", auth);
  assert.equal(leido.status, 200);

  const enviar = await srv.request("POST", "/api/academico/alumnos/enviar-email/1", {
    ...auth,
    body: { asunto: "Nota", mensaje: "Hola" },
  });
  assert.equal(enviar.status, 200);
});

test("GET correos/enviados devuelve el historial del remitente autenticado", async (t) => {
  await permisos(t, { [ROLES.PRECEPTOR]: ["preceptor_enviar_email_alumno"] });
  t.mock.method(Correo, "findAll", async (opciones) => {
    assert.deepEqual(opciones.where, { id_remitente: 4 });
    return filas([{ id_correo: 9, id_remitente: 4, asunto: "Nota" }]);
  });

  const srv = await obtenerServidor();
  const res = await srv.request("GET", "/api/academico/correos/enviados", {
    token: token({ id: 4, id_rol: ROLES.PRECEPTOR }),
  });

  assert.equal(res.status, 200);
  assert.deepEqual(res.data, [{ id_correo: 9, id_remitente: 4, asunto: "Nota" }]);
});
