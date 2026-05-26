import Rol from "../models/roles-model.js";
import Permiso from "../models/permisos-model.js";
import ErrorHandler from "../ErrorHandler.js";

async function obtenerPermisosDeRol(idRol) {
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

    console.log("CATCH ERROR->", error.name);
    console.error("obtenerPermisosDeRol:", error.message); // ← ver qué pasó

    throw new ErrorHandler(500, "Error interno del servidor");
  }
}
export default obtenerPermisosDeRol;
