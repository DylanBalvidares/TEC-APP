import ErrorHandler from "../ErrorHandler.js";
import axios from "axios";

const comprobarPermiso = (permisoRequerido) => {
  return async (req, res, next) => {
    console.log("[DEBUG] HEADERS(comprobarPermisos):", Object.keys(req.headers)); //DEBUG
    const rol = req.headers["id_rol"];
    console.log("[DEBUG] ROL ID EN COMPROBAR PERMISO:", rol); //DEBUG
    const usuario = req.headers["id_usuario"];
    console.log("[DEBUG] USER ID EN COMPROBAR PERMISO:", usuario); //DEBUG

    try {
      if (!usuario || !rol) {
        return next(
          new ErrorHandler(
            401,
            "Token inválido o rol no disponible en el request.",
          ),
        );
      }

      //const idRolUsuario = req.headers["id_rol"]; // intenta obtener el rol desde ambos lugares

      const rolConPermisos = await axios.get(
        `http://servicio-usuarios:3310/permisos/${rol}`,
      );

      if (!rolConPermisos.data) {
        return next(
          new ErrorHandler(
            403,
            "Acceso denegado: Rol no encontrado en el sistema.",
          ),
        );
      }

      console.log("[DEBUG] ROL CON PERMISOS OBTENIDO:", rolConPermisos.data); //DEBUG

      const listaDePermisos = rolConPermisos.data;

      const permisosArray = Array.isArray(permisoRequerido) ? permisoRequerido : [permisoRequerido];
      const tieneAcceso = permisosArray.some(p => listaDePermisos.includes(p));

      if (!tieneAcceso) {
        return next(
          new ErrorHandler(
            403,
            `Acceso denegado: No tenés el permiso necesario->(${permisoRequerido}`,
            //`Acceso denegado: No tenés el permiso necesario (${permisoRequerido})`,DEBUG
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
