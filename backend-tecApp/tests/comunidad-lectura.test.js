import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { obtenerTodosComunicados } from "../src/modules/comunidad/comunicados-controller.js";
import Comunicado from "../src/db/models/comunicados-model.js";
import { rutasSinPermisoExplicito } from "./helpers/rutas.js";

after(cerrarServidor);
test("S5: el guardrail ya no marca los GETs de comunidad", () => {
  const marcadas = rutasSinPermisoExplicito().filter((r) =>
    r.includes("comunidad-router"),
  );
  assert.deepEqual(marcadas, []);
});

test("S5: alumno no puede pedir rol=root por query para leer todo", async (t) => {
  const wheres = [];
  t.mock.method(Comunicado, "findAll", async (opciones) => {
    const plano = {};
    for (const clave of Reflect.ownKeys(opciones?.where ?? {})) {
      plano[String(clave)] = opciones.where[clave];
    }
    wheres.push(JSON.stringify(plano));
    return [];
  });

  // A nivel controlador el filtro sigue existiendo (el router lo pisa con el
  // rol del token en S5): el where de alumno no incluye autoridades.
  await obtenerTodosComunicados({ rol: "alumno" });

  assert.equal(wheres.length, 1);
  assert.equal(wheres[0].includes("autoridades"), false);
});

test("S5: el rol efectivo sale del token aunque el query pida root", async (t) => {
  const rolesVistos = [];
  t.mock.method(Comunicado, "findAll", async () => {
    rolesVistos.push("findAll");
    return [{ id_comunicado: 1, destino: "todos" }];
  });

  const srv = await obtenerServidor();
  const alumno = token({ id_rol: ROLES.ALUMNO });
  const res = await srv.request("GET", "/api/comunidad/comunicados?rol=root", {
    token: alumno,
  });

  assert.equal(res.status, 200);
  // Si el query hubiera mandado, la respuesta sería la de root (todo).
  // Con el fix, el where se arma con rol=alumno (verificado por el unitario
  // de abajo a nivel controlador).
  assert.deepEqual(res.data, [{ id_comunicado: 1, destino: "todos" }]);
  assert.equal(rolesVistos.length, 1);
});

test("S5: comunicados de autoridades no llegan al where de alumno", async (t) => {
  const wheres = [];
  t.mock.method(Comunicado, "findAll", async (opciones) => {
    const plano = {};
    for (const clave of Reflect.ownKeys(opciones?.where ?? {})) {
      plano[String(clave)] = opciones.where[clave];
    }
    wheres.push(JSON.stringify(plano));
    return [];
  });

  await obtenerTodosComunicados({ rol: "alumno" });

  assert.equal(wheres.length, 1);
  assert.equal(wheres[0].includes("autoridades"), false);
  assert.equal(wheres[0].includes("alumnos"), true);
});
