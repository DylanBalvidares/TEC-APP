/**
 * Guardrail de autorización: cada registración `router.<verbo>("ruta", ...)`
 * en `src/modules/**\/*-router.js` debe declarar un permiso explícito
 * (`comprobarPermiso(`, `comprobarPermisos(` o `soloAutenticado`) en el mismo
 * bloque, o estar en la allowlist de rutas públicas con comentario.
 *
 * Hoy el árbol tiene rutas sin ninguno de los dos (cargos, GETs de comunidad,
 * login interno, validar-identidad). El test las lista siempre. La aserción
 * que las rechaza se activa con EXIGIR_PERMISOS=1, que es el gate de cierre de
 * S1–S5. Hasta entonces `npm test` sigue verde y este archivo documenta el bug.
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { rutasSinPermisoExplicito } from "./helpers/rutas.js";

test("toda ruta de módulo declara permiso, soloAutenticado o está en la allowlist", () => {
  const sinPermiso = rutasSinPermisoExplicito();

  if (sinPermiso.length > 0) {
    console.error(
      `[rutas-permisos] ${sinPermiso.length} ruta(s) sin permiso explícito:\n` +
        sinPermiso.map((r) => `  - ${r}`).join("\n"),
    );
  }

  if (process.env.EXIGIR_PERMISOS === "1") {
    assert.deepEqual(
      sinPermiso,
      [],
      "Hay rutas sin comprobarPermiso/comprobarPermisos/soloAutenticado ni allowlist",
    );
    return;
  }

  // Hasta cerrar S1–S5 el hueco es conocido. No puede crecer en silencio:
  // si aparece una ruta nueva sin permiso, este número cambia y el test falla.
  assert.equal(
    sinPermiso.length,
    10,
    "Cambió la cantidad de rutas sin permiso. Si cerraste S1–S5, corré con EXIGIR_PERMISOS=1. Si agregaste una ruta, declarale permiso o allowlist.",
  );
});
