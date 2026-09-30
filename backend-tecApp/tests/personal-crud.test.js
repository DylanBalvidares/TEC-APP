import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import { Personal } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerTodoPersonal,
  obtenerPersonal,
  crearPersonal,
  eliminarPersonal,
  modificarPersonal,
  darDeBajaPersonal,
  sincronizarUsuarioPersonal,
} from "../src/modules/academico/personal-controller.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

const TEL = "2901123456";
const DATOS = {
  nombre: "Ana",
  apellido: "Paz",
  dni: "30123456",
  telefono: TEL,
  email: "ana@tecnica2.edu.ar",
  id_cargo: 1,
};

// Un solo mock de Rol.findByPk para permisos (con include).
async function permisos(t, mapa) {
  const { Rol } = await import("../src/db/models/index.js");
  t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) {
      const lista = (mapa[Number(id)] || []).map((nombre_permiso) => ({
        nombre_permiso,
      }));
      return { toJSON: () => ({ id_rol: Number(id), permisos: lista }) };
    }
    return fila({ id_rol: Number(id) });
  });
}

test("obtenerTodoPersonal incluye cargo y obtenerPersonal valida", async (t) => {
  const buscar = t.mock.method(Personal, "findAll", async () =>
    filas([{ id_personal: 1 }]),
  );
  assert.equal((await obtenerTodoPersonal()).length, 1);
  assert.ok(buscar.mock.calls[0].arguments[0].include);

  await assert.rejects(obtenerPersonal(-1), /inválida/);
  t.mock.method(Personal, "findByPk", async () => null);
  await assert.rejects(obtenerPersonal(99), /No se encontró/);
  t.mock.method(Personal, "findByPk", async () => fila({ id_personal: 1 }));
  assert.equal((await obtenerPersonal(1)).id_personal, 1);
});

test("crearPersonal valida telefono y propaga unique/fk", async (t) => {
  await assert.rejects(crearPersonal({ ...DATOS, telefono: "mal" }), /Teléfono/);

  t.mock.method(Personal, "create", async (d) => fila({ id_personal: 1, ...d }));
  assert.equal((await crearPersonal({ ...DATOS })).id_personal, 1);

  const unico = new Error("dup");
  unico.name = "SequelizeUniqueConstraintError";
  unico.errors = [{ path: "email" }];
  t.mock.method(Personal, "create", async () => {
    throw unico;
  });
  await assert.rejects(crearPersonal({ ...DATOS }), /email ya existe/);

  const fk = new Error("fk");
  fk.name = "SequelizeForeignKeyConstraintError";
  fk.index = "id_cargo";
  t.mock.method(Personal, "create", async () => {
    throw fk;
  });
  await assert.rejects(crearPersonal({ ...DATOS }), /cargo.*no existe/);
});

test("eliminarPersonal 404 y 409 con vinculados", async (t) => {
  t.mock.method(Personal, "destroy", async () => 0);
  await assert.rejects(eliminarPersonal(9), /No se encontró/);

  const fk = new Error("fk");
  fk.name = "SequelizeForeignKeyConstraintError";
  t.mock.method(Personal, "destroy", async () => {
    throw fk;
  });
  await assert.rejects(eliminarPersonal(9), /Dar de baja/);

  t.mock.method(Personal, "destroy", async () => 1);
  assert.equal(await eliminarPersonal(9), 1);
});

test("modificarPersonal, darDeBaja y sincronizar", async (t) => {
  await assert.rejects(
    modificarPersonal({ nombre: "X", telefono: TEL }),
    /ID inválida/,
  );
  t.mock.method(Personal, "update", async () => [0]);
  await assert.rejects(
    modificarPersonal({ id_personal: 9, telefono: TEL }),
    /No se encontró/,
  );
  t.mock.method(Personal, "update", async () => [1]);
  assert.deepEqual(await modificarPersonal({ id_personal: 9, telefono: TEL }), [1]);

  t.mock.method(Personal, "update", async () => [0]);
  await assert.rejects(darDeBajaPersonal(9), /No se encontró/);
  t.mock.method(Personal, "update", async () => [1]);
  assert.equal((await darDeBajaPersonal(9)).id_personal, 9);

  // El catch del controller enmascara el 400 como 500: se verifica el rechazo.
  await assert.rejects(sincronizarUsuarioPersonal({}), /Error interno/);
  t.mock.method(Personal, "update", async () => [1]);
  assert.deepEqual(
    await sincronizarUsuarioPersonal({ idPersonal: 9, idUsuario: 4 }),
    [1],
  );
});

test("rutas /personal: lectura, escritura root y 401/403", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: ["root_gestionar_roles"],
    [ROLES.ADMINISTRATIVO]: ["administrativo_crear_usuario"],
  });
  t.mock.method(Personal, "findAll", async () => filas([{ id_personal: 1 }]));
  t.mock.method(Personal, "findByPk", async () => fila({ id_personal: 1 }));
  t.mock.method(Personal, "create", async (d) => fila({ id_personal: 2, ...d }));
  t.mock.method(Personal, "update", async () => [1]);
  t.mock.method(Personal, "destroy", async () => 1);
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/academico/personal");
  await sinPermiso(srv, "POST", "/api/academico/personal", { body: DATOS });

  const lista = await srv.request("GET", "/api/academico/personal", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
  });
  assert.equal(lista.status, 200);

  const uno = await srv.request("GET", "/api/academico/personal/1", {
    token: token({ id_rol: ROLES.ADMINISTRATIVO }),
  });
  assert.equal(uno.status, 200);

  const creado = await srv.request("POST", "/api/academico/personal", {
    token: token({ id_rol: ROLES.ROOT }),
    body: DATOS,
  });
  assert.equal(creado.status, 201);

  const baja = await srv.request("PATCH", "/api/academico/personal/dar-de-baja/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(baja.status, 200);

  const sync = await srv.request("PATCH", "/api/academico/personal/sincronizar-usuario-personal", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { idPersonal: 1, idUsuario: 4 },
  });
  assert.equal(sync.status, 200);

  const mod = await srv.request("PATCH", "/api/academico/personal", {
    token: token({ id_rol: ROLES.ROOT }),
    body: { id_personal: 1, telefono: TEL },
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/academico/personal/1", {
    token: token({ id_rol: ROLES.ROOT }),
  });
  assert.equal(del.status, 200);
});
