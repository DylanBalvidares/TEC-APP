import ErrorHandler from "../utils/ErrorHandler.js";
import { Rol, Permiso } from "../db/models/index.js";

export async function obtenerPermisosDeRol(idRol) {
  try {
    const rolConPermisos = await Rol.findByPk(idRol, {
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
    return [];
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

      // Root bypass
      if (Number(rol) === 8 || Number(rol) === 9) {
        return next();
      }

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
