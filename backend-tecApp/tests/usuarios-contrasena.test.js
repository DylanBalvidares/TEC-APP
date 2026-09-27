import { test, after } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token, mockearPermisosDeRol } from "./helpers/auth.js";
import { Usuario } from "../src/db/models/index.js";
import {
  buscarUsuarioPorEmail,
  obtenerTodosUsuarios,
  obtenerUsuario,
} from "../src/modules/usuarios/usuarios-controller.js";

after(cerrarServidor);

function usuariosFalsos() {
  // Las instancias Sequelize serializan con toJSON: el mock reproduce que la
  // columna contrasena nunca llegue al objeto que Express convierte a JSON.
  return [
    {
      toJSON: () => ({
        id_usuario: 1,
        nombre: "Ana",
        email: "ana@tecnica2.edu.ar",
      }),
    },
    {
      toJSON: () => ({
        id_usuario: 2,
        nombre: "Bruno",
        email: "bruno@tecnica2.edu.ar",
      }),
    },
  ];
}

test("obtenerTodosUsuarios excluye la columna contrasena en la consulta", async (t) => {
  const mockFindAll = t.mock.method(Usuario, "findAll", async () => usuariosFalsos());

  const usuarios = await obtenerTodosUsuarios();

  assert.equal(mockFindAll.mock.calls.length, 1);
  assert.deepEqual(mockFindAll.mock.calls[0].arguments[0].attributes, {
    exclude: ["contrasena"],
  });
  for (const usuario of usuarios) {
    assert.ok(!("contrasena" in usuario));
  }
});

test("obtenerUsuario y buscarUsuarioPorEmail también excluyen contrasena", async (t) => {
  const mockFindByPk = t.mock.method(Usuario, "findByPk", async () => usuariosFalsos()[0]);
  const mockFindOne = t.mock.method(Usuario, "findOne", async () => usuariosFalsos()[1]);

  await obtenerUsuario(1);
  await buscarUsuarioPorEmail("bruno@tecnica2.edu.ar");

  for (const mock of [mockFindByPk, mockFindOne]) {
    assert.equal(mock.mock.calls.length, 1);
    const opciones = mock.mock.calls[0].arguments.at(-1);
    assert.deepEqual(opciones.attributes, { exclude: ["contrasena"] });
  }
});

test("GET /api/usuarios/usuarios nunca expone la clave contrasena", async (t) => {
  mockearPermisosDeRol(t, { [ROLES.ROOT]: ["administrativo_editar_usuario"] });
  t.mock.method(Usuario, "findAll", async () => usuariosFalsos());

  const srv = await obtenerServidor();
  const res = await srv.request("GET", "/api/usuarios/usuarios", {
    token: token({ id_rol: ROLES.ROOT }),
  });

  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.data));
  assert.equal(res.data.length, 2);
  assert.equal("contrasena" in res.data[0], false);
  assert.equal("contrasena" in res.data[1], false);
});
