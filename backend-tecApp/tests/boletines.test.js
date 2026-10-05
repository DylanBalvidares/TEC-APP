import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import {
  PeriodoBoletin,
  BoletinMateria,
  BoletinCalificacion,
  BoletinFinalizacion,
  BoletinReapertura,
  BoletinHistorial,
  Alumno,
  Asignacion,
  Curso,
  Profesor,
  Personal,
} from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  periodoEscribible,
  listarPeriodos,
  crearPeriodo,
  actualizarPeriodo,
  prepararCurso,
  obtenerCargaProfesor,
  guardarCalificacion,
  finalizarMateria,
  obtenerPlanilla,
  obtenerConsolidado,
  solicitarReapertura,
  decidirReapertura,
  listarReaperturas,
  obtenerHistorialBoletin,
} from "../src/modules/academico/boletines-controller.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

const PERIODO_ABIERTO = {
  id_periodo: 1,
  ciclo_lectivo: 2026,
  cuatrimestre: "1",
  fecha_inicio: "2000-01-01",
  fecha_cierre: "2100-12-31",
  estado: "abierto",
};

const mockPeriodoAbierto = (t) => {
  const periodoVivo = () => {
    const obj = fila(PERIODO_ABIERTO, { save: async () => true });
    const plano = { ...PERIODO_ABIERTO };
    obj.toJSON = () => ({ ...plano, estado: obj.estado, fecha_inicio: obj.fecha_inicio, fecha_cierre: obj.fecha_cierre });
    return obj;
  };
  t.mock.method(PeriodoBoletin, "findByPk", async () => periodoVivo());
  t.mock.method(PeriodoBoletin, "findOne", async () => periodoVivo());
};

test("periodoEscribible respeta estado y fechas", () => {
  assert.equal(periodoEscribible(fila(PERIODO_ABIERTO)), true);
  assert.equal(periodoEscribible(fila({ ...PERIODO_ABIERTO, estado: "cerrado" })), false);
  assert.equal(periodoEscribible(fila({ ...PERIODO_ABIERTO, fecha_cierre: "2001-01-01" })), false);
  assert.equal(periodoEscribible(null), false);
});

test("listarPeriodos marca vigencia y crearPeriodo valida", async (t) => {
  t.mock.method(PeriodoBoletin, "findAll", async () => filas([PERIODO_ABIERTO]));
  const lista = await listarPeriodos();
  assert.equal(lista[0].vigente, true);

  await assert.rejects(crearPeriodo({}), /obligatorios/);
  // El error nombra el campo faltante para autodiagnóstico en el panel.
  await assert.rejects(
    crearPeriodo({ ciclo_lectivo: 2026, cuatrimestre: "1", fecha_inicio: "2026-01-01" }),
    /fecha_cierre/,
  );
  await assert.rejects(crearPeriodo({ ciclo_lectivo: 2026, cuatrimestre: "3", fecha_inicio: "2026-01-01", fecha_cierre: "2026-06-01" }), /cuatrimestre/);
  await assert.rejects(crearPeriodo({ ciclo_lectivo: 2026, cuatrimestre: "1", fecha_inicio: "2026-06-01", fecha_cierre: "2026-01-01" }), /posterior/);

  t.mock.method(PeriodoBoletin, "create", async () => {
    throw { name: "SequelizeUniqueConstraintError" };
  });
  await assert.rejects(
    crearPeriodo({ ciclo_lectivo: 2026, cuatrimestre: "1", fecha_inicio: "2026-01-01", fecha_cierre: "2026-06-01" }),
    /Ya existe/,
  );
});

test("actualizarPeriodo 404 y valida fechas", async (t) => {
  t.mock.method(PeriodoBoletin, "findByPk", async () => null);
  await assert.rejects(actualizarPeriodo(99, {}), /no existe/);

  const viva = () => {
    const obj = fila(PERIODO_ABIERTO, { save: async () => true });
    const plano = { ...PERIODO_ABIERTO };
    obj.toJSON = () => ({ ...plano, estado: obj.estado, fecha_inicio: obj.fecha_inicio, fecha_cierre: obj.fecha_cierre });
    return obj;
  };
  t.mock.method(PeriodoBoletin, "findByPk", async () => viva());
  await assert.rejects(actualizarPeriodo(1, { fecha_inicio: "2101-01-01" }), /posterior/);
  await assert.rejects(actualizarPeriodo(1, { estado: "raro" }), /inválido/);
  const ok = await actualizarPeriodo(1, { estado: "cerrado" });
  assert.equal(ok.estado, "cerrado");
});

