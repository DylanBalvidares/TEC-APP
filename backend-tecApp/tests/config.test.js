import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import Configuracion from "../src/db/models/configuracion-model.js";
import {
  validarValor,
  obtenerConfiguracion,
  actualizarConfiguracion,
} from "../src/modules/admin/config-controller.js";

after(cerrarServidor);

test("validarValor acepta valores sanos y normaliza", () => {
  assert.equal(validarValor("institucion_nombre", "  Técnica 2 "), "Técnica 2");
  assert.equal(validarValor("ciclo_lectivo_anio", "2026"), "2026");
  assert.equal(validarValor("ciclo_lectivo_inicio", "2026-03-01"), "2026-03-01");
  assert.equal(validarValor("institucion_email", ""), "");
});

test("validarValor rechaza clave desconocida y formatos malos", () => {
  assert.throws(() => validarValor("otra_clave", "x"), /desconocida/);
  assert.throws(() => validarValor("institucion_nombre", "  "), /obligatorio/);
  assert.throws(() => validarValor("institucion_email", "no-es-mail"), /inválido/);
  assert.throws(() => validarValor("ciclo_lectivo_anio", "1999"), /entre 2000 y 2100/);
  assert.throws(() => validarValor("ciclo_lectivo_fin", "01/12/2026"), /AAAA-MM-DD/);
});

test("obtenerConfiguracion devuelve objeto clave->valor", async (t) => {
  t.mock.method(Configuracion, "findAll", async () => [
    { toJSON: () => ({ clave: "institucion_nombre", valor: "T2" }) },
    { toJSON: () => ({ clave: "ciclo_lectivo_anio", valor: "2026" }) },
  ]);
  assert.deepEqual(await obtenerConfiguracion(), {
    institucion_nombre: "T2",
    ciclo_lectivo_anio: "2026",
  });
});

test("actualizarConfiguracion crea o actualiza con findOrCreate", async (t) => {
  const fila = { valor: "viejo", update: async (d) => Object.assign(fila, d) };
  const buscar = t.mock.method(Configuracion, "findOrCreate", async () => [fila, false]);
  const r = await actualizarConfiguracion({ institucion_nombre: "Nueva" });
  assert.deepEqual(r, { institucion_nombre: "Nueva" });
  assert.equal(buscar.mock.calls[0].arguments[0].where.clave, "institucion_nombre");
});

test("GET lee con ver_reportes y PUT exige root_gestionar_roles", async (t) => {
  t.mock.method(Configuracion, "findAll", async () => []);
  mockearPermisosDeRol(t, {
    [ROLES.ADMINISTRATIVO]: ["administrativo_ver_reportes"],
    [ROLES.ROOT]: ["administrativo_ver_reportes", "root_gestionar_roles"],
  });
  const srv = await obtenerServidor();

  const lectura = await srv.request("GET", "/api/admin/configuracion", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
  });
  assert.equal(lectura.status, 200);

  const putSinPermiso = await srv.request("PUT", "/api/admin/configuracion", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
    body: { institucion_nombre: "X" },
  });
  assert.equal(putSinPermiso.status, 403);
});
