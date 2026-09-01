import Rol from "../models/roles-model.js";
import Permiso from "../models/permisos-model.js";
import ErrorHandler from "../ErrorHandler.js";

async function obtenerPermisosDeRol(idRol) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerPermisosDeRol");
  try {
    const rolConPermisos = await Rol.findByPk(idRol, {
      include: {
        model: Permiso,
        as: "permisos", // El alias que hayan definido en sus asociaciones
        attributes: ["nombre_permiso"],
        through: { attributes: [] }, // Evita traer datos basura de la tabla intermedia
      },
    });

    if (!rolConPermisos) {
      throw new ErrorHandler(404, "No se encontro el rol especificado");
    }

    const data = rolConPermisos.toJSON();
    return data.permisos.map((p) => p.nombre_permiso);
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.log("\x1b[1m\x1b[33m[DEBUG]\x1b[0m CATCH ERROR:", error.name);
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m obtenerPermisosDeRol:", error.message); // ← ver qué pasó

    throw new ErrorHandler(500, "Error interno del servidor");
  }
}
export default obtenerPermisosDeRol;
