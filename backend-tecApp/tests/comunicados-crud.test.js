import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, sinToken, sinPermiso } from "./helpers/crud.js";
import Comunicado from "../src/db/models/comunicados-model.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerComunicado,
  crearComunicado,
  eliminarComunicado,
  actualizarComunicado,
} from "../src/modules/comunidad/comunicados-controller.js";

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

const DATOS = { titulo: "Reunión", mensaje: "Mañana 10h", destino: "todos" };

test("obtenerComunicado valida y 404", async (t) => {
  await assert.rejects(obtenerComunicado(0), /inválido/);
  t.mock.method(Comunicado, "findByPk", async () => null);
  await assert.rejects(obtenerComunicado(99), /no encontrado/i);
  t.mock.method(Comunicado, "findByPk", async () => fila({ id_comunicado: 1 }));
  assert.equal((await obtenerComunicado(1)).id_comunicado, 1);
});

test("crearComunicado exige titulo/mensaje y fija valores", async (t) => {
  await assert.rejects(crearComunicado({ titulo: "x" }), /requeridos/);
  const crear = t.mock.method(Comunicado, "create", async (d) =>
    fila({ id_comunicado: 2, ...d }),
  );
  const com = await crearComunicado({ ...DATOS });
  assert.equal(com.id_comunicado, 2);
  assert.equal(crear.mock.calls[0].arguments[0].importancia, "media");
  assert.equal(crear.mock.calls[0].arguments[0].curso_destino, null);

  const curso = await crearComunicado({ ...DATOS, destino: "curso", curso_destino: 3 });
  assert.equal(curso.curso_destino, 3);
});

test("eliminarComunicado 404 o conteo", async (t) => {
  t.mock.method(Comunicado, "destroy", async () => 0);
  await assert.rejects(eliminarComunicado(9), /no encontrado/i);
  t.mock.method(Comunicado, "destroy", async () => 1);
  assert.equal(await eliminarComunicado(9), 1);
});

test("actualizarComunicado exige cambios y 404", async (t) => {
  await assert.rejects(actualizarComunicado(0, { titulo: "x" }), /inválido/);
  await assert.rejects(actualizarComunicado(1, {}), /Al menos un campo/);
  t.mock.method(Comunicado, "update", async () => [0]);
  await assert.rejects(actualizarComunicado(9, { titulo: "x" }), /404|encontr/);
  t.mock.method(Comunicado, "update", async () => [1]);
  assert.equal(await actualizarComunicado(9, { titulo: "x" }), 1);
});

test("rutas /comunicados: lectura, escritura y 401/403", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: [
      "comunicado_crear",
      "comunicado_editar",
      "comunicado_eliminar",
    ],
  });
  t.mock.method(Comunicado, "findByPk", async () => fila({ id_comunicado: 1 }));
  t.mock.method(Comunicado, "create", async (d) => fila({ id_comunicado: 2, ...d }));
  t.mock.method(Comunicado, "update", async () => [1]);
  t.mock.method(Comunicado, "destroy", async () => 1);
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/comunidad/comunicados/1");
  await sinPermiso(srv, "POST", "/api/comunidad/comunicados", { body: DATOS });

  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  const uno = await srv.request("GET", "/api/comunidad/comunicados/1", auth);
  assert.equal(uno.status, 200);

  const creado = await srv.request("POST", "/api/comunidad/comunicados", {
    ...auth,
    body: DATOS,
  });
  assert.equal(creado.status, 201);

  const mod = await srv.request("PUT", "/api/comunidad/comunicados/1", {
    ...auth,
    body: { titulo: "Nuevo" },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/comunidad/comunicados/1", auth);
  assert.equal(del.status, 200);
});
