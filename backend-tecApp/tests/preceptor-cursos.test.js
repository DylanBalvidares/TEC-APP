import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { obtenerServidor, cerrarServidor } from "./helpers/http.js";
import { ROLES, token } from "./helpers/auth.js";
import { fila } from "./helpers/crud.js";
import { Curso, Personal, Comunicado, Rol } from "../src/db/models/index.js";
import { invalidarCachePermisos } from "../src/middlewares/comprobarPermisos.js";
import { obtenerCursosPreceptor } from "../src/modules/academico/cursos-controller.js";
import { eliminarComunicado } from "../src/modules/comunidad/comunicados-controller.js";

after(cerrarServidor);
beforeEach(() => invalidarCachePermisos());

async function permisos(t, mapa) {
  t.mock.method(Rol, "findByPk", async (id, opciones) => {
    if (opciones?.include) {
      return {
        toJSON: () => ({
          id_rol: Number(id),
          permisos: (mapa[Number(id)] || []).map((nombre_permiso) => ({ nombre_permiso })),
        }),
      };
    }
    return fila({ id_rol: Number(id) });
  });
}

test("cursos del preceptor se derivan del usuario autenticado y la asignación personal", async (t) => {
  let consultaPersonal;
  let consultaCursos;
  t.mock.method(Personal, "findOne", async (opciones) => {
    consultaPersonal = opciones;
    return { id_personal: 18 };
  });
  t.mock.method(Curso, "findAll", async (opciones) => {
    consultaCursos = opciones;
    return [fila({ id_curso: 3, id_preceptor: 18, nombre_curso: "2do A" })];
  });

  const cursos = await obtenerCursosPreceptor(44);
  assert.equal(cursos[0].id_curso, 3);
  assert.deepEqual(consultaPersonal.where, { id_usuario: 44 });
  assert.deepEqual(consultaCursos.where, { id_preceptor: 18 });
});

test("GET mis-cursos requiere permiso y sólo permite el rol preceptor", async (t) => {
  await permisos(t, {
    [ROLES.PRECEPTOR]: ["preceptor_ver_curso"],
    [ROLES.PROFESOR]: ["preceptor_ver_curso"],
  });
  t.mock.method(Personal, "findOne", async () => ({ id_personal: 18 }));
  t.mock.method(Curso, "findAll", async () => [fila({ id_curso: 3, nombre_curso: "2do A" })]);
  const srv = await obtenerServidor();

  const sinSesion = await srv.request("GET", "/api/academico/preceptor/mis-cursos");
  assert.equal(sinSesion.status, 401);
  const permitido = await srv.request("GET", "/api/academico/preceptor/mis-cursos", {
    token: token({ id: 44, id_rol: ROLES.PRECEPTOR }),
  });
  assert.equal(permitido.status, 200);
  assert.equal(permitido.data[0].id_curso, 3);

  const rolAjeno = await srv.request("GET", "/api/academico/preceptor/mis-cursos", {
    token: token({ id: 50, id_rol: ROLES.PROFESOR }),
  });
  assert.equal(rolAjeno.status, 403);
});

test("el preceptor sólo elimina comunicados de cursos a su cargo", async (t) => {
  const comunicado = { id_comunicado: 9, autor_id: 77, destino: "todos", curso_destino: null };
  let whereCurso;
  let eliminaciones = 0;
  t.mock.method(Comunicado, "findByPk", async () => comunicado);
  t.mock.method(Personal, "findOne", async (opciones) => {
    assert.deepEqual(opciones.where, { id_usuario: 44 });
    return { id_personal: 18 };
  });
  t.mock.method(Curso, "findOne", async (opciones) => {
    whereCurso = opciones.where;
    return { id_curso: 3 };
  });
  t.mock.method(Comunicado, "destroy", async () => { eliminaciones += 1; return 1; });

  await assert.rejects(
    eliminarComunicado(9, { idUsuario: 44, idRol: ROLES.PRECEPTOR }),
    /sólo puede eliminar sus comunicados o los de sus cursos/i,
  );
  assert.equal(eliminaciones, 0);

  comunicado.autor_id = 44;
  assert.equal(await eliminarComunicado(9, { idUsuario: 44, idRol: ROLES.PRECEPTOR }), 1);
  assert.equal(eliminaciones, 1);

  comunicado.autor_id = 77;
  comunicado.destino = "curso";
  comunicado.curso_destino = "2do A";
  assert.equal(await eliminarComunicado(9, { idUsuario: 44, idRol: ROLES.PRECEPTOR }), 1);
  assert.deepEqual(whereCurso, { id_preceptor: 18, nombre_curso: "2do A" });
  assert.equal(eliminaciones, 2);
});

test("DELETE /comunicados autoriza al preceptor sólo en sus cursos", async (t) => {
  await permisos(t, { [ROLES.PRECEPTOR]: ["comunicado_eliminar"] });
  const comunicado = { id_comunicado: 9, autor_id: 44, destino: "todos", curso_destino: null };
  let eliminaciones = 0;
  t.mock.method(Comunicado, "findByPk", async () => comunicado);
  t.mock.method(Personal, "findOne", async () => ({ id_personal: 18 }));
  t.mock.method(Curso, "findOne", async () => ({ id_curso: 3 }));
  t.mock.method(Comunicado, "destroy", async () => { eliminaciones += 1; return 1; });
  const srv = await obtenerServidor();
  const auth = { token: token({ id: 44, id_rol: ROLES.PRECEPTOR }) };

  const propioGeneral = await srv.request("DELETE", "/api/comunidad/comunicados/9", auth);
  assert.equal(propioGeneral.status, 200);
  assert.equal(eliminaciones, 1);

  comunicado.autor_id = 77;
  const generalAjeno = await srv.request("DELETE", "/api/comunidad/comunicados/9", auth);
  assert.equal(generalAjeno.status, 403);
  assert.equal(eliminaciones, 1);

  comunicado.destino = "curso";
  comunicado.curso_destino = "2do A";
  const asignado = await srv.request("DELETE", "/api/comunidad/comunicados/9", auth);
  assert.equal(asignado.status, 200);
  assert.equal(eliminaciones, 2);
});
