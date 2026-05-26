import { Rol, Permiso } from "../../servicio-usuarios/models/index.js";
import ErrorHandler from "../ErrorHandler.js";

const comprobarPermiso = (permisoRequerido) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id_rol) {
        return next(
          new ErrorHandler(401, "Token inválido o rol no disponible en el request."),
        );
      }

      const idRolUsuario = req.user.id_rol;

      const rolConPermisos = await Rol.findByPk(idRolUsuario, {
        include: {
          model: Permiso,
          as: "permisos",
          attributes: ["nombre_permiso"],
          through: { attributes: [] },
        },
      });

      if (!rolConPermisos) {
        return next(
          new ErrorHandler(
            403,
            "Acceso denegado: Rol no encontrado en el sistema.",
          ),
        );
      }

      const listaDePermisos = rolConPermisos.permisos.map(
        (p) => p.nombre_permiso,
      );

      const tieneAcceso = listaDePermisos.includes(permisoRequerido);

      if (!tieneAcceso) {
        return next(
          new ErrorHandler(
            403,
            `Acceso denegado: No tenés el permiso necesario (${permisoRequerido}).`,
          ),
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default comprobarPermiso;
