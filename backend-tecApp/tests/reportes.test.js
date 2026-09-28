import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import {
  Alumno,
  Curso,
  Asistencia,
  Nota,
} from "../src/db/models/index.js";
import { obtenerResumenReportes } from "../src/modules/admin/reportes-controller.js";

after(cerrarServidor);

const instancia = (datos) => ({ ...datos, toJSON: () => ({ ...datos }) });

function dataset() {
  return {
    cursos: [
      instancia({
        id_curso: 1,
        nombre_curso: "1A",
        Alumnos: [
          { estado: "activo" },
          { estado: "activo" },
          { estado: "baja" },
        ],
      }),
    ],
    asistencias: [
      { id_curso: 1, estado: "presente", cantidad: 40 },
      { id_curso: 1, estado: "ausente", cantidad: 10 },
    ],
    promedios: [
      {
        promedio: "7.50",
        Asignacion: { materiaAsignacion: { id_materia: 2, nombre_materia: "Matemática" } },
      },
    ],
    estados: [
      { estado: "activo", cantidad: 90 },
      { estado: "baja", cantidad: 10 },
    ],
  };
}

function mockear(ds) {
  Curso.findAll = async () => ds.cursos;
  Asistencia.findAll = async () => ds.asistencias;
  Nota.findAll = async () => ds.promedios;
  Alumno.findAll = async () => ds.estados;
}

test("obtenerResumenReportes agrega retencion, asistencia, promedios y altas/bajas", async () => {
  mockear(dataset());

  const r = await obtenerResumenReportes();

  assert.deepEqual(r.retencion, [
    { id_curso: 1, nombre: "1A", activos: 2, bajas: 1, total: 3, retencion_pct: 67 },
  ]);
  assert.deepEqual(r.asistenciaPorCurso, dataset().asistencias);
  assert.deepEqual(r.promediosPorMateria, [
    { id_materia: 2, nombre: "Matemática", promedio: 7.5 },
  ]);
  assert.deepEqual(r.altasBajas, { activo: 90, baja: 10 });
});

test("GET /api/admin/reportes/resumen exige administrativo_ver_reportes", async (t) => {
  mockear(dataset());
  mockearPermisosDeRol(t, {
    [ROLES.ADMINISTRATIVO]: ["administrativo_ver_reportes"],
  });
  const srv = await obtenerServidor();

  const sinPermiso = await srv.request("GET", "/api/admin/reportes/resumen", {
    token: token({ id_rol: ROLES.ALUMNO }),
  });
  assert.equal(sinPermiso.status, 403);

  const admin = await srv.request("GET", "/api/admin/reportes/resumen", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
  });
  assert.equal(admin.status, 200);
  assert.equal(admin.data.ok, true);
  assert.ok(Array.isArray(admin.data.retencion));
});
