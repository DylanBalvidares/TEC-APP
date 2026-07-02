import ErrorHandler from "../ErrorHandler.js";
import { Nota } from "../models/index.js";

async function obtenerTodasNotas() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodasNotas");
  try {
    const notas = await Nota.findAll();

    if (!notas.length) {
      throw new ErrorHandler(404, "No se encontraron notas");
    }

    return notas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodasNotas:", error);
    throw new ErrorHandler(500, "Error interno al obtener notas");
  }
}

async function obtenerNota(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerNota");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de nota inválida");
    }

    const nota = await Nota.findByPk(id);

    if (!nota) {
      throw new ErrorHandler(404, "No se encontró la nota especificada");
    }

    return nota;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerNota:", error);
    throw new ErrorHandler(500, "Error interno al obtener nota");
  }
}

async function crearNota(nota) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearNota");
  try {
    const data = await Nota.create(nota);
    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearNota:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        400,
        "El alumno o la asignación especificada no existe",
      );
    }

    throw new ErrorHandler(500, "Error interno al crear nota");
  }
}

async function eliminarNota(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarNota");
  try {
    const filasBorradas = await Nota.destroy({
      where: {
        id_nota: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontró la nota especificada");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarNota:", error);
    throw new ErrorHandler(500, "Error interno al eliminar nota");
  }
}

async function modificarNota(nota) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarNota");
  const { id_nota, id_alumno, id_asignacion, calificacion, fecha_carga, observaciones } = nota;

  try {
    if (!id_nota || id_nota < 0) {
      throw new ErrorHandler(400, "ID de nota inválida");
    }

    const filasAfectadas = await Nota.update(
      {
        id_alumno,
        id_asignacion,
        calificacion,
        fecha_carga,
        observaciones,
      },
      {
        where: {
          id_nota,
        },
      },
    );

    if (filasAfectadas[0] === 0) {
      throw new ErrorHandler(404, "No se encontró la nota especificada");
    }

    return filasAfectadas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarNota:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        400,
        "El alumno o la asignación especificada no existe",
      );
    }

    throw new ErrorHandler(500, "Error interno al modificar nota");
  }
}

export {
  obtenerTodasNotas,
  obtenerNota,
  crearNota,
  eliminarNota,
  modificarNota,
};
