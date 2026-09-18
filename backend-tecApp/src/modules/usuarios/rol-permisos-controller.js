import Rol from "../../db/models/roles-model.js";
import Permiso from "../../db/models/permisos-model.js";
import ErrorHandler from "../../utils/ErrorHandler.js";
import { obtenerPermisosDeRol } from "../../middlewares/comprobarPermisos.js";

// Re-export unificado: una sola implementación de obtenerPermisosDeRol.
export { obtenerPermisosDeRol };

async function obtenerPermisosDeRolPorId(idRol) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerPermisosDeRol");
  try {
    const permisos = await obtenerPermisosDeRol(idRol);

    if (!permisos) {
      throw new ErrorHandler(404, "No se encontraron permisos para el rol");
    }

    return permisos;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m obtenerPermisosDeRol:", error.message);
    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function obtenerTodosPermisos() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodosPermisos");
  try {
    const permisos = await Permiso.findAll({
      order: [["nombre_permiso", "ASC"]],
    });

    if (!permisos || permisos.length === 0) {
      throw new ErrorHandler(404, "No se encontraron permisos registrados");
    }

    return permisos;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m obtenerTodosPermisos:", error.message);
    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function asignarPermisosARol(idRol, idsPermisos) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: asignarPermisosARol");
  try {
    if (!idRol) {
      throw new ErrorHandler(400, "El id del rol es obligatorio");
    }

    if (!Array.isArray(idsPermisos)) {
      throw new ErrorHandler(400, "La lista de permisos es obligatoria");
    }

    const rol = await Rol.findByPk(idRol);

    if (!rol) {
      throw new ErrorHandler(404, "No se encontró el rol especificado");
    }

    const idsUnicos = [...new Set(idsPermisos)];

    // Valida que todos los ids correspondan a permisos existentes
    const permisosValidos = await Permiso.findAll({
      where: { id_permiso: idsUnicos },
      attributes: ["id_permiso"],
    });

    if (permisosValidos.length !== idsUnicos.length) {
      throw new ErrorHandler(
        400,
        "Uno o más permisos no existen (ids inválidos)",
      );
    }

    await rol.setPermisos(permisosValidos);

    return {
      ok: true,
      mensaje: "Permisos actualizados correctamente",
    };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m asignarPermisosARol:", error.message);
    throw new ErrorHandler(500, "Error interno al asignar permisos");
  }
}

export { obtenerPermisosDeRolPorId, obtenerTodosPermisos, asignarPermisosARol };