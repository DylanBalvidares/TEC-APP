import ErrorHandler from "../ErrorHandler.js";
import { Autoridad } from "../models/index.js";

async function obtenerTodasAutoridades() {
  try {
    const autoridades = await Autoridad.findAll();

    if (!autoridades.length) {
      throw new ErrorHandler(404, "No se encontraron autoridades");
    }

    return autoridades;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerTodasAutoridades:", error);
    throw new ErrorHandler(500, "Error interno al obtener autoridades");
  }
}

async function obtenerAutoridad(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de autoridad inválida");
    }

    const autoridad = await Autoridad.findByPk(id);

    if (!autoridad) {
      throw new ErrorHandler(404, "No se encontró la autoridad especificada");
    }

    return autoridad;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerAutoridad:", error);
    throw new ErrorHandler(500, "Error interno al obtener autoridad");
  }
}

async function crearAutoridad(autoridad) {
  try {
    const data = await Autoridad.create(autoridad);
    return data;
  } catch (error) {
    console.error("Error en crearAutoridad:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      // Maneja tanto el email duplicado como el id_usuario duplicado
      const campo = error.errors[0].path;
      const mensaje =
        campo === "email"
          ? "El email ya existe"
          : "El usuario ya está asignado a otra autoridad";
      throw new ErrorHandler(400, mensaje);
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El usuario especificado no existe");
    }

    throw new ErrorHandler(500, "Error interno al crear autoridad");
  }
}

async function eliminarAutoridad(id) {
  try {
    const filasBorradas = await Autoridad.destroy({
      where: {
        id_autoridad: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontró la autoridad especificada");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en eliminarAutoridad:", error);
    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function modificarAutoridad(autoridadData) {
  const { id_autoridad, nombre, apellido, cargo, email, id_usuario } =
    autoridadData;
  try {
    if (!id_autoridad || id_autoridad < 0) {
      throw new ErrorHandler(400, "ID inválida");
    }

    const filasAfectadas = await Autoridad.update(
      {
        nombre,
        apellido,
        cargo,
        email,
        id_usuario,
      },
      {
        where: { id_autoridad: id_autoridad },
      },
    );

    if (filasAfectadas[0] === 0) {
      throw new ErrorHandler(
        404,
        "No se encontró la autoridad o no hubo cambios",
      );
    }

    return filasAfectadas;
  } catch (error) {
    console.error("Error en modificarAutoridad:", error);
    if (error instanceof ErrorHandler) throw error;

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El email ingresado ya está en uso");
    }

    throw new ErrorHandler(500, "Error interno al modificar autoridad");
  }
}

export {
  obtenerTodasAutoridades,
  obtenerAutoridad,
  crearAutoridad,
  eliminarAutoridad,
  modificarAutoridad,
};
