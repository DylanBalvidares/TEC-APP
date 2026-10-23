import { after, test } from "node:test";
import assert from "node:assert/strict";

import { Alumno, Asignacion, Curso } from "../src/db/models/index.js";
import { obtenerParticipantesParaAlumno } from "../src/modules/academico/alumnos-controller.js";
import { fila } from "./helpers/crud.js";
import sequelize from "../src/db/conexionDB.js";

after(() => sequelize.close());

test("obtiene los participantes desde el usuario autenticado y limita datos expuestos", async (t) => {
  let opcionesAlumnosCurso;
  let opcionesAsignaciones;
  t.mock.method(Alumno, "findOne", async (opciones) => {
    assert.deepEqual(opciones.where, { id_usuario: 88 });
    return fila({ id_alumno: 3, id_curso: 55 });
  });
  t.mock.method(Alumno, "findAll", async (opciones) => {
    opcionesAlumnosCurso = opciones;
    const estadoKey = Reflect.ownKeys(opciones.where.estado)[0];
    assert.deepEqual(opciones.where.estado[estadoKey], ["activo", "condicional"]);
    return [
      fila({ id_alumno: 3, nombre: "Estudiante", apellido: "Actual", dni: "secreto" }),
      fila({ id_alumno: 4, nombre: "Ana", apellido: "Pérez", dni: "reservado" }),
    ];
  });
  t.mock.method(Curso, "findByPk", async (id) => {
    assert.equal(id, 55);
    return fila({
      id_curso: 55,
      nombre_curso: "2º Año A",
      profesorTitular: { id_profesor: 9, nombre: "Marta", apellido: "Titular", email: "privado" },
    });
  });
  t.mock.method(Asignacion, "findAll", async (opciones) => {
    opcionesAsignaciones = opciones;
    return [
      fila({
        id_profesor: 9,
        profesorAsignacion: { id_profesor: 9, nombre: "Marta", apellido: "Titular" },
        materiaAsignacion: { id_materia: 1, nombre_materia: "Matemática" },
      }),
      fila({
        id_profesor: 9,
        profesorAsignacion: { id_profesor: 9, nombre: "Marta", apellido: "Titular" },
        materiaAsignacion: { id_materia: 2, nombre_materia: "Física" },
      }),
    ];
  });

  const resultado = await obtenerParticipantesParaAlumno("88");

  assert.deepEqual(resultado.curso, { id_curso: 55, nombre_curso: "2º Año A" });
  assert.deepEqual(resultado.companeros, [
    { nombre: "Ana", apellido: "Pérez" },
  ]);
  assert.deepEqual(resultado.profesores, [{
    nombre: "Marta",
    apellido: "Titular",
    es_titular: true,
    materias: ["Matemática", "Física"],
  }]);
  assert.deepEqual(opcionesAlumnosCurso.where.id_curso, 55);
  assert.deepEqual(opcionesAsignaciones.where, { id_curso: 55 });
  assert.equal(JSON.stringify(resultado).includes("secreto"), false);
  assert.equal(JSON.stringify(resultado).includes("privado"), false);
});

test("rechaza un usuario inválido antes de consultar el padrón", async (t) => {
  const consulta = t.mock.method(Alumno, "findOne", async () => null);
  await assert.rejects(obtenerParticipantesParaAlumno("no-es-un-id"), { status: 400 });
  assert.equal(consulta.mock.callCount(), 0);
});
