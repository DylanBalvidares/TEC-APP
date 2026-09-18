import { Op } from "sequelize";
import Rol from "../../db/models/roles-model.js";
import { Usuario } from "../../db/models/index.js";
import ErrorHandler from "../../utils/ErrorHandler.js";

const LIMITE_NOMBRE_ROL = 50;

function sanitizarNombreRol(nombreRol) {
  if (!nombreRol || !String(nombreRol).trim()) {
    throw new ErrorHandler(400, "El nombre del rol es obligatorio");
  }

  const nombre = String(nombreRol).trim();

  if (nombre.length > LIMITE_NOMBRE_ROL) {
    throw new ErrorHandler(
      400,
      `El nombre del rol no puede superar los ${LIMITE_NOMBRE_ROL} caracteres`,
    );
  }

  return nombre;
}

async function obtenerTodosRoles() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodosRoles");
  try {
    const roles = await Rol.findAll({ order: [["id_rol", "ASC"]] });

    if (!roles || roles.length === 0) {
      throw new ErrorHandler(404, "No se encontraron roles!");
    }

    return roles;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m obtenerTodosRoles:", error.message);
    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function crearRol(datosRol) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: crearRol");
  try {
    const nombre = sanitizarNombreRol(datosRol?.nombre_rol);

    const existe = await Rol.findOne({ where: { nombre_rol: nombre } });

    if (existe) {
      throw new ErrorHandler(400, "Ya existe un rol con ese nombre");
    }

    const rol = await Rol.create({ nombre_rol: nombre, es_sistema: false });

    return rol;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m crearRol:", error.message);
    throw new ErrorHandler(500, "Error interno al crear el rol");
  }
}

async function modificarRol(idRol, datosRol) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: modificarRol");
  try {
    if (!idRol) {
      throw new ErrorHandler(400, "El ID del rol es obligatorio");
    }

    const nombre = sanitizarNombreRol(datosRol?.nombre_rol);

    const rol = await Rol.findByPk(idRol);

    if (!rol) {
      throw new ErrorHandler(404, "No se encontró el rol especificado");
    }

    if (rol.es_sistema) {
      throw new ErrorHandler(
        400,
        "No se puede renombrar un rol del sistema",
      );
    }

    const duplicado = await Rol.findOne({
      where: {
        nombre_rol: nombre,
        id_rol: { [Op.ne]: Number(idRol) },
      },
    });

    if (duplicado) {
      throw new ErrorHandler(400, "Ya existe un rol con ese nombre");
    }

    await rol.update({ nombre_rol: nombre });

    return rol;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m modificarRol:", error.message);
    throw new ErrorHandler(500, "Error interno al modificar el rol");
  }
}

async function eliminarRol(idRol) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: eliminarRol");
  try {
    if (!idRol) {
      throw new ErrorHandler(400, "El ID del rol es obligatorio");
    }

    const rol = await Rol.findByPk(idRol);

    if (!rol) {
      throw new ErrorHandler(404, "No se encontró el rol especificado");
    }

    if (rol.es_sistema) {
      throw new ErrorHandler(400, "No se puede eliminar un rol del sistema");
    }

    const usuariosConRol = await Usuario.count({ where: { id_rol: idRol } });

    if (usuariosConRol > 0) {
      throw new ErrorHandler(
        409,
        "No se puede eliminar el rol porque tiene usuarios asignados",
      );
    }

    await rol.destroy();

    return { ok: true, mensaje: "Rol eliminado correctamente" };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m eliminarRol:", error.message);
    throw new ErrorHandler(500, "Error interno al eliminar el rol");
  }
}

export { obtenerTodosRoles, crearRol, modificarRol, eliminarRol };