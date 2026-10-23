import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { fila } from "./helpers/crud.js";
import { ROLES, token } from "./helpers/auth.js";
import Comunicado from "../src/db/models/comunicados-model.js";
import ComunicadoLectura from "../src/db/models/comunicado-lectura-model.js";
import { Alumno, Curso, Personal, Usuario } from "../src/db/models/index.js";
import {
  marcarComunicadoLeido,
  obtenerConfirmacionesLectura,
  resumenLecturasComunicados,
} from "../src/modules/comunidad/comunicados-controller.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

const PRECEPTOR = 9002;
const COMUNICADO_SI = {
  id_comunicado: 7,
  titulo: "TP para junio",
  destino: "curso",
  curso_destino: "2do A",
  autor_id: PRECEPTOR,
};
const COMUNICADO_NO = {
  id_comunicado: 9,
  titulo: "Viaje cultural",
  destino: "curso",
  curso_destino: "9no B",
  autor_id: 9999,
};
const COMUNICADO_ALUMNOS = {
  id_comunicado: 8,
  titulo: "Reunión de tutores",
  destino: "alumnos",
  curso_destino: null,
  autor_id: PRECEPTOR,
};

function mockearComunicados(t) {
  t.mock.method(Comunicado, "findByPk", async (id) => {
    if (Number(id) === 7) return fila({ ...COMUNICADO_SI });
    if (Number(id) === 8) return fila({ ...COMUNICADO_ALUMNOS });
    if (Number(id) === 9) return fila({ ...COMUNICADO_NO });
    return null;
  });
  t.mock.method(Comunicado, "findAll", async (opciones) => {
    const pedidos = opciones.where.id_comunicado[
      Reflect.ownKeys(opciones.where.id_comunicado)[0]
    ];
    return [COMUNICADO_SI, COMUNICADO_ALUMNOS, COMUNICADO_NO].filter((c) =>
      pedidos.includes(Number(c.id_comunicado)),
    );
  });
}

// Curso "2do A" (id 55): un alumno con cuenta (31) y otro sin (legajo solo).
function mockearPadronCurso(t) {
  t.mock.method(Curso, "findAll", async () => [fila({ id_curso: 55, nombre_curso: "2do A" })]);
  t.mock.method(Alumno, "findAll", async () => [
    fila({ id_usuario: 31, id_curso: 55 }),
    fila({ id_usuario: null, id_curso: 55 }),
  ]);
}

test("marcarComunicadoLeido valida destinatario y es idempotente", async (t) => {
  mockearComunicados(t);
  mockearPadronCurso(t);

  const findOrCreate = t.mock.method(ComunicadoLectura, "findOrCreate", async (opciones) => [
    fila({ id_lectura: 1, ...opciones.where, leida_en: new Date() }),
    true,
  ]);

  const r = await marcarComunicadoLeido(7, 31);
  assert.equal(r.ok, true);
  const registro = findOrCreate.mock.calls[0].arguments[0];
  assert.equal(registro.where.id_comunicado, 7);
  assert.equal(registro.where.id_usuario, 31);

  // Repetir la marca no revienta (idempotente).
  const r2 = await marcarComunicadoLeido(7, 31);
  assert.equal(r2.ok, true);

  // Sin comunicado: 404. Usuario fuera del padrón del curso: 403.
  await assert.rejects(marcarComunicadoLeido(999, 31), { status: 404 });
  await assert.rejects(marcarComunicadoLeido(7, 77), { status: 403 });
});

test("preceptor asignado puede confirmar lectura y se suma al resumen", async (t) => {
  mockearComunicados(t);
  t.mock.method(Curso, "findAll", async () => [
    fila({ id_curso: 55, id_preceptor: 50, nombre_curso: "2do A" }),
  ]);
  t.mock.method(Alumno, "findAll", async () => [fila({ id_usuario: 31 })]);
  t.mock.method(Personal, "findAll", async () => [fila({ id_usuario: PRECEPTOR })]);

  let lecturas = [];
  t.mock.method(ComunicadoLectura, "findOrCreate", async (opciones) => {
    lecturas.push(Number(opciones.where.id_usuario));
    return [fila({ ...opciones.where, leida_en: new Date() }), true];
  });
  await marcarComunicadoLeido(7, PRECEPTOR);
  assert.deepEqual(lecturas, [PRECEPTOR]);

  t.mock.method(Usuario, "findAll", async () => [
    fila({ id_usuario: 31, nombre: "Tadeo", apellido: "Martínez", id_rol: ROLES.ALUMNO }),
    fila({ id_usuario: PRECEPTOR, nombre: "Ana", apellido: "Pérez", id_rol: ROLES.PRECEPTOR }),
  ]);
  t.mock.method(ComunicadoLectura, "findAll", async () => [
    fila({ id_usuario: 31, leida_en: "2026-10-19 10:00:00" }),
    fila({ id_usuario: PRECEPTOR, leida_en: "2026-10-19 10:05:00" }),
  ]);

  const confirmaciones = await obtenerConfirmacionesLectura(7, 9001, ROLES.ADMINISTRATIVO);
  assert.equal(confirmaciones.total, 2);
  assert.equal(confirmaciones.leidos, 2);
  assert.equal(confirmaciones.pendientes, 0);
  assert.ok(confirmaciones.destinatarios.some((d) => d.id_usuario === PRECEPTOR && d.leida));
});