test("prepararCurso exige ciclo, asignaciones y responsables", async (t) => {
  mockPeriodoAbierto(t);
  t.mock.method(Curso, "findByPk", async () => null);
  await assert.rejects(prepararCurso(1, 99), /curso.*no existe/i);

  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, ciclo_lectivo: 2025 }));
  await assert.rejects(prepararCurso(1, 1), /otro ciclo/);

  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, ciclo_lectivo: 2026 }));
  t.mock.method(Asignacion, "findAll", async () => []);
  await assert.rejects(prepararCurso(1, 1), /no tiene materias/);

  t.mock.method(Asignacion, "findAll", async () => [
    fila({ id_asignacion: 2, id_profesor: null, id_materia: 5, materiaAsignacion: { nombre_materia: "Física" } }),
  ]);
  await assert.rejects(prepararCurso(1, 1), /sin profesor responsable/);

  t.mock.method(Asignacion, "findAll", async () => [
    fila({ id_asignacion: 2, id_profesor: 3, id_materia: 5 }),
  ]);
  t.mock.method(BoletinMateria, "findOrCreate", async () => [fila({}), true]);
  t.mock.method(BoletinFinalizacion, "findOrCreate", async () => [fila({}), true]);
  const resumen = await prepararCurso(1, 1);
  assert.equal(resumen.fijadas, 1);
});

test("obtenerCargaProfesor 404 sin perfil", async (t) => {
  t.mock.method(Profesor, "findOne", async () => null);
  await assert.rejects(obtenerCargaProfesor(7, 1), /perfil docente/);
});

test("guardarCalificacion valida tipos y acepta el 0", async (t) => {
  mockPeriodoAbierto(t);
  await assert.rejects(guardarCalificacion({}, 7, 3), /obligatorios/);
  await assert.rejects(
    guardarCalificacion({ id_periodo: 1, id_asignacion: 2, id_alumno: 1, tipo: "rara" }, 7, 3),
    /inválido/,
  );
  await assert.rejects(
    guardarCalificacion({ id_periodo: 1, id_asignacion: 2, id_alumno: 1, tipo: "sin_calificar", motivo: " " }, 7, 3),
    /motivo obligatorio/,
  );
  await assert.rejects(
    guardarCalificacion({ id_periodo: 1, id_asignacion: 2, id_alumno: 1, tipo: "numerica", valor: 11 }, 7, 3),
    /entre 0 y 10/,
  );

  t.mock.method(Asignacion, "findByPk", async () =>
    fila({ id_asignacion: 2, id_profesor: 3, id_curso: 1 }),
  );
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 9 }));
  await assert.rejects(
    guardarCalificacion({ id_periodo: 1, id_asignacion: 2, id_alumno: 1, tipo: "TED" }, 7, 3),
    /no tenés asignada/,
  );

  // Camino feliz con 0 numérico (válido, no pendiente).
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1, id_curso: 1 }));
  t.mock.method(BoletinFinalizacion, "findOne", async () =>
    fila({ estado: "en_progreso" }, { save: async () => true }),
  );
  t.mock.method(BoletinCalificacion, "findOne", async () => null);
  t.mock.method(BoletinCalificacion, "create", async (d) => fila({ id_boletin_nota: 5, ...d }));
  const creadoHistorial = [];
  t.mock.method(BoletinHistorial, "create", async (d) => {
    creadoHistorial.push(d);
    return fila(d);
  });
  const cero = await guardarCalificacion(
    { id_periodo: 1, id_asignacion: 2, id_alumno: 1, tipo: "numerica", valor: 0 },
    7,
    3,
  );
  assert.equal(Number(cero.valor), 0);
  assert.equal(creadoHistorial[0].accion, "alta");

  // Alumno de otro curso → 400.
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1, id_curso: 2 }));
  await assert.rejects(
    guardarCalificacion({ id_periodo: 1, id_asignacion: 2, id_alumno: 1, tipo: "TED" }, 7, 3),
    /no pertenece/,
  );
});

