import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import { obtenerTodosComunicados } from "../src/modules/comunidad/comunicados-controller.js";
import Comunicado from "../src/db/models/comunicados-model.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

/** Serializa el where de una consulta, incluyendo las claves Symbol (Op.or). */
function whereDe(opciones) {
  const plano = {};
  for (const clave of Reflect.ownKeys(opciones?.where ?? {})) {
    plano[String(clave)] = opciones.where[clave];
  }
  return JSON.stringify(plano);
}

function capturarWheres(t) {
  const wheres = [];
  t.mock.method(Comunicado, "findAll", async (opciones) => {
    wheres.push({ where: whereDe(opciones), opciones });
    return [];
  });
  return wheres;
}

test("el profesor ve sus propios comunicados aunque el destino no sea para profesores", async (t) => {
  const wheres = capturarWheres(t);

  await obtenerTodosComunicados({ rol: "profesor", autor_id: 2, cursos: "1º Año" });

  assert.equal(wheres.length, 1);
  const { where, opciones } = wheres[0];
  // El destino sigue filtrando, pero se suma la autoría del token.
  assert.match(where, /"autor_id":2/);
  assert.match(where, /"destino":"profesores"/);
  assert.match(where, /"destino":"todos"/);
  // El autor viene resuelto para que el frontend pueda mostrar el nombre.
  assert.ok(opciones.include?.length > 0, "esperaba include del autor");
});

test("sin autor_id el where del profesor no filtra por autoría", async (t) => {
  const wheres = capturarWheres(t);

  await obtenerTodosComunicados({ rol: "profesor", cursos: "1º Año" });

  assert.equal(wheres[0].where.includes("autor_id"), false);
});

test("S5: el alumno NO recibe los comunicados de otros autores por autor_id", async (t) => {
  const wheres = capturarWheres(t);

  await obtenerTodosComunicados({ rol: "alumno", curso: "1º Año", autor_id: 2 });

  const { where } = wheres[0];
  assert.equal(where.includes("autor_id"), false);
  // Y sigue sin entrar nada dirigido a autoridades.
  assert.equal(where.includes("autoridades"), false);
});

test("S5: ?autor_id= del query se ignora, manda el del token", async (t) => {
  const wheres = capturarWheres(t);
  const srv = await obtenerServidor();

  const res = await srv.request("GET", "/api/comunidad/comunicados?rol=profesor&autor_id=999", {
    token: token({ id: 7, id_rol: ROLES.PROFESOR }),
  });

  assert.equal(res.status, 200);
  assert.equal(wheres.length, 1);
  // 7 es el id_usuario del token; 999 venía en el query y no debe aparecer.
  assert.match(wheres[0].where, /"autor_id":7/);
  assert.equal(wheres[0].where.includes("999"), false);
});