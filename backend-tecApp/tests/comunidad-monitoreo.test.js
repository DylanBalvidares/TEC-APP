import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import { Correo } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerHistorialGlobal,
  marcarCorreoLeido,
} from "../src/modules/comunidad/comunidad-service.js";

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

test("obtenerHistorialGlobal filtra y pagina", async (t) => {
  const buscar = t.mock.method(Correo, "findAndCountAll", async () => ({
    count: 2,
    rows: filas([{ id_correo: 1 }, { id_correo: 2 }]),
  }));
  const res = await obtenerHistorialGlobal({
    estado: "enviado",
    fecha_desde: "2026-01-01",
    fecha_hasta: "2026-12-31",
    limit: 10,
  });
  assert.equal(res.success, true);
  assert.equal(res.lista.length, 2);
  const args = buscar.mock.calls[0].arguments[0];
  assert.equal(args.where.estado, "enviado");
  assert.equal(args.limit, 10);
  assert.ok(args.where.fecha_envio);
});

test("marcarCorreoLeido valida, 404 y confirma", async (t) => {
  await assert.rejects(marcarCorreoLeido(null), /inválido/);
  t.mock.method(Correo, "findByPk", async () => null);
  await assert.rejects(marcarCorreoLeido(99), /no encontrado/i);
  t.mock.method(Correo, "findByPk", async () =>
    fila({ id_correo: 1, update: async () => [1] }),
  );
  const res = await marcarCorreoLeido(1);
  assert.equal(res.success, true);
});

test("rutas /monitoreo y /marcar-leido con permisos", async (t) => {
  await permisos(t, { [ROLES.ROOT]: ["root_ver_logs_sistema"] });
  t.mock.method(Correo, "findAndCountAll", async () => ({
    count: 1,
    rows: filas([{ id_correo: 1 }]),
  }));
  t.mock.method(Correo, "findByPk", async () =>
    fila({ id_correo: 1, update: async () => [1] }),
  );
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/comunidad/monitoreo");
  await sinPermiso(srv, "GET", "/api/comunidad/monitoreo");

  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  const hist = await srv.request("GET", "/api/comunidad/monitoreo?estado=enviado", auth);
  assert.equal(hist.status, 200);
  assert.equal(hist.data.success, true);

  const leido = await srv.request("POST", "/api/comunidad/marcar-leido", {
    ...auth,
    body: { id_correo: 1 },
  });
  assert.equal(leido.status, 200);
  assert.equal(leido.data.success, true);
});
