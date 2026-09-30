import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, sinToken, sinPermiso } from "./helpers/crud.js";
import { Profesor } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerProfesor,
  crearProfesor,
  eliminarProfesor,
  modificarProfesor,
  darDeBajaProfesor,
  obtenerInfoParaProfesor,
} from "../src/modules/academico/profesores-controller.js";

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

const TEL = "2901123456";
const DATOS = {
  nombre: "Juan",
  apellido: "Pérez",
  dni: "20123456",
  telefono: TEL,
  email: "juan@tecnica2.edu.ar",
};

test("obtenerProfesor valida y 404", async (t) => {
  await assert.rejects(obtenerProfesor(null), /inválida/);
  t.mock.method(Profesor, "findByPk", async () => null);
  await assert.rejects(obtenerProfesor(99), /no encontrado/i);
  t.mock.method(Profesor, "findByPk", async () => fila({ id_profesor: 1 }));
  assert.equal((await obtenerProfesor(1)).id_profesor, 1);
});

test("crearProfesor valida telefono y duplicados", async (t) => {
  await assert.rejects(crearProfesor({ ...DATOS, telefono: "x" }), /Teléfono/);
  t.mock.method(Profesor, "create", async (d) => fila({ id_profesor: 1, ...d }));
  assert.equal((await crearProfesor({ ...DATOS })).id_profesor, 1);

  const dup = new Error("dup");
  dup.name = "SequelizeUniqueConstraintError";
  t.mock.method(Profesor, "create", async () => {
    throw dup;
  });
  await assert.rejects(crearProfesor({ ...DATOS }), /registrados/);
});

test("eliminarProfesor 404 y 409 con vinculos", async (t) => {
  t.mock.method(Profesor, "destroy", async () => 0);
  await assert.rejects(eliminarProfesor(9), /No se encontró/);

  const fk = new Error("fk");
  fk.name = "SequelizeForeignKeyConstraintError";
  t.mock.method(Profesor, "destroy", async () => {
    throw fk;
  });
  await assert.rejects(eliminarProfesor(9), /vinculadas/);

  t.mock.method(Profesor, "destroy", async () => 1);
  assert.equal(await eliminarProfesor(9), 1);
});

test("modificarProfesor, darDeBaja e infoParaProfesor", async (t) => {
  await assert.rejects(modificarProfesor({ telefono: TEL }), /ID invalida/);
  t.mock.method(Profesor, "update", async () => [0]);
  await assert.rejects(
    modificarProfesor({ id_profesor: 9, telefono: TEL }),
    /No se encontró/,
  );
  t.mock.method(Profesor, "update", async () => [1]);
  assert.equal(await modificarProfesor({ id_profesor: 9, telefono: TEL }), 1);

  t.mock.method(Profesor, "update", async () => [0]);
  await assert.rejects(darDeBajaProfesor(9), /No se encontró/);
  t.mock.method(Profesor, "update", async () => [1]);
  assert.equal((await darDeBajaProfesor(9)).id_profesor, 9);

  await assert.rejects(obtenerInfoParaProfesor(null), /inválida/);
  t.mock.method(Profesor, "findOne", async () => null);
  await assert.rejects(obtenerInfoParaProfesor(7), /no encontrado/i);
  t.mock.method(Profesor, "findOne", async () => fila({ id_profesor: 2 }));
  assert.equal((await obtenerInfoParaProfesor(7)).data.id_profesor, 2);
});

test("rutas /profesores: lectura, escritura y 401/403", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: [
      "administrativo_ver_todos_profesores",
      "administrativo_crear_profesor",
      "administrativo_editar_profesor",
      "administrativo_eliminar_profesor",
    ],
  });
  t.mock.method(Profesor, "findByPk", async () => fila({ id_profesor: 1 }));
  t.mock.method(Profesor, "create", async (d) => fila({ id_profesor: 1, ...d }));
  t.mock.method(Profesor, "update", async () => [1]);
  t.mock.method(Profesor, "destroy", async () => 1);
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/profesores/1");
  await sinPermiso(srv, "POST", "/api/academico/profesores", { body: DATOS });

  const uno = await srv.request("GET", "/api/academico/profesores/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(uno.status, 200);

  const creado = await srv.request("POST", "/api/academico/profesores", {
    token: token({ id_rol: ROLES.ROOT }),
    body: DATOS,
  });
  assert.equal(creado.status, 200);

  const mod = await srv.request("PATCH", "/api/academico/profesores", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { id_profesor: 1, telefono: TEL },
  });
  assert.equal(mod.status, 200);

  const baja = await srv.request("PATCH", "/api/academico/profesores/dar-de-baja/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(baja.status, 200);

  const del = await srv.request("DELETE", "/api/academico/profesores/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(del.status, 200);
});
