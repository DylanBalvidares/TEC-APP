import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { fila } from "./helpers/crud.js";
import { Usuario, Alumno, Rol } from "../src/db/models/index.js";
import CodigoVerificacion from "../src/db/models/codigoDeVerificacion-model.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import obtenerJWTSecret from "../src/utils/jwtSecret.js";
import {
  fijarTransporter,
  reiniciarTransporter,
} from "../src/utils/sendMail.js";
import { iniciarRegistro } from "../src/modules/auth/auth-controller.js";
import {
  crearCodigoVerificacion,
  guardarCodigoVerificacion,
  eliminarCodigoVerificacion,
  verificarCodigoVerificacion,
  invalidarCodigoVerificacion,
} from "../src/modules/auth/codigoDeVerificacion-controller.js";

after(() => {
  cerrarServidor();
  reiniciarTransporter();
});
beforeEach(() => invalidarCachePermisos());

const PADRON = { dni: "40123456", nacimiento: "2010-01-01", email: "ana@tecnica2.edu.ar" };

function mailFalso(t) {
  const enviados = [];
  fijarTransporter({
    sendMail: async (opciones) => {
      enviados.push(opciones);
      return { messageId: "fake" };
    },
  });
  void t;
  return enviados;
}

function padronAlumno(t) {
  t.mock.method(Alumno, "findOne", async () => fila({ id_alumno: 1, dni: PADRON.dni }));
}

test("crearCodigoVerificacion genera 6 dígitos", () => {
  for (let i = 0; i < 5; i++) {
    assert.match(crearCodigoVerificacion(), /^\d{6}$/);
  }
});

test("guardar y eliminar codigo", async (t) => {
  const crear = t.mock.method(CodigoVerificacion, "create", async (d) =>
    fila({ id_codigo: 1, ...d }),
  );
  await guardarCodigoVerificacion({ email: "a@b.c", codigo: "123456" });
  assert.equal(crear.mock.calls[0].arguments[0].email, "a@b.c");

  t.mock.method(CodigoVerificacion, "destroy", async () => 0);
  await assert.rejects(eliminarCodigoVerificacion(99), /No se encontró/);
  t.mock.method(CodigoVerificacion, "destroy", async () => 1);
  assert.equal(await eliminarCodigoVerificacion(99), 1);
});

test("verificarCodigo: inexistente, expirado y válido", async (t) => {
  t.mock.method(CodigoVerificacion, "findOne", async () => null);
  await assert.rejects(
    verificarCodigoVerificacion({ email: "a@b.c", codigo: "000000" }),
    /incorrecto o ya fue utilizado/,
  );

  t.mock.method(CodigoVerificacion, "findOne", async () =>
    fila({
      id_entidad: 1,
      rol_asociado: "alumno",
      email: "a@b.c",
      tipo: "registro",
      expiracion: new Date(Date.now() - 1000),
    }),
  );
  await assert.rejects(
    verificarCodigoVerificacion({ email: "a@b.c", codigo: "123456" }),
    /expirado/,
  );

  t.mock.method(CodigoVerificacion, "findOne", async () =>
    fila({
      id_entidad: 1,
      rol_asociado: "alumno",
      email: "a@b.c",
      tipo: "registro",
      expiracion: new Date(Date.now() + 600000),
    }),
  );
  const ok = await verificarCodigoVerificacion({ email: "a@b.c", codigo: "123456" });
  assert.equal(ok.valido, true);
  assert.equal(ok.rol_asociado, "alumno");
});

test("invalidarCodigo confirma o 500", async (t) => {
  t.mock.method(CodigoVerificacion, "update", async () => [1]);
  assert.deepEqual(
    await invalidarCodigoVerificacion({ email: "a@b.c", codigo: "123456" }),
    { ok: true },
  );
});

test("iniciarRegistro valida, guarda codigo y envía mail", async (t) => {
  const enviados = mailFalso(t);

  await assert.rejects(iniciarRegistro({ dni: "1" }), /mal formados/);

  t.mock.method(Alumno, "findOne", async () => null);
  const { Profesor } = await import("../src/db/models/index.js");
  t.mock.method(Profesor, "findOne", async () => null);
  await assert.rejects(iniciarRegistro({ ...PADRON }), /padrones/i);

  padronAlumno(t);
  const crear = t.mock.method(CodigoVerificacion, "create", async (d) =>
    fila({ id_codigo: 1, ...d }),
  );
  const res = await iniciarRegistro({ ...PADRON });
  assert.match(res.message, /verificacion/);
  const guardado = crear.mock.calls[0].arguments[0];
  assert.match(guardado.codigo, /^\d{6}$/);
  assert.ok(new Date(guardado.expiracion) > new Date());
  assert.equal(enviados.length, 1);
  assert.equal(enviados[0].to, PADRON.email);
});

test("POST /iniciar-registro y /verificar-codigo", async (t) => {
  mailFalso(t);
  padronAlumno(t);
  t.mock.method(CodigoVerificacion, "create", async (d) => fila({ id_codigo: 1, ...d }));
  // Rol para crearUsuario: permisos (include) y nombre (plano).
  t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) return { toJSON: () => ({ id_rol: 1, permisos: [] }) };
    return { nombre_rol: "alumno" };
  });
  t.mock.method(Usuario, "create", async (d) => fila({ id_usuario: 20, ...d }));
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1, update: async () => [1] }));
  t.mock.method(CodigoVerificacion, "findOne", async () =>
    fila({
      id_entidad: 1,
      rol_asociado: "alumno",
      email: PADRON.email,
      tipo: "registro",
      expiracion: new Date(Date.now() + 600000),
    }),
  );
  t.mock.method(CodigoVerificacion, "update", async () => [1]);
  const srv = await obtenerServidor();

  const inicio = await srv.request("POST", "/api/auth/iniciar-registro", {
    body: { ...PADRON },
  });
  assert.equal(inicio.status, 200);

  const registro = await srv.request("POST", "/api/auth/verificar-codigo", {
    body: {
      nombre: "Ana",
      apellido: "Paz",
      email: PADRON.email,
      codigo: "123456",
      contrasena: "Secreta123",
    },
  });
  assert.equal(registro.status, 200);
  assert.equal(registro.data.mensaje, "Registro exitoso");
  // El rol sale del padrón (alumno=1), nunca del body.
  assert.equal(registro.data.usuario.id_rol, 1);
  const payload = jwt.verify(registro.data.token, obtenerJWTSecret());
  assert.equal(payload.id, 20);

  // Código expirado → 400 sin crear usuario.
  t.mock.method(CodigoVerificacion, "findOne", async () =>
    fila({
      id_entidad: 1,
      rol_asociado: "alumno",
      email: PADRON.email,
      tipo: "registro",
      expiracion: new Date(Date.now() - 1000),
    }),
  );
  const expirado = await srv.request("POST", "/api/auth/verificar-codigo", {
    body: { email: PADRON.email, codigo: "000000", contrasena: "x" },
  });
  assert.equal(expirado.status, 400);
});
