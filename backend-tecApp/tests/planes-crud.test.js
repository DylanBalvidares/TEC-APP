import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import {
  PlanEstudio,
  PlanMateria,
  Materia,
  Correlativa,
  Curso,
} from "../src/db/models/index.js";
import sequelize from "../src/db/conexionDB.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerTodosPlanes,
  obtenerPlan,
  obtenerVigentes,
  crearPlan,
  modificarPlan,
  eliminarPlan,
  agregarMateriaAPlan,
  quitarMateriaDePlan,
  agregarCorrelativa,
  quitarCorrelativa,
  anotarEnPlan,
} from "../src/modules/academico/planes-controller.js";

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

function transaccionFalsa(t) {
  t.mock.method(sequelize, "transaction", async () => ({
    commit: async () => true,
    rollback: async () => true,
  }));
}

const PLAN = { nombre: "Técnico", codigo: "TEC", orientacion: "Informática" };
const BORRADOR = { id_plan: 1, estado: "borrador", orientacion: "Informática" };

test("obtenerTodosPlanes y obtenerPlan", async (t) => {
  t.mock.method(PlanEstudio, "findAll", async () => []);
  await assert.rejects(obtenerTodosPlanes(), /No se encontraron/);
  t.mock.method(PlanEstudio, "findAll", async () => filas([{ id_plan: 1 }]));
  assert.equal((await obtenerTodosPlanes()).length, 1);

  await assert.rejects(obtenerPlan(0), /inválida/);
  t.mock.method(PlanEstudio, "findByPk", async () => null);
  await assert.rejects(obtenerPlan(99), /No se encontró/);
  t.mock.method(PlanEstudio, "findByPk", async () => fila({ id_plan: 1 }));
  assert.equal((await obtenerPlan(1)).id_plan, 1);
});

test("obtenerVigentes filtra por anio y curso", async (t) => {
  await assert.rejects(obtenerVigentes({ anio: "mal" }), /inválidos/);

  t.mock.method(Curso, "findByPk", async () => null);
  await assert.rejects(obtenerVigentes({ curso: 99 }), /No se encontró el curso/);

  t.mock.method(Curso, "findByPk", async () => fila({ id_curso: 2, anio: 3 }));
  const buscar = t.mock.method(PlanEstudio, "findAll", async () => []);
  await assert.rejects(obtenerVigentes({ curso: 2 }), /criterio/);
  assert.equal(buscar.mock.calls[0].arguments[0].where.estado, "vigente");

  t.mock.method(PlanEstudio, "findAll", async () => filas([{ id_plan: 1 }]));
  assert.equal((await obtenerVigentes({ anio: 3 })).length, 1);
});

test("crearPlan valida, 409 duplicado y vigencia única", async (t) => {
  transaccionFalsa(t);
  await assert.rejects(crearPlan({}), /obligatorios/);
  await assert.rejects(crearPlan({ ...PLAN, estado: "raro" }), /inválido/);

  t.mock.method(PlanEstudio, "create", async (d) => fila({ id_plan: 1, ...d }));
  const update = t.mock.method(PlanEstudio, "update", async () => [2]);
  const plan = await crearPlan({ ...PLAN, estado: "vigente" });
  assert.equal(plan.estado, "vigente");
  // Al activar, los demás vigentes de la orientación pasan a histórico.
  assert.deepEqual(update.mock.calls[0].arguments[0], { estado: "historico" });

  const dup = new Error("dup");
  dup.name = "SequelizeUniqueConstraintError";
  t.mock.method(PlanEstudio, "create", async () => {
    throw dup;
  });
  await assert.rejects(crearPlan({ ...PLAN }), /Ya existe/);
});

test("modificarPlan valida, 404 y 409 duplicado", async (t) => {
  transaccionFalsa(t);
  await assert.rejects(modificarPlan({}), /inválida/);

  t.mock.method(PlanEstudio, "findByPk", async () => null);
  await assert.rejects(modificarPlan({ id_plan: 99 }), /No se encontró/);

  t.mock.method(PlanEstudio, "findByPk", async () =>
    fila({ ...BORRADOR, update: async () => [1] }),
  );
  await assert.rejects(modificarPlan({ id_plan: 1, estado: "raro" }), /inválido/);
  await assert.rejects(modificarPlan({ id_plan: 1, nombre: " " }), /vacío/);

  const plan = await modificarPlan({ id_plan: 1, nombre: "Nuevo" });
  assert.equal(plan.id_plan, 1);
});