test("guardarCalificacion bloquea materia finalizada sin reapertura", async (t) => {
  mockPeriodoAbierto(t);
  t.mock.method(Asignacion, "findByPk", async () =>
    fila({ id_asignacion: 2, id_profesor: 3, id_curso: 1 }),
  );
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1, id_curso: 1 }));
  t.mock.method(BoletinFinalizacion, "findOne", async () =>
    fila({ estado: "finalizada", fecha_finalizacion: new Date("2026-01-01") }),
  );
  t.mock.method(BoletinReapertura, "findOne", async () => null);
  await assert.rejects(
    guardarCalificacion({ id_periodo: 1, id_asignacion: 2, id_alumno: 1, tipo: "TED" }, 7, 3),
    /finalizada/,
  );
});

test("finalizarMateria exige 0 pendientes y audita", async (t) => {
  mockPeriodoAbierto(t);
  t.mock.method(Asignacion, "findByPk", async () =>
    fila({ id_asignacion: 2, id_profesor: 3, id_curso: 1 }),
  );
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  const fin = () => fila({ estado: "en_progreso" }, { save: async () => true });
  t.mock.method(BoletinFinalizacion, "findOne", async () => fin());
  t.mock.method(Alumno, "findAll", async () =>
    filas([{ id_alumno: 1, apellido: "A", nombre: "B" }, { id_alumno: 2, apellido: "C", nombre: "D" }]),
  );
  t.mock.method(BoletinCalificacion, "findAll", async () => filas([{ id_alumno: 1 }]));
  await assert.rejects(finalizarMateria({ id_periodo: 1, id_asignacion: 2 }, 7, 3), /pendientes/);

  t.mock.method(BoletinCalificacion, "findAll", async () =>
    filas([{ id_alumno: 1 }, { id_alumno: 2 }]),
  );
  t.mock.method(BoletinHistorial, "create", async (d) => fila(d));
  const res = await finalizarMateria({ id_periodo: 1, id_asignacion: 2 }, 7, 3);
  assert.equal(res.estado, "finalizada");
});

test("obtenerPlanilla verifica curso y solo muestra finalizadas", async (t) => {
  t.mock.method(Curso, "findByPk", async () => null);
  await assert.rejects(obtenerPlanilla(99, 4, 4, 1), /no existe/);

  mockPeriodoAbierto(t);
  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, id_preceptor: 8 }));
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  await assert.rejects(obtenerPlanilla(1, 4, 4, 1), /asignado/);

  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, id_preceptor: 5 }));
  t.mock.method(BoletinMateria, "findAll", async () => filas([{ id_asignacion: 2 }]));
  t.mock.method(BoletinFinalizacion, "findAll", async () =>
    filas([{ id_asignacion: 2, estado: "finalizada" }]),
  );
  t.mock.method(BoletinCalificacion, "findAll", async () =>
    filas([{ id_asignacion: 2, id_alumno: 1, tipo: "numerica", valor: 8 }]),
  );
  t.mock.method(Alumno, "findAll", async () => filas([{ id_alumno: 1 }]));
  t.mock.method(Asignacion, "findAll", async () => filas([{ id_asignacion: 2 }]));
  const planilla = await obtenerPlanilla(1, 4, 4, 1);
  assert.equal(planilla.materias.length, 1);
  assert.equal(planilla.materias[0].calificaciones.length, 1);
});

test("obtenerConsolidado 409 si falta finalizar", async (t) => {
  mockPeriodoAbierto(t);
  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, id_preceptor: 5 }));
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  t.mock.method(BoletinMateria, "findAll", async () => filas([{ id_asignacion: 2 }]));
  t.mock.method(BoletinFinalizacion, "findAll", async () =>
    filas([{ id_asignacion: 2, estado: "en_progreso" }]),
  );
  t.mock.method(BoletinCalificacion, "findAll", async () => []);
  t.mock.method(Alumno, "findAll", async () => []);
  t.mock.method(Asignacion, "findAll", async () =>
    filas([{ id_asignacion: 2, materiaAsignacion: { nombre_materia: "Matemática" } }]),
  );
  await assert.rejects(obtenerConsolidado(1, 4, 4, 1), /no está disponible/);

  t.mock.method(BoletinFinalizacion, "findAll", async () =>
    filas([{ id_asignacion: 2, estado: "finalizada" }]),
  );
  t.mock.method(BoletinCalificacion, "findAll", async () =>
    filas([{ id_alumno: 1, id_asignacion: 2, tipo: "TEP", valor: null, motivo: null }]),
  );
  const cons = await obtenerConsolidado(1, 4, 4, 1);
  assert.equal(cons.calificaciones[1][2].muestra, "TEP");
});

