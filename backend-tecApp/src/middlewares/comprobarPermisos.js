import ErrorHandler from "../utils/ErrorHandler.js";
import { Rol, Permiso } from "../db/models/index.js";
import { normalizarListaPermisos, SOLO_AUTENTICADO } from "../utils/permisosConfig.js";

export async function obtenerPermisosDeRol(idRol) {
  try {
    const rolConPermisos = await Rol.findByPk(idRol, {
      attributes: ["id_rol"],
      include: {
        model: Permiso,
        as: "permisos",
        attributes: ["nombre_permiso"],
        through: { attributes: [] },
      },
    });

    if (!rolConPermisos) {
      return [];
    }

    const data = rolConPermisos.toJSON();
    return (data.permisos || []).map((p) => p.nombre_permiso);
  } catch (error) {
    console.error("[ERROR] obtenerPermisosDeRol:", error.message);
    // No devolver [] silencioso: eso convertía un 500 de DB en un 403 engañoso.
    throw new ErrorHandler(500, "Error interno al verificar permisos");
  }
}

/**
 * Marca una ruta que deliberadamente sólo requiere autenticación
 * (sin permiso específico). Debe usarse de forma explícita.
 */
export const soloAutenticado = SOLO_AUTENTICADO;

/**
 * Middleware de autorización.
 *
 * SEGURIDAD (fail-closed): si no se indica un permiso explícito ni
 * `soloAutenticado`, la ruta responde 500 en lugar de quedar abierta.
 *
 * @param {string|string[]|symbol} permisoRequerido
 */
export function comprobarPermiso(permisoRequerido) {
  const listaDePermisos = normalizarListaPermisos(permisoRequerido);

  return async (req, res, next) => {
    const rol = req.headers["id_rol"];
    const usuario = req.headers["id_usuario"];

    try {
      if (!usuario || !rol) {
        return next(
          new ErrorHandler(
            401,
            "Token inválido o rol no disponible en el request."
          )
        );
      }

      // Error de configuración: fallar cerrado (nunca abrir por olvido).
      if (listaDePermisos === null) {
        return next(
          new ErrorHandler(
            500,
            "Configuración inválida de permisos en la ruta: usá un permiso explícito o soloAutenticado()."
          )
        );
      }

      // Ruta marcada sólo-autenticación (ya validamos usuario y rol arriba).
      if (listaDePermisos.length === 0) {
        return next();
      }

      // Root (rol 8) pasa todos los chequeos porque en el seed tiene TODOS los
      // permisos. No hay bypass hardcodeado por id: se resuelve por permisos.
      const permisosDelRol = await obtenerPermisosDeRol(rol);

      const tieneAcceso = listaDePermisos.some((p) =>
        permisosDelRol.includes(p)
      );

      if (!tieneAcceso) {
        return next(
          new ErrorHandler(
            403,
            `Acceso denegado: No tenés el permiso necesario -> (${listaDePermisos.join(", ")})`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default comprobarPermiso;
