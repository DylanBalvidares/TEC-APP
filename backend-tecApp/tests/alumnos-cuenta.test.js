import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { fila, sinToken, sinPermiso } from "./helpers/crud.js";
import { Alumno, Personal, Curso, Usuario } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import { gestionarCuentaAlumno } from "../src/modules/academico/alumnos-controller.js";
import {
  fijarTransporter,
  reiniciarTransporter,
} from "../src/utils/sendMail.js";

after(async () => {
  reiniciarTransporter();
  await cerrarServidor();
});
beforeEach(() => invalidarCachePermisos());

const PERMISOS = {
  [ROLES.PRECEPTOR]: ["preceptor_editar_alumno"],
  [ROLES.ADMINISTRATIVO]: ["administrativo_editar_alumno"],
};

// Preceptor con el curso 2 asignado (Personal 5 -> Curso 2).
function accesoPreceptor(t, idCurso = 2) {
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  t.mock.method(Curso, "findAll", async () => [{ id_curso: idCurso }]);
}

// Alumno del curso 2 sin cuenta vinculada.
function alumnoSinCuenta(t) {
  t.mock.method(Alumno, "findByPk", async () =>
    fila({
      id_alumno: 1,
      id_curso: 2,
      id_usuario: null,
      nombre: "Ana",
      apellido: "Paz",
    }),
  );
}

// ============================================================
// UNITARIO: gestionarCuentaAlumno
// ============================================================

test("unidad: validaciones de gestión de cuenta", async (t) => {
  await assert.rejects(gestionarCuentaAlumno(0, {}), /inválida/);
  await assert.rejects(gestionarCuentaAlumno(-3, {}), /inválida/);

  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(gestionarCuentaAlumno(99, {}), /No se encontro/);
});

test("unidad: crea la cuenta con rol alumno y la vincula", async (t) => {
  alumnoSinCuenta(t);

  const creatas = [];
  t.mock.method(Usuario, "create", async (datos) => {
    creatas.push(datos);
    return fila({ id_usuario: 77, email: datos.email });
  });
  const vinculaciones = [];
  t.mock.method(Alumno, "update", async (datos) => {
    vinculaciones.push(datos);
    return [1];
  });

  const resultado = await gestionarCuentaAlumno(1, {
    email: "ana.paz@tecnica2.edu.ar",
    contrasena: "secretito1",
  });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.creada, true);
  assert.equal(resultado.usuario.id_usuario, 77);
  assert.equal(creatas.length, 1);
  // Rol fijo Alumno y contraseña hasheada (bcrypt), nunca en claro.
  assert.equal(creatas[0].id_rol, 1);
  assert.match(creatas[0].contrasena, /^\$2/);
  assert.equal(creatas[0].nombre, "Ana");
  assert.deepEqual(vinculaciones, [{ id_usuario: 77 }]);
});

test("unidad: alta sin email/contraseña es rechazada", async (t) => {
  alumnoSinCuenta(t);
  await assert.rejects(
    gestionarCuentaAlumno(1, { email: "ana.paz@tecnica2.edu.ar" }),
    /obligatorios/,
  );
  await assert.rejects(
    gestionarCuentaAlumno(1, { contrasena: "x1" }),
    /obligatorios|El email es obligatorio/,
  );
  // Con el envío apagado NO se genera contraseña: sigue siendo obligatoria.
  await assert.rejects(
    gestionarCuentaAlumno(1, { email: "ana.paz@tecnica2.edu.ar", enviarCredenciales: false }),
    /obligatorios/,
  );
});

test("unidad: email duplicado al crear → 400", async (t) => {
  alumnoSinCuenta(t);
  t.mock.method(Usuario, "create", async () => {
    throw Object.assign(new Error("dup"), {
      name: "SequelizeUniqueConstraintError",
    });
  });
  await assert.rejects(
    gestionarCuentaAlumno(1, { email: "usada@tecnica2.edu.ar", contrasena: "x1" }),
    /ya está en uso/,
  );
});

