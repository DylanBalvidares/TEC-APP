/**
 * Fábrica de mocks CRUD para la suite backend (F0).
 *
 * Patrón por funcionalidad (ver plan-admin.md Fase 4 / cobertura total):
 *  1. Unitario: mockear el modelo con `t.mock.method(Modelo, "metodo")` usando
 *     `fila()` (imita instancia Sequelize con `toJSON`) y verificar argumentos
 *     y forma del retorno del controller.
 *  2. HTTP: `mockearPermisosDeRol` + `obtenerServidor()` y verificar 401 sin
 *     token, 403 sin permiso y 2xx/4xx con permiso (`sinToken`/`sinPermiso`).
 *
 * Los mocks viven por test (`t.mock.method` se restaura solo); no hay estado
 * compartido en este módulo.
 */
import { ROLES, token } from "./auth.js";

/** Imita una instancia Sequelize: datos + toJSON + mutadores comunes. */
export function fila(datos = {}, extras = {}) {
  const plano = { ...datos };
  return {
    ...plano,
    toJSON: () => ({ ...plano }),
    update: async () => [1],
    destroy: async () => 1,
    setPermisos: async () => true,
    ...extras,
  };
}

/** Lista de filas para findAll. */
export function filas(lista = []) {
  return lista.map((datos) => fila(datos));
}

/** Forma de findAndCountAll para listados paginados. */
export function pagina(lista = [], total = null) {
  const rows = filas(lista);
  return { count: total ?? rows.length, rows };
}

/** GET/POST/... sin token → 401 (autenticar). */
export async function sinToken(srv, method, ruta, body) {
  const res = await srv.request(method, ruta, body === undefined ? {} : { body });
  if (res.status !== 401) {
    throw new Error(`esperaba 401 sin token en ${method} ${ruta}, fue ${res.status}`);
  }
  return res;
}

/**
 * Con token de un rol sin el permiso → 403 (comprobarPermiso).
 * `rol` por defecto ADMINISTRATIVO (7), que no tiene permisos de root.
 */
export async function sinPermiso(srv, method, ruta, { rol = ROLES.ADMINISTRATIVO, body } = {}) {
  const res = await srv.request(method, ruta, {
    token: token({ id_rol: rol }),
    ...(body === undefined ? {} : { body }),
  });
  if (res.status !== 403) {
    throw new Error(`esperaba 403 sin permiso en ${method} ${ruta}, fue ${res.status}`);
  }
  return res;
}
