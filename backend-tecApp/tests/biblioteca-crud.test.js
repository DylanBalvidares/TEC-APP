import { test, after, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila, filas, sinToken, sinPermiso } from "./helpers/crud.js";
import Biblioteca from "../src/db/models/biblioteca-model.js";
import Recurso from "../src/db/models/recursos-model.js";
import Prestamo from "../src/db/models/prestamos-model.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import {
  obtenerTodosBiblioteca,
  obtenerBiblioteca,
  crearBiblioteca,
  eliminarBiblioteca,
  modificarBiblioteca,
} from "../src/modules/biblioteca/biblioteca-controller.js";
import {
  obtenerTodosRecursos,
  obtenerRecurso,
  crearRecurso,
  eliminarRecurso,
  modificarRecurso,
} from "../src/modules/biblioteca/recursos-controller.js";
import {
  obtenerTodosPrestamos,
  obtenerPrestamo,
  crearPrestamo,
  eliminarPrestamo,
  modificarPrestamo,
} from "../src/modules/biblioteca/prestamos-controller.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

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

const BIBLIO = [
  Biblioteca,
  "id_biblioteca",
  { id: 1, nombre: "Central", responsable: "Ana", ubicacion: "A1" },
];
const RECURSO = [
  Recurso,
  "id_recurso",
  { id: 1, nombre: "Don Quijote", tipo: "libro", estado: "disponible" },
];
const PRESTAMO = [
  Prestamo,
  "id_prestamo",
  { id_prestamo: 1, id_recurso: 1, id_usuario: 7, estado: "activo" },
];

function modulos() {
  return [
    {
      nombre: "biblioteca",
      Modelo: BIBLIO[0],
      idKey: BIBLIO[1],
      crear: crearBiblioteca,
      fns: {
        todos: obtenerTodosBiblioteca,
        uno: obtenerBiblioteca,
        eliminar: eliminarBiblioteca,
        modificar: modificarBiblioteca,
      },
      datos: BIBLIO[2],
      base: "/api/biblioteca/biblioteca",
      lectura: null, // soloAutenticado: cualquier rol autenticado
    },
    {
      nombre: "recurso",
      Modelo: RECURSO[0],
      idKey: RECURSO[1],
      crear: crearRecurso,
      fns: {
        todos: obtenerTodosRecursos,
        uno: obtenerRecurso,
        eliminar: eliminarRecurso,
        modificar: modificarRecurso,
      },
      datos: RECURSO[2],
      base: "/api/biblioteca/recursos",
      lectura: "biblio_ver_recursos",
    },
    {
      nombre: "prestamo",
      Modelo: PRESTAMO[0],
      idKey: PRESTAMO[1],
      crear: crearPrestamo,
      fns: {
        todos: obtenerTodosPrestamos,
        uno: obtenerPrestamo,
        eliminar: eliminarPrestamo,
        modificar: modificarPrestamo,
      },
      datos: PRESTAMO[2],
      base: "/api/biblioteca/prestamos",
      lectura: "biblio_ver_prestamos",
    },
  ];
}

for (const mod of modulos()) {
  test(`${mod.nombre}: lista, uno, crear, eliminar y modificar`, async (t) => {
    t.mock.method(mod.Modelo, "findAll", async () => filas([{ [mod.idKey]: 1 }]));
    assert.equal((await mod.fns.todos()).length, 1);

    t.mock.method(mod.Modelo, "findByPk", async () => null);
    await assert.rejects(mod.fns.uno(99), /No se encontró/);
    t.mock.method(mod.Modelo, "findByPk", async () => fila({ [mod.idKey]: 1 }));
    assert.equal((await mod.fns.uno(1))[mod.idKey], 1);

    const crear = t.mock.method(mod.Modelo, "create", async (d) => fila(d));
    await mod.crear({ ...mod.datos });
    assert.deepEqual(crear.mock.calls[0].arguments[0], mod.datos);

    t.mock.method(mod.Modelo, "destroy", async () => 0);
    await assert.rejects(mod.fns.eliminar(99), /No se encontró/);
    t.mock.method(mod.Modelo, "destroy", async () => 1);
    assert.equal(await mod.fns.eliminar(99), 1);

    t.mock.method(mod.Modelo, "update", async () => [1]);
    assert.deepEqual(await mod.fns.modificar({ ...mod.datos }), [1]);
  });
}

test("rutas /biblioteca: lectura abierta, escritura con permiso", async (t) => {
  await permisos(t, {
    [ROLES.ROOT]: [
      "biblio_ver_prestamos",
      "biblio_ver_recursos",
      "biblio_crear_recurso",
      "biblio_editar_recurso",
      "biblio_eliminar_recurso",
      "biblio_crear_prestamo",
    ],
  });
  for (const mod of modulos()) {
    t.mock.method(mod.Modelo, "findAll", async () => filas([{ [mod.idKey]: 1 }]));
    t.mock.method(mod.Modelo, "findByPk", async () => fila({ [mod.idKey]: 1 }));
    t.mock.method(mod.Modelo, "create", async (d) => fila({ [mod.idKey]: 5, ...d }));
    t.mock.method(mod.Modelo, "update", async () => [1]);
    t.mock.method(mod.Modelo, "destroy", async () => 1);
  }
  const srv = await obtenerServidor();

  await sinToken(srv, "GET", "/api/biblioteca/biblioteca");
  // Escritura sin permiso de biblio → 403 (administrativo no lo tiene).
  await sinPermiso(srv, "POST", "/api/biblioteca/recursos/x", { body: RECURSO[2] });

  const auth = { token: token({ id_rol: ROLES.ROOT }) };

  for (const mod of modulos()) {
    const lista = await srv.request("GET", mod.base, auth);
    assert.equal(lista.status, 200, `GET ${mod.base}`);

    const uno = await srv.request("GET", `${mod.base}/1`, auth);
    assert.equal(uno.status, 200, `GET ${mod.base}/1`);
  }

  const creado = await srv.request("POST", "/api/biblioteca/recursos/x", {
    ...auth,
    body: RECURSO[2],
  });
  assert.equal(creado.status, 201);

  const mod = await srv.request("PATCH", "/api/biblioteca/recursos/x", {
    ...auth,
    body: RECURSO[2],
  });
  assert.equal(mod.status, 200);

  const del = await srv.request("DELETE", "/api/biblioteca/recursos/1", auth);
  assert.equal(del.status, 200);

  const prestamo = await srv.request("POST", "/api/biblioteca/prestamos/x", {
    ...auth,
    body: PRESTAMO[2],
  });
  assert.equal(prestamo.status, 201);
});
