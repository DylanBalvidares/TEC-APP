import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { Auditoria } from "../src/db/models/index.js";
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