test("obtenerConfirmacionesLectura devuelve padrón, resumen y aviso sin cuenta", async (t) => {
  mockearComunicados(t);
  mockearPadronCurso(t);
  t.mock.method(Usuario, "findAll", async () => [
    fila({ id_usuario: 31, nombre: "Tadeo", apellido: "Martínez", id_rol: 1 }),
  ]);
  t.mock.method(ComunicadoLectura, "findAll", async () => [
    fila({ id_usuario: 31, leida_en: "2026-10-19 10:00:00" }),
  ]);

  // Administrativo: tiene permiso y el padrón no depende de su personal.
  const r = await obtenerConfirmacionesLectura(7, 9001, ROLES.ADMINISTRATIVO);
  assert.equal(r.total, 1);
  assert.equal(r.leidos, 1);
  assert.equal(r.pendientes, 0);
  assert.equal(r.sinCuenta, 1);
  assert.deepEqual(r.destinatarios, [
    {
      id_usuario: 31,
      nombre: "Tadeo",
      apellido: "Martínez",
      id_rol: 1,
      leida: true,
      leida_en: "2026-10-19 10:00:00",
    },
  ]);

  // Sin lectura: queda pendiente con leida_en null.
  t.mock.method(ComunicadoLectura, "findAll", async () => []);
  const sinLecturas = await obtenerConfirmacionesLectura(7, 9001, ROLES.ADMINISTRATIVO);
  assert.equal(sinLecturas.leidos, 0);
  assert.equal(sinLecturas.pendientes, 1);
  assert.equal(sinLecturas.destinatarios[0].leida, false);
  assert.equal(sinLecturas.destinatarios[0].leida_en, null);
});

test("confirmaciones: admin/root sí; profesor y alumno no", async (t) => {
  mockearComunicados(t);
  mockearPadronCurso(t);

  await assert.rejects(obtenerConfirmacionesLectura(7, 9100, ROLES.PROFESOR), { status: 403 });
  await assert.rejects(obtenerConfirmacionesLectura(7, 31, ROLES.ALUMNO), { status: 403 });

  t.mock.method(Usuario, "findAll", async () => []);
  t.mock.method(ComunicadoLectura, "findAll", async () => []);
  const root = await obtenerConfirmacionesLectura(7, 1, ROLES.ROOT);
  assert.equal(root.total, 0);
  assert.equal(root.sinCuenta, 1);

  const admin = await obtenerConfirmacionesLectura(7, 9001, ROLES.ADMINISTRATIVO);
  assert.equal(admin.id_comunicado, 7);
});

test("preceptor: ve su curso y el padrón general, no el de otro preceptor", async (t) => {
  mockearComunicados(t);
  mockearPadronCurso(t);

  // Preceptor 9002 = personal 50, con cursos "2do A" y "6do B".
  t.mock.method(Personal, "findOne", async (opciones) =>
    opciones.where.id_usuario === PRECEPTOR ? fila({ id_personal: 50 }) : null,
  );
  t.mock.method(Curso, "findAll", async (opciones) => {
    // Cursos del preceptor (para la regla de visibilidad).
    if (opciones.where && opciones.where.id_preceptor === 50) {
      return [fila({ nombre_curso: "2do A" }), fila({ nombre_curso: "6do B" })];
    }
    // Padrón de destinatarios por nombre de curso.
    if (opciones.where && opciones.where.nombre_curso === "2do A") {
      return [fila({ id_curso: 55, nombre_curso: "2do A" })];
    }
    return [fila({ id_curso: 56, nombre_curso: "9no B" })];
  });
  t.mock.method(Usuario, "findAll", async () => []);
  t.mock.method(ComunicadoLectura, "findAll", async () => []);
  // El padrón 'alumnos' cuenta legajos sin cuenta: mock para no tocar DB.
  t.mock.method(Alumno, "count", async () => 2);

  // Comunicado de SU curso → visible.
  const propio = await obtenerConfirmacionesLectura(7, PRECEPTOR, ROLES.PRECEPTOR);
  assert.equal(propio.id_comunicado, 7);

  // Comunicado de destino 'alumnos' → visible para el preceptor (su panel lo muestra).
  const alumnos = await obtenerConfirmacionesLectura(8, PRECEPTOR, ROLES.PRECEPTOR);
  assert.equal(alumnos.destino, "alumnos");

  // Comunicado de un curso que NO gestiona → 403.
  await assert.rejects(obtenerConfirmacionesLectura(9, PRECEPTOR, ROLES.PRECEPTOR), {
    status: 403,
  });
});

