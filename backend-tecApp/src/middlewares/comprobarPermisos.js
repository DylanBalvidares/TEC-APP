import ErrorHandler from "../utils/ErrorHandler.js";
import { Rol, Permiso } from "../db/models/index.js";

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

export function comprobarPermiso(permisoRequerido) {
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

      // Root (rol 8) pasa todos los chequeos: en el seed tiene TODOS los permisos.
      // No hay bypass hardcodeado por id: se resuelve por permisos como el resto.

      const listaDePermisos = await obtenerPermisosDeRol(rol);

      if (!permisoRequerido) {
        return next();
      }

      const permisosArray = Array.isArray(permisoRequerido)
        ? permisoRequerido
        : [permisoRequerido];

      const tieneAcceso = permisosArray.some((p) =>
        listaDePermisos.includes(p)
      );

      if (!tieneAcceso) {
        return next(
          new ErrorHandler(
            403,
            `Acceso denegado: No tenés el permiso necesario -> (${permisoRequerido})`
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
