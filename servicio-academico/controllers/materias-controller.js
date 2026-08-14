import ErrorHandler from "../ErrorHandler.js";
import { Materia } from "../models/index.js";

async function obtenerTodasMaterias() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodasMaterias");
  try {
    const materias = await Materia.findAll();

    if (!materias.length) {
      throw new ErrorHandler(404, "No se encontraron materias");
    }

    return materias;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodasMaterias:", error);
    throw new ErrorHandler(500, "Error interno al obtener materias");
  }
}

async function obtenerMateria(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerMateria");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerMateria:", error);
    throw new ErrorHandler(500, "Error interno al obtener materia");
  }
}

async function crearMateria(materia) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearMateria");
  try {
    const data = await Materia.create(materia);
    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearMateria:", error);
    throw new ErrorHandler(500, "Error interno al crear materia");
  }
}

async function eliminarMateria(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarMateria");
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

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        409,
        "No se puede eliminar la materia porque tiene asignaciones activas vinculadas a cursos y profesores."
      );
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarMateria:", error);
    throw new ErrorHandler(500, "Error interno al eliminar materia");
  }
}

async function modificarMateria(materia) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarMateria");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarMateria:", error);
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