test("reaperturas: solicitar valida y decidir audita", async (t) => {
  mockPeriodoAbierto(t);
  await assert.rejects(solicitarReapertura({}, 7, 3), /obligatorios/);

  t.mock.method(Asignacion, "findByPk", async () =>
    fila({ id_asignacion: 2, id_profesor: 3, id_curso: 1 }),
  );
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(BoletinFinalizacion, "findOne", async () => fila({ estado: "en_progreso" }));
  await assert.rejects(
    solicitarReapertura({ id_periodo: 1, id_asignacion: 2, motivo: "x" }, 7, 3),
    /finalizada/,
  );

  t.mock.method(BoletinFinalizacion, "findOne", async () => fila({ estado: "finalizada" }));
  t.mock.method(BoletinReapertura, "findOne", async () => fila({ estado: "pendiente" }));
  await assert.rejects(
    solicitarReapertura({ id_periodo: 1, id_asignacion: 2, motivo: "x" }, 7, 3),
    /pendiente para esta materia/,
  );

  t.mock.method(BoletinReapertura, "findOne", async () => null);
  t.mock.method(BoletinReapertura, "create", async (d) => fila({ id_reapertura: 9, ...d }));
  t.mock.method(BoletinHistorial, "create", async (d) => fila(d));
  const sol = await solicitarReapertura({ id_periodo: 1, id_asignacion: 2, motivo: "error" }, 7, 3);
  assert.equal(sol.estado, "pendiente");

  await assert.rejects(decidirReapertura(9, { estado: "dudosa" }, 7), /aprobada o rechazada/);
  t.mock.method(BoletinReapertura, "findByPk", async () => null);
  await assert.rejects(decidirReapertura(9, { estado: "aprobada" }, 7), /no existe/);
  t.mock.method(BoletinReapertura, "findByPk", async () => fila({ estado: "aprobada" }));
  await assert.rejects(decidirReapertura(9, { estado: "aprobada" }, 7), /ya fue decidida/);

  const fin = { estado: "finalizada", save: async () => true };
  t.mock.method(BoletinReapertura, "findByPk", async () => ({
    id_reapertura: 9,
    id_periodo: 1,
    id_asignacion: 2,
    estado: "pendiente",
    save: async () => true,
  }));
  t.mock.method(BoletinFinalizacion, "findOne", async () => fin);
  const aprobada = await decidirReapertura(9, { estado: "aprobada" }, 7);
  assert.equal(aprobada.estado, "aprobada");
  assert.equal(fin.estado, "en_progreso");
});

test("listarReaperturas filtra por solicitante si es profesor", async (t) => {
  let capturado = null;
  t.mock.method(BoletinReapertura, "findAll", async (args) => {
    capturado = args;
    return [];
  });
  await listarReaperturas(7, 3, {});
  assert.equal(capturado.where.solicitado_por, 7);
  await listarReaperturas(7, 8, { estado: "pendiente" });
  assert.equal(capturado.where.estado, "pendiente");
  assert.equal(capturado.where.solicitado_por, undefined);
});

test("obtenerHistorialBoletin autoriza por rol", async (t) => {
  t.mock.method(Alumno, "findByPk", async () => null);
  await assert.rejects(obtenerHistorialBoletin(99, 7, 1, null), /no encontrado/i);

  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 2, id_usuario: 8 }));
  await assert.rejects(obtenerHistorialBoletin(2, 7, 1, null), /otro alumno/);

  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 2, id_curso: 1 }));
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, id_preceptor: 6 }));
  await assert.rejects(obtenerHistorialBoletin(2, 7, 4, null), /a cargo/);

  t.mock.method(BoletinHistorial, "findAll", async () => filas([{ id_boletin_historial: 1 }]));
  assert.equal((await obtenerHistorialBoletin(2, 7, 8, null)).length, 1);
});

