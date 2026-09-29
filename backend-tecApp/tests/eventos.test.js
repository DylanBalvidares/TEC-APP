import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import {
  suscribir,
  emitir,
  cantidadSuscriptores,
  limpiarSuscriptores,
} from "../src/utils/eventos.js";

after(cerrarServidor);
beforeEach(limpiarSuscriptores);

test("emitir reparte a todos los suscriptores", () => {
  const recibidosA = [];
  const recibidosB = [];
  suscribir({ write: (e) => recibidosA.push(e) });
  const fuera = suscribir({ write: (e) => recibidosB.push(e) });
  fuera();

  const evento = emitir("cola", { pendientes: 3 });

  assert.equal(evento.tipo, "cola");
  assert.ok(evento.fecha);
  assert.equal(recibidosA.length, 1);
  assert.equal(recibidosB.length, 0);
  assert.equal(cantidadSuscriptores(), 1);
});

test("un suscriptor roto se elimina sin romper el resto", () => {
  const recibidos = [];
  suscribir({
    write: () => {
      throw new Error("roto");
    },
  });
  suscribir({ write: (e) => recibidos.push(e) });

  emitir("edicion", { entidad: "alumno", id: 1 });

  assert.equal(recibidos.length, 1);
  assert.equal(cantidadSuscriptores(), 1);
});

test("GET /api/admin/eventos abre un stream SSE autenticado", async () => {
  const srv = await obtenerServidor();

  const sinToken = await srv.request("GET", "/api/admin/eventos");
  assert.equal(sinToken.status, 401);

  // El stream no termina: se aborta tras leer las cabeceras.
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), 500);
  try {
    const res = await fetch(`${srv.base}/api/admin/eventos`, {
      headers: { Authorization: `Bearer ${token({ id_rol: ROLES.ALUMNO })}` },
      signal: controlador.signal,
    });
    assert.equal(res.status, 200);
    assert.match(res.headers.get("content-type"), /text\/event-stream/);
    await res.text().catch(() => null);
  } catch (error) {
    assert.match(error?.name || error?.message || "", /abort/i);
  } finally {
    clearTimeout(temporizador);
  }
});