test("unidad: actualiza email de la cuenta vinculada", async (t) => {
  const escrituras = [];
  t.mock.method(Alumno, "findByPk", async () =>
    fila({
      id_alumno: 1,
      id_curso: 2,
      id_usuario: 10,
      nombre: "Ana",
      apellido: "Paz",
    }),
  );
  t.mock.method(Usuario, "findByPk", async () =>
    fila(
      { id_usuario: 10, email: "viejo@tecnica2.edu.ar", id_rol: 1 },
      {
        update: async (d) => {
          escrituras.push(d);
          return [1];
        },
      },
    ),
  );

  const resultado = await gestionarCuentaAlumno(1, {
    email: "nuevo@tecnica2.edu.ar",
  });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.creada, false);
  assert.equal(resultado.cambios, true);
  assert.equal(resultado.usuario.email, "nuevo@tecnica2.edu.ar");
  assert.equal(escrituras.length, 1);
  assert.equal(escrituras[0].email, "nuevo@tecnica2.edu.ar");
  assert.equal(escrituras[0].contrasena, undefined);
});

test("unidad: cambio de contraseña solo de la cuenta vinculada", async (t) => {
  const escrituras = [];
  t.mock.method(Alumno, "findByPk", async () =>
    fila({ id_alumno: 1, id_curso: 2, id_usuario: 10, nombre: "Ana" }),
  );
  t.mock.method(Usuario, "findByPk", async () =>
    fila(
      { id_usuario: 10, email: "misma@tecnica2.edu.ar", id_rol: 1 },
      {
        update: async (d) => {
          escrituras.push(d);
          return [1];
        },
      },
    ),
  );

  const resultado = await gestionarCuentaAlumno(1, {
    email: "misma@tecnica2.edu.ar",
    contrasena: "otraClave99",
  });

  assert.equal(resultado.cambios, true);
  assert.equal(escrituras.length, 1);
  assert.match(escrituras[0].contrasena, /^\$2/);
  assert.equal(escrituras[0].email, undefined);
});

test("unidad: nada que cambiar → no escribe y responde cambios:false", async (t) => {
  const escrituras = [];
  t.mock.method(Alumno, "findByPk", async () =>
    fila({ id_alumno: 1, id_curso: 2, id_usuario: 10 }),
  );
  t.mock.method(Usuario, "findByPk", async () =>
    fila(
      { id_usuario: 10, email: "misma@tecnica2.edu.ar", id_rol: 1 },
      {
        update: async (d) => {
          escrituras.push(d);
          return [1];
        },
      },
    ),
  );

  const resultado = await gestionarCuentaAlumno(1, {
    email: "misma@tecnica2.edu.ar",
  });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.cambios, false);
  assert.equal(escrituras.length, 0);
});

test("unidad: cuenta vinculada root o inexistente", async (t) => {
  t.mock.method(Alumno, "findByPk", async () =>
    fila({ id_alumno: 1, id_curso: 2, id_usuario: 10 }),
  );

  t.mock.method(Usuario, "findByPk", async () => null);
  await assert.rejects(gestionarCuentaAlumno(1, { email: "a@b.com" }), /vinculada/);

  t.mock.method(Usuario, "findByPk", async () =>
    fila({ id_usuario: 10, email: "root@tecnica2.edu.ar", id_rol: 8 }),
  );
  await assert.rejects(
    gestionarCuentaAlumno(1, { email: "a@b.com", contrasena: "x1" }),
    /root/,
  );
});

