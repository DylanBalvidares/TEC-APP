import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { Auditoria } from "../src/db/models/index.js";
import { listarAuditoria } from "../src/modules/admin/auditoria-controller.js";
import {
  sanearAuditoria,
  registrarAuditoria,
  auditarEscritura,
} from "../src/utils/auditoria.js";

after(cerrarServidor);

test("sanearAuditoria redacta campos sensibles incluso anidados", () => {
  const limpio = sanearAuditoria({
    nombre: "Ana",
    contrasena: "$2b$10$hash",
    anidado: { token: "abc", email: "a@b.c" },
    lista: [{ codigo: "123" }],
  });
  assert.equal(limpio.nombre, "Ana");
  assert.equal(limpio.contrasena, "[REDACTED]");
  assert.equal(limpio.anidado.token, "[REDACTED]");
  assert.equal(limpio.anidado.email, "a@b.c");
  assert.equal(limpio.lista[0].codigo, "[REDACTED]");
});

test("registrarAuditoria persiste saneado y nunca lanza", async (t) => {
  const creados = [];
  t.mock.method(Auditoria, "create", async (datos) => {
    creados.push(datos);
    return { id_auditoria: 1, ...datos };
  });

  const r = await registrarAuditoria({
    id_usuario: 8,
    accion: "crear",
    entidad: "usuario",
    id_entidad: 3,
    despues: { email: "x@y.z", contrasena: "secreta" },
    ip: "127.0.0.1",
  });

  assert.equal(creados.length, 1);
  assert.equal(creados[0].datos_despues.contrasena, "[REDACTED]");
  assert.equal(creados[0].datos_despues.email, "x@y.z");
  assert.equal(r.id_auditoria, 1);
});

test("registrarAuditoria sin accion/entidad no persiste y ante error retorna null", async (t) => {
  const crear = t.mock.method(Auditoria, "create", async () => ({ id_auditoria: 1 }));

  assert.equal(await registrarAuditoria({ accion: "", entidad: "usuario" }), null);
  assert.equal(crear.mock.calls.length, 0);

  t.mock.restoreAll();
  t.mock.method(Auditoria, "create", async () => {
    throw new Error("db caída");
  });
  assert.equal(
    await registrarAuditoria({ accion: "crear", entidad: "usuario" }),
    null,
  );
});

test("auditarEscritura deriva actor e IP del request", async (t) => {
  let datos = null;
  t.mock.method(Auditoria, "create", async (d) => {
    datos = d;
    return d;
  });

  await auditarEscritura(
    { headers: { id_usuario: 5 }, ip: "10.0.0.2", body: { nombre: "Rolo" } },
    { accion: "modificar", entidad: "rol", id_entidad: 9, despues: { nombre: "Rolo" } },
  );

  assert.equal(datos.id_usuario, 5);
  assert.equal(datos.ip, "10.0.0.2");
  assert.equal(datos.accion, "modificar");
  assert.equal(datos.id_entidad, 9);
});

test("listarAuditoria filtra por entidad/accion y pagina con el contrato uniforme", async (t) => {
  const llamadas = [];
  t.mock.method(Auditoria, "findAndCountAll", async (opciones) => {
    llamadas.push(opciones);
    return { count: 2, rows: [{ id_auditoria: 1 }, { id_auditoria: 2 }] };
  });

  const r = await listarAuditoria({ entidad: "usuario", accion: "crear", page: "1", limit: "10" });

  assert.deepEqual(r, { data: [{ id_auditoria: 1 }, { id_auditoria: 2 }], total: 2, page: 1, limit: 10 });
  assert.equal(llamadas[0].where.entidad, "usuario");
  assert.equal(llamadas[0].where.accion, "crear");
});

test("GET /api/admin/auditoria exige root_ver_logs_sistema y filtra", async (t) => {
  t.mock.method(Auditoria, "findAndCountAll", async () => ({
    count: 1,
    rows: [{ id_auditoria: 7, entidad: "alumno" }],
  }));
  mockearPermisosDeRol(t, { [ROLES.ROOT]: ["root_ver_logs_sistema"] });
  const srv = await obtenerServidor();

  const sinPermiso = await srv.request("GET", "/api/admin/auditoria", {
    token: token({ id_rol: ROLES.ALUMNO }),
  });
  assert.equal(sinPermiso.status, 403);

  const root = await srv.request("GET", "/api/admin/auditoria?entidad=alumno", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(root.status, 200);
  assert.equal(root.data.ok, true);
  assert.equal(root.data.total, 1);
});
