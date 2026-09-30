import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import { Materia } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerTodasMaterias,
  obtenerMateria,
  crearMateria,
  eliminarMateria,
  modificarMateria,
} from "../src/modules/academico/materias-controller.js";

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

const DATOS = { nombre_materia: "Matemática", carga_horaria: 4 };

test("obtenerTodasMaterias 404 vacía y lista", async (t) => {
  t.mock.method(Materia, "findAll", async () => []);
  await assert.rejects(obtenerTodasMaterias(), /No se encontraron/);
  t.mock.method(Materia, "findAll", async () => filas([{ id_materia: 1 }]));
  assert.equal((await obtenerTodasMaterias()).length, 1);
});

test("obtenerMateria valida y 404", async (t) => {
  await assert.rejects(obtenerMateria(0), /inválida/);
  t.mock.method(Materia, "findByPk", async () => null);
  await assert.rejects(obtenerMateria(99), /No se encontró/);
  t.mock.method(Materia, "findByPk", async () => fila({ id_materia: 1 }));
  assert.equal((await obtenerMateria(1)).id_materia, 1);
});

test("crearMateria delega y 500 ante error", async (t) => {
  t.mock.method(Materia, "create", async (d) => fila({ id_materia: 3, ...d }));
  assert.equal((await crearMateria({ ...DATOS })).id_materia, 3);

  t.mock.method(Materia, "create", async () => {
    throw new Error("db caída");
  });
  await assert.rejects(crearMateria({ ...DATOS }), /Error interno al crear/);
});

test("eliminarMateria 404 y 409 con asignaciones", async (t) => {
  t.mock.method(Materia, "destroy", async () => 0);
  await assert.rejects(eliminarMateria(9), /No se encontró/);

  const fk = new Error("fk");
  fk.name = "SequelizeForeignKeyConstraintError";
  t.mock.method(Materia, "destroy", async () => {
    throw fk;
  });
  await assert.rejects(eliminarMateria(9), /asignaciones activas/);

  t.mock.method(Materia, "destroy", async () => 1);
  assert.equal(await eliminarMateria(9), 1);
});

test("modificarMateria valida y 404", async (t) => {
  await assert.rejects(modificarMateria({}), /inválida/);
  t.mock.method(Materia, "update", async () => [0]);
  await assert.rejects(modificarMateria({ id_materia: 9 }), /No se encontró/);
  t.mock.method(Materia, "update", async () => [1]);
  assert.deepEqual(await modificarMateria({ id_materia: 9, ...DATOS }), [1]);
});

test("rutas /materias: lectura, escritura y 401/403", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: [
      "administrativo_ver_todos_materias",
      "administrativo_crear_materia",
      "administrativo_editar_materia",
      "administrativo_eliminar_materia",
    ],
  });
  t.mock.method(Materia, "findAll", async () => filas([{ id_materia: 1 }]));
  t.mock.method(Materia, "findByPk", async () => fila({ id_materia: 1 }));
  t.mock.method(Materia, "create", async (d) => fila({ id_materia: 3, ...d }));
  t.mock.method(Materia, "update", async () => [1]);
  t.mock.method(Materia, "destroy", async () => 1);
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/materias");
  await sinPermiso(srv, "POST", "/api/academico/materias", { body: DATOS });

  const lista = await srv.request("GET", "/api/academico/materias", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(lista.status, 200);

  const una = await srv.request("GET", "/api/academico/materias/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(una.status, 200);

  const creada = await srv.request("POST", "/api/academico/materias", {
    token: token({ id_rol: ROLES.ROOT }),
    body: DATOS,
  });
  assert.equal(creada.status, 201);

  const mod = await srv.request("PATCH", "/api/academico/materias", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { id_materia: 1, ...DATOS },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/academico/materias/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(del.status, 200);
});
