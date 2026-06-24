import ErrorHandler from "../ErrorHandler.js";
import { Materia } from "../models/index.js";

async function obtenerTodasMaterias() {
  try {
    const materias = await Materia.findAll();

    if (!materias.length) {
      throw new ErrorHandler(404, "No se encontraron materias");
    }

    return materias;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerTodasMaterias:", error);
    throw new ErrorHandler(500, "Error interno al obtener materias");
  }
}

async function obtenerMateria(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de materia inválida");
    }

    const materia = await Materia.findByPk(id);

    if (!materia) {
      throw new ErrorHandler(404, "No se encontró la materia especificada");
    }

    return materia;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerMateria:", error);
    throw new ErrorHandler(500, "Error interno al obtener materia");
  }
}

async function crearMateria(materia) {
  try {
    const data = await Materia.create(materia);
    return data;
  } catch (error) {
    console.error("Error en crearMateria:", error);
    throw new ErrorHandler(500, "Error interno al crear materia");
  }
}

async function eliminarMateria(id) {
  try {
    const filasBorradas = await Materia.destroy({
      where: {
        id_materia: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontró la materia especificada");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en eliminarMateria:", error);
    throw new ErrorHandler(500, "Error interno al eliminar materia");
  }
}

async function modificarMateria(materia) {
  const { id_materia, nombre_materia, carga_horaria, descripcion } = materia;

  try {
    if (!id_materia || id_materia < 0) {
      throw new ErrorHandler(400, "ID de materia inválida");
    }

    const filasAfectadas = await Materia.update(
      {
        nombre_materia,
        carga_horaria,
        descripcion,
      },
      {
        where: {
          id_materia,
        },
      },
    );

    if (filasAfectadas[0] === 0) {
      throw new ErrorHandler(404, "No se encontró la materia especificada");
    }

    return filasAfectadas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en modificarMateria:", error);
    throw new ErrorHandler(500, "Error interno al modificar materia");
  }
}

export {
  obtenerTodasMaterias,
  obtenerMateria,
  crearMateria,
  eliminarMateria,
  modificarMateria,
};
