import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import { Alumno, HistorialNota } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";

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

test("GET /notas/historial/alumno/:id con permiso y 401/403", async (t) => {
  await permisos(t, { [ROLES.PROFESOR]: ["profesor_ver_todos_notas"] });
  t.mock.method(Alumno, "findByPk", async () => fila({ id_alumno: 2 }));
  t.mock.method(HistorialNota, "findAll", async () => filas([{ id_nota: 9 }]));
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/notas/historial/alumno/2");
  await sinPermiso(srv, "GET", "/api/academico/notas/historial/alumno/2");

  const res = await srv.request("GET", "/api/academico/notas/historial/alumno/2", {
    token: token({ id_rol: ROLES.PROFESOR }),
  });
  assert.equal(res.status, 200);
  assert.equal(res.data.length, 1);
});
