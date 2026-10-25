import { after, test } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import {
  Alumno,
  Asignacion,
  Curso,
  HistorialNota,
  Nota,
  Personal,
  Profesor,
  SolicitudEdicionNota,
} from "../src/db/models/index.js";
import {
  decidirSolicitudEdicion,
  solicitarEdicionPlanilla,
} from "../src/modules/academico/notas-edicion-controller.js";
import { DURACION_EDICION_PRECEPTOR_MS } from "../src/modules/academico/notas-edicion-service.js";
import { crearNota } from "../src/modules/academico/notas-controller.js";

const fila = (datos) => ({ ...datos });

after(cerrarServidor);

test("solo el preceptor a cargo puede solicitar edición y el titular concede 24 horas", async (t) => {
  const preceptor = fila({ id_personal: 5 });
  const asignacion = fila({
    id_asignacion: 2,
    id_profesor: 3,
    cursoAsignacion: { id_curso: 1, id_preceptor: 5 },
  });
  const solicitud = {
    id_solicitud: 9,
    id_personal_preceptor: 5,
    id_asignacion: 2,
    estado: "pendiente",
    save: async () => true,
  };
  const creada = [];

  t.mock.method(Personal, "findOne", async ({ where }) =>
    Number(where.id_usuario) === 46 ? fila({ id_personal: 6 }) : preceptor,
  );
  t.mock.method(Asignacion, "findByPk", async () => asignacion);
  t.mock.method(SolicitudEdicionNota, "findOne", async () => null);
  t.mock.method(SolicitudEdicionNota, "create", async (datos) => {
    creada.push(datos);
    Object.assign(solicitud, datos);
    return solicitud;
  });

  await assert.rejects(solicitarEdicionPlanilla(46, 2), /cursos a tu cargo/);
  const resultado = await solicitarEdicionPlanilla(44, 2);
  assert.equal(resultado.estado, "pendiente");
  assert.equal(creada.length, 1);

  t.mock.method(SolicitudEdicionNota, "findByPk", async () => solicitud);
  t.mock.method(Profesor, "findOne", async ({ where }) =>
    Number(where.id_usuario) === 77 ? fila({ id_profesor: 3 }) : fila({ id_profesor: 8 }),
  );
  await assert.rejects(decidirSolicitudEdicion(78, 9, "aprobar"), /profesor titular/);
  const aprobada = await decidirSolicitudEdicion(77, 9, "aprobar");
  assert.equal(aprobada.estado, "aprobada");
  assert.equal(aprobada.id_usuario_decisor, 77);
  assert.ok(
    Math.abs(new Date(aprobada.fecha_expiracion).getTime() - Date.now() - DURACION_EDICION_PRECEPTOR_MS) < 1000,
  );
});

test("no acepta solicitudes duplicadas mientras haya una pendiente o autorización vigente", async (t) => {
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  t.mock.method(Asignacion, "findByPk", async () => fila({
    id_asignacion: 2,
    cursoAsignacion: { id_curso: 1, id_preceptor: 5 },
  }));
  t.mock.method(SolicitudEdicionNota, "findOne", async () => fila({ estado: "pendiente" }));

  await assert.rejects(solicitarEdicionPlanilla(44, 2), /Ya tenés una solicitud/);
});

test("el preceptor solo crea calificaciones con una autorización temporal vigente", async (t) => {
  t.mock.method(Asignacion, "findByPk", async () => fila({
    id_asignacion: 2,
    id_profesor: 3,
    id_curso: 1,
    cursoAsignacion: { id_curso: 1, id_preceptor: 5 },
  }));
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  t.mock.method(SolicitudEdicionNota, "findOne", async () => null);

  await assert.rejects(
    crearNota({ id_alumno: 1, id_asignacion: 2, calificacion: 8 }, 44, 4),
    /no habilitó la edición/,
  );

  t.mock.method(SolicitudEdicionNota, "findOne", async () => fila({
    estado: "aprobada",
    fecha_expiracion: new Date(Date.now() + 60_000),
  }));
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1, id_curso: 1 }));
  t.mock.method(Nota, "findOne", async () => null);
  t.mock.method(Nota, "create", async (datos) => fila({ id_nota: 12, ...datos }));
  t.mock.method(HistorialNota, "create", async (datos) => fila(datos));

  const nota = await crearNota({ id_alumno: 1, id_asignacion: 2, calificacion: 8 }, 44, 4);
  assert.equal(nota.calificacion, 8);
  assert.equal(nota.id_asignacion, 2);
});

test("las rutas de solicitud de edición verifican los permisos y el profesor titular", async (t) => {
  mockearPermisosDeRol(t, {
    [ROLES.PROFESOR]: ["profesor_ver_todos_notas"],
    [ROLES.PRECEPTOR]: ["preceptor_ver_notas"],
  });
  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, id_preceptor: 5 }));
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  t.mock.method(Asignacion, "findAll", async () => [fila({ id_asignacion: 2 })]);
  t.mock.method(Asignacion, "findByPk", async () => fila({
    id_asignacion: 2,
    id_profesor: 3,
    cursoAsignacion: { id_curso: 1, id_preceptor: 5 },
  }));
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(SolicitudEdicionNota, "findAll", async () => []);
  t.mock.method(SolicitudEdicionNota, "findOne", async () => null);
  t.mock.method(SolicitudEdicionNota, "create", async (datos) => fila({ id_solicitud: 9, ...datos }));
  const pendiente = {
    id_solicitud: 9,
    id_asignacion: 2,
    estado: "pendiente",
    save: async function save() { return this; },
  };
  t.mock.method(SolicitudEdicionNota, "findByPk", async () => pendiente);

  const srv = await obtenerServidor();
  const authPreceptor = { token: token({ id: 44, id_rol: ROLES.PRECEPTOR }) };
  const authProfesor = { token: token({ id: 77, id_rol: ROLES.PROFESOR }) };

  const propias = await srv.request("GET", "/api/academico/notas/solicitudes-edicion/mias/1", authPreceptor);
  assert.equal(propias.status, 200);
  const creada = await srv.request("POST", "/api/academico/notas/solicitudes-edicion", {
    ...authPreceptor,
    body: { id_asignacion: 2 },
  });
  assert.equal(creada.status, 201);

  const pendientes = await srv.request("GET", "/api/academico/notas/solicitudes-edicion/pendientes", authProfesor);
  assert.equal(pendientes.status, 200);
  const decision = await srv.request("PATCH", "/api/academico/notas/solicitudes-edicion/9/decision", {
    ...authProfesor,
    body: { decision: "aprobar" },
  });
  assert.equal(decision.status, 200);
  assert.equal(decision.data.estado, "aprobada");
});

