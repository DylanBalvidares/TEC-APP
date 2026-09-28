import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import Horario from "../src/db/models/horario-model.js";
import { Asignacion } from "../src/db/models/index.js";
import {
  bloquesSeSolapan,
  validarBloque,
  detectarConflictos,
} from "../src/utils/horarios.js";
import { crearHorario } from "../src/modules/academico/horarios-controller.js";

after(cerrarServidor);

test("bloquesSeSolapan detecta bordes sin falsos positivos", () => {
  assert.equal(bloquesSeSolapan("08:00", "09:00", "08:30", "09:30"), true);
  assert.equal(bloquesSeSolapan("08:00", "09:00", "09:00", "10:00"), false);
  assert.equal(bloquesSeSolapan("08:00", "10:00", "08:30", "09:00"), true);
});

test("validarBloque rechaza dia, formato y rango", () => {
  assert.match(validarBloque({ dia: 7, hora_inicio: "08:00", hora_fin: "09:00" }), /día/);
  assert.match(validarBloque({ dia: 1, hora_inicio: "8:00", hora_fin: "09:00" }), /HH:MM/);
  assert.match(validarBloque({ dia: 1, hora_inicio: "10:00", hora_fin: "09:00" }), /anterior/);
  assert.equal(validarBloque({ dia: 3, hora_inicio: "08:00", hora_fin: "09:00" }), "");
});

test("detectarConflictos distingue curso, profesor y aula", () => {
  const existentes = [
    { id_horario: 1, id_curso: 1, id_profesor: 5, aula: "A1", dia: 1, hora_inicio: "08:00", hora_fin: "09:00" },
    { id_horario: 2, id_curso: 2, id_profesor: 6, aula: "A2", dia: 2, hora_inicio: "08:00", hora_fin: "09:00" },
  ];
  const choques = detectarConflictos(existentes, {
    id_curso: 1, id_profesor: 9, aula: "A9", dia: 1, hora_inicio: "08:30", hora_fin: "09:30",
  });
  assert.deepEqual(choques.map((c) => c.tipo), ["curso"]);

  const profe = detectarConflictos(existentes, {
    id_curso: 9, id_profesor: 5, aula: "A9", dia: 1, hora_inicio: "08:30", hora_fin: "09:30",
  });
  assert.deepEqual(profe.map((c) => c.tipo), ["profesor"]);

  const aula = detectarConflictos(existentes, {
    id_curso: 9, id_profesor: 9, aula: "a1", dia: 1, hora_inicio: "08:30", hora_fin: "09:30",
  });
  assert.deepEqual(aula.map((c) => c.tipo), ["aula"]);

  const libre = detectarConflictos(existentes, {
    id_curso: 9, id_profesor: 9, aula: "A9", dia: 3, hora_inicio: "08:00", hora_fin: "09:00",
  });
  assert.deepEqual(libre, []);

  const autoexcluido = detectarConflictos(existentes, {
    id_horario: 1, id_curso: 1, id_profesor: 5, aula: "A1", dia: 1, hora_inicio: "08:00", hora_fin: "09:00",
  });
  assert.deepEqual(autoexcluido, []);
});

test("crearHorario rechaza 409 ante conflicto y crea sin él", async (t) => {
  const asignacion = { toJSON: () => ({ id_curso: 1, id_profesor: 5 }) };
  t.mock.method(Asignacion, "findByPk", async () => asignacion);
  t.mock.method(Horario, "findAll", async () => [
    {
      toJSON: () => ({
        id_horario: 1, aula: "A1", dia: 1, hora_inicio: "08:00", hora_fin: "09:00",
        Asignacion: { id_curso: 1, id_profesor: 5 },
      }),
    },
  ]);
  const creado = t.mock.method(Horario, "create", async (d) => ({ id_horario: 2, ...d }));

  await assert.rejects(
    crearHorario({ id_asignacion: 3, dia: 1, hora_inicio: "08:30", hora_fin: "09:30", aula: "A9" }),
    /ya tiene clases/,
  );
  const ok = await crearHorario({ id_asignacion: 3, dia: 3, hora_inicio: "08:00", hora_fin: "09:00", aula: "A9" });
  assert.equal(ok.id_horario, 2);
  assert.equal(creado.mock.calls.length, 1);
});

test("rutas de horarios: ver con horario_ver, gestionar con horario_gestionar", async (t) => {
  t.mock.method(Horario, "findAll", async () => []);
  t.mock.method(Asignacion, "findAll", async () => []);
  mockearPermisosDeRol(t, {
    [ROLES.PROFESOR]: ["horario_ver"],
    [ROLES.ADMINISTRATIVO]: ["horario_ver", "horario_gestionar"],
  });
  const srv = await obtenerServidor();

  const lectura = await srv.request("GET", "/api/academico/horarios", {
    token: token({ id_rol: ROLES.PROFESOR }),
  });
  assert.equal(lectura.status, 200);

  const crearSinPermiso = await srv.request("POST", "/api/academico/horarios", {
    token: token({ id_rol: ROLES.PROFESOR }),
    body: { id_asignacion: 1, dia: 1, hora_inicio: "08:00", hora_fin: "09:00" },
  });
  assert.equal(crearSinPermiso.status, 403);
});
