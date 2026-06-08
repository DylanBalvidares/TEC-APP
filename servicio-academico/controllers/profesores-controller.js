import ErrorHandler from "../ErrorHandler.js";
import { Profesor } from "../models/index.js";

async function obtenerTodosProfesores() {
  try {
    const profesores = await Profesor.findAll();

    if (!profesores.length) {
      throw new ErrorHandler(404, "No se encontraron profesores");
    }

    return profesores;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerTodosProfesores:", error);
    throw new ErrorHandler(500, "Error interno al obtener profesores");
  }
}

async function obtenerProfesor(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de profesor inválida");
    }

    const profesor = await Profesor.findByPk(id);

    if (!profesor) {
      throw new ErrorHandler(404, "Profesor no encontrado");
    }

    return profesor;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerProfesor:", error);
    throw new ErrorHandler(500, "Error interno al buscar profesor");
  }
}

async function crearProfesor(profesor) {
  try {
    const data = await Profesor.create(profesor);
    return data;
  } catch (error) {
    console.error("Error en crearProfesor:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El email ya se encuentra registrado");
    }

    throw new ErrorHandler(500, "Error al registrar el profesor");
  }
}

async function eliminarProfesor(id) {
  try {
    const filasBorradas = await Profesor.destroy({
      where: {
        id_profesor: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontró el profesor especificado");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en eliminarProfesor:", error);
    throw new ErrorHandler(500, "Error interno al eliminar profesor");
  }
}

async function modificarProfesor(profesor) {
  const { id_profesor, nombre, apellido, email } = profesor;

  try {
    if (!id_profesor) {
      throw new ErrorHandler(400, "ID invalida");
    }

    const filasAfectadas = await Profesor.update(
      {
        nombre: nombre,
        apellido: apellido,
        email: email,
      },
      {
        where: {
          id_profesor: id_profesor,
        },
      },
    );

    if (filasAfectadas === 0) {
      throw new ErrorHandler(404, "No se encontró el profesor especificado");
    }

    return filasAfectadas;
  } catch (error) {
    console.error("Error en modificarProfesor:", error);
    if (error instanceof ErrorHandler) {
      throw error;
    }
    throw new ErrorHandler(500, "Error interno al modificar profesor");
  }
}

export {
  obtenerTodosProfesores,
  obtenerProfesor,
  crearProfesor,
  eliminarProfesor,
  modificarProfesor,
};
