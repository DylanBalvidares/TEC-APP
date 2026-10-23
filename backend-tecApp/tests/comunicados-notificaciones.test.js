import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { fila } from "./helpers/crud.js";
import Comunicado from "../src/db/models/comunicados-model.js";
import { Alumno, Curso, Personal, Usuario } from "../src/db/models/index.js";
import Notificacion from "../src/db/models/notificacion-model.js";
import { crearComunicado } from "../src/modules/comunidad/comunicados-controller.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import { suscribir, limpiarSuscriptores } from "../src/utils/eventos.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

function mockearFanout(t) {
  const creadas = [];
  t.mock.method(Comunicado, "create", async (d) => fila({ id_comunicado: 7, ...d }));
  t.mock.method(Notificacion, "bulkCreate", async (datos) => {
    creadas.push(...datos);
    return datos.map((d, i) => fila({ id_notificacion: 100 + i, ...d }));
  });
  return creadas;
}

test("comunicado a 'alumnos' notifica al perfil estudiantil", async (t) => {
  const creadas = mockearFanout(t);
  t.mock.method(Usuario, "findAll", async () => [
    fila({ id_usuario: 10 }),
    fila({ id_usuario: 12 }),
  ]);
  // El padrón 'alumnos' informa legajos sin cuenta: mock para no tocar DB.
  t.mock.method(Alumno, "count", async () => 0);

  await crearComunicado({
    titulo: "Reunión",
    mensaje: "Jueves 19h",
    destino: "alumnos",
    autor_id: 4,
  });

  assert.equal(creadas.length, 2);
  assert.deepEqual(
    new Set(creadas.map((n) => Number(n.id_usuario))),
    new Set([10, 12]),
  );
  for (const n of creadas) {
    assert.equal(n.tipo, "comunicado");
    assert.equal(n.titulo, "Reunión");
    assert.equal(n.cuerpo, "Jueves 19h");
  }
  // El público espeja los perfiles de lectura: alumno, delegado y tutor.
  const whereRol = Usuario.findAll.mock.calls[0].arguments[0].where.id_rol;
  const claveOperador = Reflect.ownKeys(whereRol)[0];
  assert.deepEqual([...whereRol[claveOperador]].sort(), [1, 2, 6]);
});

test("comunicado a 'curso' notifica a alumnos y preceptor con cuenta", async (t) => {
  const creadas = mockearFanout(t);
  t.mock.method(Curso, "findAll", async (opciones) => {
    assert.equal(opciones.where.nombre_curso, "2do 3ra"); // match por nombre
    return [fila({ id_curso: 55, id_preceptor: 8 })];
  });
  t.mock.method(Alumno, "findAll", async () => [
    fila({ id_usuario: 31 }),
    fila({ id_usuario: 32 }),
    fila({ id_usuario: null }),
  ]);
  t.mock.method(Personal, "findAll", async (opciones) => {
    const ids = opciones.where.id_personal[Reflect.ownKeys(opciones.where.id_personal)[0]];
    assert.deepEqual(ids, [8]);
    return [fila({ id_usuario: 33 })];
  });

  const comunicado = await crearComunicado({
    titulo: "Trabajo práctico",
    mensaje: "Entregar el lunes",
    destino: "curso",
    curso_destino: "2do 3ra",
    autor_id: 4,
  });

  assert.equal(comunicado.destino, "curso");
  assert.deepEqual(
    new Set(creadas.map((n) => Number(n.id_usuario))),
    new Set([31, 32, 33]),
  );
  assert.ok(creadas.every((n) => Number(n.id_comunicado) === Number(comunicado.id_comunicado)));
  // La consulta de alumnos filtra por los cursos resueltos y exige cuenta.
  const whereAlumno = Alumno.findAll.mock.calls[0].arguments[0].where;
  const claveIn = Reflect.ownKeys(whereAlumno.id_curso)[0];
  assert.deepEqual(whereAlumno.id_curso[claveIn], [55]);
  assert.notEqual(whereAlumno.id_usuario, null);
});