test("eliminarPlan protege vigentes y 404", async (t) => {
  t.mock.method(PlanEstudio, "findByPk", async () => null);
  await assert.rejects(eliminarPlan(99), /No se encontró/);

  t.mock.method(PlanEstudio, "findByPk", async () => fila({ id_plan: 1, estado: "vigente" }));
  await assert.rejects(eliminarPlan(1), /histórico/);

  t.mock.method(PlanEstudio, "findByPk", async () =>
    fila({ id_plan: 1, estado: "borrador", destroy: async () => 1 }),
  );
  assert.equal((await eliminarPlan(1)).message, "Plan de estudio eliminado");
});

test("agregarMateriaAPlan valida plan, materia y duplicados", async (t) => {
  await assert.rejects(agregarMateriaAPlan(0, {}), /inválida/);
  t.mock.method(PlanEstudio, "findByPk", async () => null);
  await assert.rejects(agregarMateriaAPlan(99, {}), /No se encontró el plan/);

  t.mock.method(PlanEstudio, "findByPk", async () => fila({ id_plan: 1, estado: "historico" }));
  await assert.rejects(agregarMateriaAPlan(1, {}), /histórico/);

  t.mock.method(PlanEstudio, "findByPk", async () => fila({ ...BORRADOR }));
  await assert.rejects(agregarMateriaAPlan(1, {}), /materia inválida/);
  await assert.rejects(agregarMateriaAPlan(1, { id_materia: 2, anio: 9 }), /Año inválido/);

  t.mock.method(Materia, "findByPk", async () => null);
  await assert.rejects(
    agregarMateriaAPlan(1, { id_materia: 2, anio: 2 }),
    /No se encontró la materia/,
  );

  t.mock.method(Materia, "findByPk", async () => fila({ id_materia: 2 }));
  const dup = new Error("dup");
  dup.name = "SequelizeUniqueConstraintError";
  t.mock.method(PlanMateria, "create", async () => {
    throw dup;
  });
  await assert.rejects(
    agregarMateriaAPlan(1, { id_materia: 2, anio: 2 }),
    /ya está en ese año/,
  );

  t.mock.method(PlanMateria, "create", async (d) => fila({ id_plan_materia: 7, ...d }));
  const vinc = await agregarMateriaAPlan(1, { id_materia: 2, anio: 2 });
  assert.equal(vinc.id_plan_materia, 7);
  assert.equal(vinc.cuatrimestre, "anual");
});

test("quitarMateriaDePlan protege histórico y 404", async (t) => {
  t.mock.method(PlanMateria, "findByPk", async () => null);
  await assert.rejects(quitarMateriaDePlan(99), /No se encontró el vínculo/);

  t.mock.method(PlanMateria, "findByPk", async () =>
    fila({ id_plan_materia: 7, plan: { estado: "historico" }, destroy: async () => 1 }),
  );
  await assert.rejects(quitarMateriaDePlan(7), /histórico/);

  t.mock.method(PlanMateria, "findByPk", async () =>
    fila({ id_plan_materia: 7, plan: { estado: "borrador" }, destroy: async () => 1 }),
  );
  assert.equal((await quitarMateriaDePlan(7)).message, "Materia quitada del plan");
});

test("correlativas: reglas, duplicados y borrado", async (t) => {
  await assert.rejects(agregarCorrelativa(0, {}), /inválida/);
  await assert.rejects(agregarCorrelativa(7, {}), /requerida inválida/);

  t.mock.method(PlanMateria, "findByPk", async () => null);
  await assert.rejects(agregarCorrelativa(7, { id_plan_materia_req: 8 }), /vínculo/);

  const vinculo = () =>
    fila({
      id_plan_materia: 7,
      id_plan: 1,
      anio: 3,
      plan: { estado: "borrador" },
    });
  t.mock.method(PlanMateria, "findByPk", async (id) => {
    if (Number(id) === 7) return vinculo();
    if (Number(id) === 8) return fila({ id_plan_materia: 8, id_plan: 1, anio: 2 });
    return fila({ id_plan_materia: Number(id), id_plan: 9, anio: 1 });
  });
  // Requerida de otro plan → 409.
  await assert.rejects(
    agregarCorrelativa(7, { id_plan_materia_req: 10 }),
    /mismo plan/,
  );

  t.mock.method(Correlativa, "create", async (d) => fila({ id_correlativa: 3, ...d }));
  const corr = await agregarCorrelativa(7, { id_plan_materia_req: 8 });
  assert.equal(corr.id_correlativa, 3);

  await assert.rejects(quitarCorrelativa(0, 0), /inválidos/);
  t.mock.method(Correlativa, "destroy", async () => 0);
  await assert.rejects(quitarCorrelativa(7, 8), /No se encontró/);
  t.mock.method(Correlativa, "destroy", async () => 1);
  assert.equal((await quitarCorrelativa(7, 8)).message, "Correlativa eliminada");
});