test("unidad: envío de credenciales genera contraseña y la manda por email", async (t) => {
  alumnoSinCuenta(t);
  const creatas = [];
  t.mock.method(Usuario, "create", async (datos) => {
    creatas.push(datos);
    return fila({ id_usuario: 77, email: datos.email });
  });
  t.mock.method(Alumno, "update", async () => [1]);

  const correos = [];
  fijarTransporter({
    sendMail: async (mail) => {
      correos.push(mail);
      return { messageId: "fake-cred" };
    },
  });

  const resultado = await gestionarCuentaAlumno(1, {
    email: "ana.paz@tecnica2.edu.ar",
    enviarCredenciales: true,
  });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.credencialesEnviadas, true);
  assert.equal(correos.length, 1);
  assert.equal(correos[0].to, "ana.paz@tecnica2.edu.ar");

  // Contraseña del mail: 12 caracteres alfanuméricos y coincide con el hash.
  const contrasenaDelMail = /<code>([^<]+)<\/code>/.exec(correos[0].html)[1];
  assert.equal(contrasenaDelMail.length, 12);
  assert.match(contrasenaDelMail, /^[a-zA-Z0-9]+$/);
  assert.equal(await bcrypt.compare(contrasenaDelMail, creatas[0].contrasena), true);

  // La contraseña (ni su hash) viaja nunca en la respuesta.
  const respuestaSerializada = JSON.stringify(resultado);
  assert.equal(respuestaSerializada.includes(contrasenaDelMail), false);
  assert.equal(respuestaSerializada.includes("$2"), false);
});

test("unidad: si el envío falla la cuenta queda creada y se avisa", async (t) => {
  alumnoSinCuenta(t);
  const creatas = [];
  t.mock.method(Usuario, "create", async (datos) => {
    creatas.push(datos);
    return fila({ id_usuario: 77, email: datos.email });
  });
  const vinculaciones = [];
  t.mock.method(Alumno, "update", async (datos) => {
    vinculaciones.push(datos);
    return [1];
  });

  fijarTransporter({
    sendMail: async () => {
      throw new Error("SMTP caído");
    },
  });

  const resultado = await gestionarCuentaAlumno(1, {
    email: "ana.paz@tecnica2.edu.ar",
    enviarCredenciales: true,
  });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.creada, true);
  assert.equal(resultado.credencialesEnviadas, false);
  assert.match(resultado.aviso, /no se pudo enviar/);
  assert.equal(creatas.length, 1);
  assert.deepEqual(vinculaciones, [{ id_usuario: 77 }]);
});

test("unidad: envío con contraseña explícita la usa (no genera otra)", async (t) => {
  alumnoSinCuenta(t);
  const creatas = [];
  t.mock.method(Usuario, "create", async (datos) => {
    creatas.push(datos);
    return fila({ id_usuario: 77, email: datos.email });
  });
  t.mock.method(Alumno, "update", async () => [1]);

  const correos = [];
  fijarTransporter({
    sendMail: async (mail) => {
      correos.push(mail);
      return { messageId: "fake-cred" };
    },
  });

  const resultado = await gestionarCuentaAlumno(1, {
    email: "ana.paz@tecnica2.edu.ar",
    contrasena: "claveElegida1",
    enviarCredenciales: true,
  });

  assert.equal(resultado.credencialesEnviadas, true);
  assert.match(correos[0].html, /<code>claveElegida1<\/code>/);
  assert.equal(await bcrypt.compare("claveElegida1", creatas[0].contrasena), true);
});

test("unidad: editar con envío resetea y reenvía credenciales", async (t) => {
  const escrituras = [];
  t.mock.method(Alumno, "findByPk", async () =>
    fila({
      id_alumno: 1,
      id_curso: 2,
      id_usuario: 10,
      nombre: "Ana",
      apellido: "Paz",
    }),
  );
  t.mock.method(Usuario, "findByPk", async () =>
    fila(
      { id_usuario: 10, email: "misma@tecnica2.edu.ar", id_rol: 1 },
      {
        update: async (d) => {
          escrituras.push(d);
          return [1];
        },
      },
    ),
  );

  const correos = [];
  fijarTransporter({
    sendMail: async (mail) => {
      correos.push(mail);
      return { messageId: "fake-cred" };
    },
  });

  const resultado = await gestionarCuentaAlumno(1, {
    email: "misma@tecnica2.edu.ar",
    enviarCredenciales: true,
  });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.cambios, true);
  assert.equal(resultado.credencialesEnviadas, true);
  assert.equal(correos[0].to, "misma@tecnica2.edu.ar");
  assert.match(escrituras[0].contrasena, /^\$2/);
  const contrasenaDelMail = /<code>([^<]+)<\/code>/.exec(correos[0].html)[1];
  assert.equal(await bcrypt.compare(contrasenaDelMail, escrituras[0].contrasena), true);
});