test("resumenLecturasComunicados incluye preceptor en padrón de curso", async (t) => {
  mockearComunicados(t);

  t.mock.method(Usuario, "findAll", async () => [
    fila({ id_usuario: 31, id_rol: ROLES.ALUMNO }),
    fila({ id_usuario: 9012, id_rol: ROLES.PROFESOR }),
  ]);
  t.mock.method(Alumno, "findAll", async () => [fila({ id_usuario: 31, id_curso: 55 })]);
  t.mock.method(Curso, "findAll", async (opciones) =>
    opciones.attributes && opciones.attributes.includes("nombre_curso")
      ? [fila({ id_curso: 55, id_preceptor: 50, nombre_curso: "2do A" })]
      : [],
  );
  t.mock.method(Personal, "findAll", async () => [fila({ id_personal: 50, id_usuario: PRECEPTOR })]);
  t.mock.method(ComunicadoLectura, "findAll", async () => [
    fila({ id_comunicado: 7, id_usuario: 31 }),
    fila({ id_comunicado: 7, id_usuario: PRECEPTOR }),
  ]);

  // Administrativo (7): ve ambos resúmenes.
  const resumen = await resumenLecturasComunicados([7, 8], 9001, ROLES.ADMINISTRATIVO);
  const r7 = resumen.find((r) => r.id_comunicado === 7);
  const r8 = resumen.find((r) => r.id_comunicado === 8);
  assert.equal(r7.visible, true);
  assert.equal(r7.total, 2);
  assert.equal(r7.leidos, 2);
  assert.equal(r7.pendientes, 0);
  // 'alumnos' → roles 1,2,6: solo el 31 existe en el padrón precargado.
  assert.equal(r8.visible, true);
  assert.equal(r8.total, 1);
  assert.equal(r8.leidos, 0);
  assert.equal(r8.pendientes, 1);

  // Profesor (3): nada visible.
  const resumenProfe = await resumenLecturasComunicados([7, 8], 9012, ROLES.PROFESOR);
  assert.equal(resumenProfe.every((r) => !r.visible), true);
});

test("rutas HTTP de lecturas: registrar, ver y resumen", async (t) => {
  mockearComunicados(t);
  mockearPadronCurso(t);
  t.mock.method(Personal, "findAll", async () => []);
  t.mock.method(ComunicadoLectura, "findOrCreate", async (opciones) => [
    fila({ id_lectura: 9, ...opciones.where, leida_en: new Date() }),
    true,
  ]);
  t.mock.method(Usuario, "findAll", async () => [
    fila({ id_usuario: 31, nombre: "Tadeo", apellido: "Martínez", id_rol: ROLES.ALUMNO }),
  ]);
  t.mock.method(ComunicadoLectura, "findAll", async () => [
    fila({ id_usuario: 31, leida_en: "2026-10-19 10:00:00" }),
  ]);

  const srv = await obtenerServidor();

  // Alumno marca su lectura del comunicado de su curso.
  const tkAlumno = { token: token({ id: 31, id_rol: ROLES.ALUMNO }) };
  const marcado = await srv.request("POST", "/api/comunidad/comunicados/7/leido", tkAlumno);
  assert.equal(marcado.status, 200);
  assert.equal(marcado.data?.ok ?? marcado.data?.data?.ok, true);

  // Confirmaciones como administrativo (rol 7).
  const tkAdmin = { token: token({ id: 9001, id_rol: ROLES.ADMINISTRATIVO }) };
  const confirmaciones = await srv.request(
    "GET",
    "/api/comunidad/comunicados/7/lecturas",
    tkAdmin,
  );
  assert.equal(confirmaciones.status, 200);
  assert.equal(confirmaciones.data.total, 1);
  assert.equal(confirmaciones.data.leidos, 1);

  // El alumno NO puede ver confirmaciones.
  const denegado = await srv.request(
    "GET",
    "/api/comunidad/comunicados/7/lecturas",
    tkAlumno,
  );
  assert.equal(denegado.status, 403);

  // Resumen para el administrativo.
  const resumen = await srv.request(
    "GET",
    "/api/comunidad/comunicados/lecturas/resumen?ids=7,8",
    tkAdmin,
  );
  assert.equal(resumen.status, 200);
  assert.ok(Array.isArray(resumen.data));
  assert.equal(resumen.data.length, 2);
});