test("preceptor publica a su curso y los alumnos reciben el aviso en sus notificaciones", async (t) => {
  const creadas = mockearFanout(t);
  mockearPermisosDeRol(t, { [ROLES.PRECEPTOR]: ["comunicado_crear"] });
  t.mock.method(Curso, "findAll", async (opciones) => {
    assert.equal(opciones.where.nombre_curso, "2do 3ra");
    return [fila({ id_curso: 55, id_preceptor: 8 })];
  });
  t.mock.method(Alumno, "findAll", async (opciones) => {
    const ids = opciones.where.id_curso[Reflect.ownKeys(opciones.where.id_curso)[0]];
    assert.deepEqual(ids, [55]);
    return [fila({ id_usuario: 31 }), fila({ id_usuario: 32 })];
  });
  t.mock.method(Personal, "findAll", async () => [fila({ id_usuario: 44 })]);
  t.mock.method(Notificacion, "findAndCountAll", async ({ where }) => {
    const lista = creadas
      .filter((notificacion) => Number(notificacion.id_usuario) === Number(where.id_usuario))
      .map((notificacion, index) => fila({ id_notificacion: 200 + index, leida: false, ...notificacion }));
    return { count: lista.length, rows: lista };
  });

  const srv = await obtenerServidor();
  const publicado = await srv.request("POST", "/api/comunidad/comunicados", {
    token: token({ id: 44, id_rol: ROLES.PRECEPTOR }),
    body: {
      titulo: "Reunión de curso",
      mensaje: "El viernes a las 10 hs",
      destino: "curso",
      curso_destino: "2do 3ra",
    },
  });

  assert.equal(publicado.status, 201);
  assert.equal(publicado.data.autor_id, 44);
  const idComunicado = Number(publicado.data.id_comunicado);
  assert.deepEqual(
    new Set(creadas.map((notificacion) => Number(notificacion.id_usuario))),
    new Set([31, 32, 44]),
  );
  assert.ok(creadas.every((notificacion) => Number(notificacion.id_comunicado) === idComunicado));

  const notificacionesAlumno = await srv.request("GET", "/api/comunidad/notificaciones/mias", {
    token: token({ id: 31, id_rol: ROLES.ALUMNO }),
  });
  assert.equal(notificacionesAlumno.status, 200);
  assert.equal(notificacionesAlumno.data.lista.length, 1);
  assert.equal(Number(notificacionesAlumno.data.lista[0].id_comunicado), idComunicado);
});

test("destinos de personal y 'todos' mapean a sus roles", async (t) => {
  mockearFanout(t);
  t.mock.method(Usuario, "findAll", async () => []);

  await crearComunicado({ titulo: "Congreso", mensaje: "Aula 12", destino: "profesores", autor_id: 4 });
  let whereRol = Usuario.findAll.mock.calls[0].arguments[0].where.id_rol;
  let clave = Reflect.ownKeys(whereRol)[0];
  assert.deepEqual([...whereRol[clave]].sort(), [3]);

  await crearComunicado({ titulo: "Elecciones", mensaje: "Junio", destino: "autoridades", autor_id: 4 });
  whereRol = Usuario.findAll.mock.calls[1].arguments[0].where.id_rol;
  clave = Reflect.ownKeys(whereRol)[0];
  assert.deepEqual([...whereRol[clave]].sort(), [4, 5, 7]);

  await crearComunicado({ titulo: "Acto", mensaje: "Mañana", destino: "todos", autor_id: 4 });
  whereRol = Usuario.findAll.mock.calls[2].arguments[0].where.id_rol;
  clave = Reflect.ownKeys(whereRol)[0];
  assert.deepEqual([...whereRol[clave]].sort(), [1, 2, 3, 4, 5, 6, 7]);
});

test("destino desconocido no notifica a nadie", async (t) => {
  const creadas = mockearFanout(t);
  t.mock.method(Usuario, "findAll", async () => [fila({ id_usuario: 10 })]);

  const comunicado = await crearComunicado({
    titulo: "X",
    mensaje: "y",
    destino: "inexistente",
    autor_id: 4,
  });
  assert.equal(comunicado.destino, "inexistente");
  assert.equal(Usuario.findAll.mock.calls.length, 0);
  assert.equal(creadas.length, 0);
});

test("fallo del fan-out no rompe la creación del comunicado", async (t) => {
  t.mock.method(Comunicado, "create", async (d) => fila({ id_comunicado: 8, ...d }));
  t.mock.method(Usuario, "findAll", async () => {
    throw new Error("db caída");
  });

  const comunicado = await crearComunicado({
    titulo: "Reunión",
    mensaje: "Texto",
    destino: "todos",
    autor_id: 4,
  });
  assert.equal(comunicado.id_comunicado, 8);
});

test("el evento SSE del fan-out llega solo al destinatario", async (t) => {
  const creadas = mockearFanout(t);
  t.mock.method(Usuario, "findAll", async () => [
    fila({ id_usuario: 10 }),
    fila({ id_usuario: 20 }),
  ]);
  t.mock.method(Alumno, "count", async () => 0);

  const buzon10 = [];
  const buzon20 = [];
  const fuera10 = suscribir({ write: (e) => buzon10.push(e) }, { id_usuario: 10 });
  const fuera20 = suscribir({ write: (e) => buzon20.push(e) }, { id_usuario: 20 });
  try {
    await crearComunicado({
      titulo: "Clase extra",
      mensaje: "Sábado",
      destino: "alumnos",
      autor_id: 4,
    });
  } finally {
    fuera10();
    fuera20();
    limpiarSuscriptores();
  }

  assert.equal(creadas.length, 2);
  assert.equal(buzon10.length, 1);
  assert.equal(buzon20.length, 1);
  assert.equal(buzon10[0].datos.id_usuario, 10);
  assert.equal(buzon20[0].datos.id_usuario, 20);
  assert.equal(buzon10[0].datos.titulo, "Clase extra");
});