test("rutas HTTP de boletines: 401/403 y flujo de carga", async (t) => {
  mockearPermisosDeRol(t, {
    [ROLES.PROFESOR]: ["boletin_ver_periodos", "boletin_cargar", "boletin_finalizar", "boletin_ver_historial"],
    [ROLES.ADMINISTRATIVO]: [],
  });
  mockPeriodoAbierto(t);
  t.mock.method(PeriodoBoletin, "findAll", async () => filas([PERIODO_ABIERTO]));
  t.mock.method(PeriodoBoletin, "create", async (d) => fila({ id_periodo: 2, ...d }));
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(Asignacion, "findByPk", async () =>
    fila({ id_asignacion: 2, id_profesor: 3, id_curso: 1 }),
  );
  t.mock.method(Asignacion, "findAll", async () => filas([{ id_asignacion: 2, id_curso: 1 }]));
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 1, id_curso: 1 }));
  t.mock.method(Alumno, "findAll", async () => filas([{ id_alumno: 1, id_curso: 1 }]));
  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 1, ciclo_lectivo: 2026 }));
  t.mock.method(BoletinFinalizacion, "findOne", async () =>
    fila({ estado: "en_progreso" }, { save: async () => true }),
  );
  t.mock.method(BoletinFinalizacion, "findOrCreate", async () => [fila({}), true]);
  t.mock.method(BoletinMateria, "findOrCreate", async () => [fila({}), true]);
  t.mock.method(BoletinMateria, "findAll", async () => filas([{ id_asignacion: 2 }]));
  t.mock.method(BoletinFinalizacion, "findAll", async () =>
    filas([{ id_asignacion: 2, estado: "en_progreso" }]),
  );
  t.mock.method(BoletinCalificacion, "findOne", async () => null);
  t.mock.method(BoletinCalificacion, "create", async (d) => fila({ id_boletin_nota: 1, ...d }));
  t.mock.method(BoletinCalificacion, "findAll", async () => filas([{ id_alumno: 1 }]));
  t.mock.method(BoletinHistorial, "create", async (d) => fila(d));
  t.mock.method(BoletinHistorial, "findAll", async () => filas([{ id_boletin_historial: 1 }]));
  const srv = await obtenerServidor();
  const authProfesor = token({ id: 7, id_rol: ROLES.PROFESOR });

  await sinToken(srv, "GET", "/api/academico/boletines/periodos");
  await sinPermiso(srv, "POST", "/api/academico/boletines/periodos", {
    body: { ciclo_lectivo: 2026, cuatrimestre: "1", fecha_inicio: "2026-01-01", fecha_cierre: "2026-06-01" },
  });

  const periodos = await srv.request("GET", "/api/academico/boletines/periodos", { token: authProfesor });
  assert.equal(periodos.status, 200);

  const carga = await srv.request("GET", "/api/academico/boletines/profesor", { token: authProfesor });
  assert.equal(carga.status, 200);

  const nota = await srv.request("POST", "/api/academico/boletines/calificaciones", {
    token: authProfesor,
    body: { id_periodo: 1, id_asignacion: 2, id_alumno: 1, tipo: "numerica", valor: 8 },
  });
  assert.equal(nota.status, 201);

  const fin = await srv.request("POST", "/api/academico/boletines/finalizar", {
    token: authProfesor,
    body: { id_periodo: 1, id_asignacion: 2 },
  });
  assert.equal(fin.status, 200);

  const hist = await srv.request("GET", "/api/academico/boletines/historial/alumno/1", {
    token: authProfesor,
  });
  assert.equal(hist.status, 200);
});