test("anotarEnPlan marca en_plan sin romper", async (t) => {
  t.mock.method(PlanEstudio, "findAll", async () => [
    { materiasPlan: [{ id_materia: 2, anio: 3 }] },
  ]);
  const marcadas = [];
  const a1 = { id_materia: 2, cursoAsignacion: { anio: 3 }, setDataValue: (k, v) => marcadas.push(v) };
  const a2 = { id_materia: 9, cursoAsignacion: { anio: 3 } };
  const a3 = { id_materia: 2, cursoAsignacion: {} };
  await anotarEnPlan([a1, a2, a3]);
  assert.deepEqual(marcadas, [true]);
  assert.equal(a2.en_plan, false);
  assert.equal(a3.en_plan, null);
});

test("rutas /planes: lectura, escritura y 401/403", async (t) => {
  await permisos(t, {
    [ROLES.ADMINISTRATIVO]: ["administrativo_ver_planes"],
    [ROLES.ROOT]: [
      "administrativo_ver_planes",
      "administrativo_crear_plan",
      "administrativo_editar_plan",
      "administrativo_eliminar_plan",
    ],
  });
  transaccionFalsa(t);
  t.mock.method(PlanEstudio, "findAll", async () => filas([{ id_plan: 1 }]));
  t.mock.method(PlanEstudio, "findByPk", async () => fila({ ...BORRADOR }));
  t.mock.method(PlanEstudio, "create", async (d) => fila({ id_plan: 1, ...d }));
  t.mock.method(PlanEstudio, "update", async () => [1]);
  t.mock.method(PlanMateria, "findByPk", async (id) =>
    fila({
      id_plan_materia: Number(id),
      id_plan: 1,
      anio: Number(id) === 7 ? 3 : 2,
      plan: { estado: "borrador" },
      destroy: async () => 1,
    }),
  );
  t.mock.method(Materia, "findByPk", async () => fila({ id_materia: 2 }));
  t.mock.method(PlanMateria, "create", async (d) => fila({ id_plan_materia: 7, ...d }));
  t.mock.method(Correlativa, "create", async (d) => fila({ id_correlativa: 3, ...d }));
  t.mock.method(Correlativa, "destroy", async () => 1);
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/planes");
  await sinPermiso(srv, "POST", "/api/academico/planes", { body: PLAN });

  const ver = { token: token({ id_rol: ROLES.ADMINISTRATIVO }) };
  const root = { token: token({ id_rol: ROLES.ROOT }) };

  for (const ruta of [
    "/api/academico/planes/vigentes",
    "/api/academico/planes/1",
    "/api/academico/planes",
  ]) {
    const res = await srv.request("GET", ruta, ver);
    assert.equal(res.status, 200, ruta);
  }

  const creado = await srv.request("POST", "/api/academico/planes", { ...root, body: PLAN });
  assert.equal(creado.status, 201);

  const mod = await srv.request("PATCH", "/api/academico/planes", {
    ...root,
    body: { id_plan: 1, nombre: "Nuevo" },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/academico/planes/1", root);
  assert.equal(del.status, 200);

  const vinc = await srv.request("POST", "/api/academico/planes/1/materias", {
    ...root,
    body: { id_materia: 2, anio: 2 },
  });
  assert.equal(vinc.status, 201);

  const quitar = await srv.request("DELETE", "/api/academico/planes/materias/7", root);
  assert.equal(quitar.status, 200);

  const corr = await srv.request("POST", "/api/academico/planes/materias/7/correlativas", {
    ...root,
    body: { id_plan_materia_req: 8 },
  });
  assert.equal(corr.status, 201);

  const quitarCorr = await srv.request(
    "DELETE",
    "/api/academico/planes/materias/7/correlativas/8",
    root,
  );
  assert.equal(quitarCorr.status, 200);
});
