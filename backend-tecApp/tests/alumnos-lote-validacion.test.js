import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { Alumno, Curso } from "../src/db/models/index.js";
import {
  validarLoteAlumnos,
  crearAlumnosEnLote,
} from "../src/modules/academico/alumnos-controller.js";

after(cerrarServidor);

function alumnoValido(sobrescribir = {}) {
  return {
    nombre: "Ana",
    apellido: "Paz",
    dni: "40123456",
    fecha_nacimiento: "2010-01-01",
    nombre_tutor: "Luz Paz",
    telefono_tutor: "2901123456",
    domicilio: "Calle 1",
    id_curso: 1,
    ...sobrescribir,
  };
}

function mockearBD(t, { dnisExistentes = [], cursos = [1] } = {}) {
  t.mock.method(Alumno, "findAll", async () => dnisExistentes.map((dni) => ({ dni })));
  t.mock.method(Curso, "findAll", async () => cursos.map((id_curso) => ({ id_curso })));
}

test("validarLoteAlumnos reporta filas ok sin insertar", async (t) => {
  mockearBD(t);
  const reporte = await validarLoteAlumnos([alumnoValido(), alumnoValido({ dni: "40999888" })]);

  assert.equal(reporte.total, 2);
  assert.equal(reporte.validas, 2);
  assert.equal(reporte.invalidas, 0);
  assert.equal(reporte.hayErrores, false);
});

test("validarLoteAlumnos detecta faltantes, duplicados y existentes", async (t) => {
  mockearBD(t, { dnisExistentes: ["40123456"] });
  const reporte = await validarLoteAlumnos([
    alumnoValido(),
    alumnoValido(),
    alumnoValido({ dni: "41", nombre: "" }),
  ]);

  assert.equal(reporte.hayErrores, true);
  assert.deepEqual(reporte.dnisExistentes, ["40123456"]);
  assert.deepEqual(reporte.dnisDuplicados, ["40123456"]);
  const fila3 = reporte.filas.find((f) => f.fila === 3);
  assert.equal(fila3.ok, false);
  assert.ok(fila3.errores.some((e) => e.includes("nombre")));
});

test("validarLoteAlumnos detecta cursos inexistentes", async (t) => {
  mockearBD(t, { cursos: [1] });
  const reporte = await validarLoteAlumnos([alumnoValido({ id_curso: 99 })]);

  assert.deepEqual(reporte.cursosInexistentes, [99]);
  assert.equal(reporte.hayErrores, true);
});

test("crearAlumnosEnLote con soloValidar no inserta", async (t) => {
  mockearBD(t);
  const buscar = t.mock.method(Alumno, "bulkCreate", async () => {
    throw new Error("no deberia insertar");
  });

  const resultado = await crearAlumnosEnLote([alumnoValido()], { soloValidar: true });

  assert.equal(resultado.ok, true);
  assert.equal(resultado.reporte.validas, 1);
  assert.equal(buscar.mock.calls.length, 0);
});

test("POST /alumnos/lote?validar=true devuelve reporte sin guardar", async (t) => {
  mockearBD(t);
  mockearPermisosDeRol(t, {
    [ROLES.ADMINISTRATIVO]: ["administrativo_crear_alumno"],
  });
  const srv = await obtenerServidor();

  const res = await srv.request("POST", "/api/academico/alumnos/lote?validar=true", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
    body: { alumnos: [alumnoValido(), alumnoValido({ dni: "", nombre: "" })] },
  });

  assert.equal(res.status, 200);
  assert.equal(res.data.ok, true);
  assert.equal(res.data.reporte.total, 2);
  assert.equal(res.data.reporte.invalidas, 1);
});