test("rutas HTTP de boletines: gestión, lectura y reaperturas", async (t) => {
  mockearPermisosDeRol(t, {
    [ROLES.ADMINISTRATIVO]: [
      "boletin_ver_periodos",
      "boletin_gestionar_periodos",
      "boletin_decidir_reapertura",
      "boletin_ver_planilla",
      "boletin_ver_consolidado",
    ],
    [ROLES.PRECEPTOR]: ["boletin_ver_planilla", "boletin_ver_consolidado"],
    [ROLES.PROFESOR]: ["boletin_solicitar_reapertura"],
  });
  mockPeriodoAbierto(t);
  t.mock.method(PeriodoBoletin, "create", async (d) => fila({ id_periodo: 2, ...d }));
  t.mock.method(Curso, "findByPk", async () =>
    fila({ id_curso: 1, ciclo_lectivo: 2026, id_preceptor: 5 }),
  );
  t.mock.method(Asignacion, "findAll", async () =>
    filas([{ id_asignacion: 2, id_profesor: 3, id_materia: 5 }]),
  );
  t.mock.method(Asignacion, "findByPk", async () =>
    fila({ id_asignacion: 2, id_profesor: 3, id_curso: 1 }),
  );
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 3 }));
  t.mock.method(Personal, "findOne", async () => fila({ id_personal: 5 }));
  t.mock.method(Alumno, "findAll", async () => filas([{ id_alumno: 1 }]));
  t.mock.method(BoletinMateria, "findOrCreate", async () => [fila({}), true]);
  t.mock.method(BoletinMateria, "findAll", async () => filas([{ id_asignacion: 2 }]));
  t.mock.method(BoletinFinalizacion, "findOrCreate", async () => [fila({}), true]);
  t.mock.method(BoletinFinalizacion, "findOne", async () =>
    fila({ estado: "finalizada" }, { save: async () => true }),
  );
  t.mock.method(BoletinFinalizacion, "findAll", async () =>
    filas([{ id_asignacion: 2, estado: "finalizada" }]),
  );
  t.mock.method(BoletinCalificacion, "findAll", async () =>
    filas([{ id_alumno: 1, id_asignacion: 2, tipo: "numerica", valor: 8, motivo: null }]),
  );
  t.mock.method(BoletinReapertura, "findOne", async () => null);
  t.mock.method(BoletinReapertura, "create", async (d) => fila({ id_reapertura: 9, ...d }));
  t.mock.method(BoletinReapertura, "findAll", async () => filas([]));
  t.mock.method(BoletinReapertura, "findByPk", async () => ({
    id_reapertura: 9,
    id_periodo: 1,
    id_asignacion: 2,
    estado: "pendiente",
    save: async () => true,
  }));
  t.mock.method(BoletinHistorial, "create", async (d) => fila(d));
  const srv = await obtenerServidor();
  const authAdmin = token({ id: 7, id_rol: ROLES.ADMINISTRATIVO });
  const authPreceptor = token({ id: 9, id_rol: ROLES.PRECEPTOR });
  const authProfesor = token({ id: 11, id_rol: ROLES.PROFESOR });

  const creado = await srv.request("POST", "/api/academico/boletines/periodos", {
    token: authAdmin,
    body: { ciclo_lectivo: 2026, cuatrimestre: "1", fecha_inicio: "2026-01-01", fecha_cierre: "2026-06-01" },
  });
  assert.equal(creado.status, 201);

  const editado = await srv.request("PATCH", "/api/academico/boletines/periodos/1", {
    token: authAdmin,
    body: { estado: "abierto" },
  });
  assert.equal(editado.status, 200);

  const prep = await srv.request("POST", "/api/academico/boletines/periodos/1/preparar", {
    token: authAdmin,
    body: { id_curso: 1 },
  });
  assert.equal(prep.status, 200);

  const planilla = await srv.request("GET", "/api/academico/boletines/planilla/curso/1", {
    token: authPreceptor,
  });
  assert.equal(planilla.status, 200);

  const consolidado = await srv.request("GET", "/api/academico/boletines/consolidado/curso/1", {
    token: authPreceptor,
  });
  assert.equal(consolidado.status, 200);

  const lista = await srv.request("GET", "/api/academico/boletines/reaperturas", {
    token: authAdmin,
  });
  assert.equal(lista.status, 200);

  const sol = await srv.request("POST", "/api/academico/boletines/reaperturas", {
    token: authProfesor,
    body: { id_periodo: 1, id_asignacion: 2, motivo: "error de carga" },
  });
  assert.equal(sol.status, 201);

  const dec = await srv.request("PATCH", "/api/academico/boletines/reaperturas/9", {
    token: authAdmin,
    body: { estado: "aprobada" },
  });
  assert.equal(dec.status, 200);
});
