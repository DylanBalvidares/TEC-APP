/**
 * Helper de tests de autorización: firma tokens JWT con el mismo secreto que usa
 * el backend y simula los permisos de un rol mockeando `Rol.findByPk` (que es la
 * única consulta que hace `comprobarPermisos`). Así se puede validar 401/403/200
 * sin base de datos.
 *
 * Uso:
 *   test("...", async (t) => {
 *     mockearPermisosDeRol(t, { 1: [], 8: ["root_gestionar_cargos"] });
 *     const srv = await obtenerServidor();
 *     ...
 *   });
 */
process.env.NODE_ENV = "test";
process.env.SKIP_DB_CONNECT = "1";
process.env.JWT_SECRET ||= "test-jwt-secret";

import jwt from "jsonwebtoken";
import obtenerJWTSecret from "../../src/utils/jwtSecret.js";
import { Rol } from "../../src/db/models/index.js";

export const ROLES = Object.freeze({
  ALUMNO: 1,
  DELEGADO: 2,
  PROFESOR: 3,
  PRECEPTOR: 4,
  BIBLIOTECARIO: 5,
  TUTOR: 6,
  ADMINISTRATIVO: 7,
  ROOT: 8,
});

/**
 * Firma un token igual al que emite el login.
 * @param {{id?: number, id_rol?: number, email?: string}} datos
 */
export function token({ id = 1, id_rol = ROLES.ALUMNO, email = "test@tecnica2.edu.ar" } = {}) {
  return jwt.sign({ id, email, id_rol }, obtenerJWTSecret(), { expiresIn: "1h" });
}

/**
 * Mockea los permisos por rol. El mapa es `{ [id_rol]: ["permiso", ...] }`.
 * Los roles que no aparecen en el mapa quedan sin permisos.
 */
export function mockearPermisosDeRol(t, permisosPorRol) {
  t.mock.method(Rol, "findByPk", async (idRol) => ({
    toJSON: () => ({
      id_rol: Number(idRol),
      permisos: (permisosPorRol[Number(idRol)] || []).map((nombre_permiso) => ({
        nombre_permiso,
      })),
    }),
  }));
}