// ============================================================
// HTTP: PATCH /api/academico/alumnos/:id/cuenta
// ============================================================

test("http: cuenta exige token y permiso de editar alumno", async (t) => {
  // Sin el permiso (ni preceptor ni administrativo lo tienen acá) → 403;
  // el token es válido, así que la barrera es comprobarPermiso (401 = auth).
  mockearPermisosDeRol(t, { [ROLES.ALUMNO]: [], [ROLES.ADMINISTRATIVO]: [] });
  const srv = await obtenerServidor();

  await sinToken(srv, "PATCH", "/api/academico/alumnos/1/cuenta");
  await sinPermiso(srv, "PATCH", "/api/academico/alumnos/1/cuenta");
});

test("http: administrativo crea y actualiza la cuenta", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  alumnoSinCuenta(t);
  t.mock.method(Usuario, "create", async (d) => fila({ id_usuario: 77, email: d.email }));
  t.mock.method(Alumno, "update", async () => [1]);
  const srv = await obtenerServidor();
  const auth = { token: token({ id_rol: ROLES.ADMINISTRATIVO }) };

  const alta = await srv.request("PATCH", "/api/academico/alumnos/1/cuenta", {
    ...auth,
    body: { email: "ana.paz@tecnica2.edu.ar", contrasena: "secretito1" },
  });
  assert.equal(alta.status, 201);
  assert.equal(alta.data?.ok ?? alta.data?.data?.ok, true);

  // Con cuenta vinculada: solo cambia lo que llegó.
  t.mock.method(Alumno, "findByPk", async () =>
    fila({ id_alumno: 1, id_curso: 2, id_usuario: 10, nombre: "Ana" }),
  );
  t.mock.method(Usuario, "findByPk", async () =>
    fila(
      { id_usuario: 10, email: "viejo@tecnica2.edu.ar", id_rol: 1 },
      { update: async () => [1] },
    ),
  );
  const cambio = await srv.request("PATCH", "/api/academico/alumnos/1/cuenta", {
    ...auth,
    body: { email: "nuevo@tecnica2.edu.ar" },
  });
  assert.equal(cambio.status, 200);

  // Email duplicado al crear → 400 con mensaje claro
  alumnoSinCuenta(t);
  t.mock.method(Usuario, "create", async () => {
    throw Object.assign(new Error("dup"), {
      name: "SequelizeUniqueConstraintError",
    });
  });
  const duplicado = await srv.request("PATCH", "/api/academico/alumnos/1/cuenta", {
    ...auth,
    body: { email: "usada@tecnica2.edu.ar", contrasena: "x1" },
  });
  assert.equal(duplicado.status, 400);
});

test("http: preceptor gestiona cuentas solo de sus cursos", async (t) => {
  mockearPermisosDeRol(t, PERMISOS);
  accesoPreceptor(t, 2);
  alumnoSinCuenta(t);
  t.mock.method(Usuario, "create", async (d) => fila({ id_usuario: 77, email: d.email }));
  t.mock.method(Alumno, "update", async () => [1]);
  const srv = await obtenerServidor();
  const auth = { token: token({ id: 4, id_rol: ROLES.PRECEPTOR }) };

  const alta = await srv.request("PATCH", "/api/academico/alumnos/1/cuenta", {
    ...auth,
    body: { email: "ana.paz@tecnica2.edu.ar", contrasena: "secretito1" },
  });
  assert.equal(alta.status, 201);

  // Alumno de otro curso → guard de preceptor
  t.mock.method(Alumno, "findByPk", async () =>
    fila({ id_alumno: 2, id_curso: 7, id_usuario: null }),
  );
  const ajeno = await srv.request("PATCH", "/api/academico/alumnos/2/cuenta", {
    ...auth,
    body: { email: "x@y.com", contrasena: "x1" },
  });
  assert.equal(ajeno.status, 403);
});
