import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";

after(cerrarServidor);

test("GET /api/health responde 200 sin token", async () => {
  const srv = await obtenerServidor();
  const res = await srv.request("GET", "/api/health");

  assert.equal(res.status, 200);
  assert.deepEqual(res.data, { ok: true, status: "up" });
});

test("una ruta desconocida responde el 404 uniforme", async () => {
  const srv = await obtenerServidor();
  const res = await srv.request("GET", "/api/ruta-que-no-existe");

  assert.equal(res.status, 404);
  assert.equal(res.data.ok, false);
  assert.equal(res.data.error, "Ruta no encontrada");
});

test("una ruta protegida sin token responde 401", async () => {
  const srv = await obtenerServidor();
  const res = await srv.request("GET", "/api/academico/alumnos");

  assert.equal(res.status, 401);
});

test("un token inválido responde 401", async () => {
  const srv = await obtenerServidor();
  const res = await srv.request("GET", "/api/academico/alumnos", {
    token: "token-invalido",
  });

  assert.equal(res.status, 401);
});

test("el upload estático rechaza extensiones no permitidas", async () => {
  const srv = await obtenerServidor();
  const res = await srv.request("GET", "/uploads/algo.sh");

  assert.equal(res.status, 404);
  assert.equal(res.data.ok, false);
});
