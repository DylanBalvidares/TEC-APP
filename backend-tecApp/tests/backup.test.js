import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import {
  Rol,
  Permiso,
  RolPermiso,
  Alumno,
  Curso,
  Usuario,
} from "../src/db/models/index.js";
import Configuracion from "../src/db/models/configuracion-model.js";
import { serializarBackup, verificarBackup } from "../src/utils/backup.js";

after(cerrarServidor);

test("serializarBackup produce documento versionado con checksum", () => {
  const doc = serializarBackup(
    { roles: [{ id_rol: 1 }], configuracion: [] },
    "2026-01-01T00:00:00.000Z",
  );
  assert.equal(doc.version, 1);
  assert.equal(doc.fecha, "2026-01-01T00:00:00.000Z");
  assert.match(doc.checksum, /^[0-9a-f]{64}$/);
});

test("verificarBackup acepta el documento y detecta alteraciones", () => {
  const doc = serializarBackup({ roles: [{ id_rol: 1 }] });
  const ok = verificarBackup(doc);
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.tablas, ["roles"]);
  assert.equal(ok.totalFilas, 1);

  assert.equal(verificarBackup(null).ok, false);
  assert.equal(verificarBackup({ ...doc, version: 99 }).ok, false);
  assert.equal(
    verificarBackup({ ...doc, tablas: { roles: [{ id_rol: 2 }] } }).ok,
    false,
  );
});

test("GET /api/admin/backup/export exige root y POST /verificar valida", async (t) => {
  for (const modelo of [Rol, Permiso, RolPermiso, Configuracion]) {
    t.mock.method(modelo, "findAll", async () => []);
  }
  t.mock.method(Alumno, "count", async () => 10);
  t.mock.method(Curso, "count", async () => 3);
  t.mock.method(Usuario, "count", async () => 5);
  mockearPermisosDeRol(t, { [ROLES.ROOT]: ["root_gestionar_roles"] });
  const srv = await obtenerServidor();

  const sinPermiso = await srv.request("GET", "/api/admin/backup/export", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
  });
  assert.equal(sinPermiso.status, 403);

  const exp = await srv.request("GET", "/api/admin/backup/export", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(exp.status, 200);
  assert.equal(exp.data.ok, true);
  assert.match(exp.data.backup.checksum, /^[0-9a-f]{64}$/);

  const ver = await srv.request("POST", "/api/admin/backup/verificar", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { backup: exp.data.backup },
  });
  assert.equal(ver.status, 200);
  assert.equal(ver.data.ok, true);

  const corrupto = await srv.request("POST", "/api/admin/backup/verificar", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { backup: { version: 1 } },
  });
  assert.equal(corrupto.status, 400);
});
