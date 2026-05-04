import ErrorHandler from "../ErrorHandler.js";
import { Asistencia } from "../models/index.js";

async function obtenerTodosAsistencias() {
  try {
    const asistencias = await Asistencia.findAll();

    if (!asistencias.length) {
      throw new ErrorHandler(404, "No se encontraron asistencias");
    }

    return asistencias;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerTodosAsistencias:", error);
    throw new ErrorHandler(500, "Error interno al obtener asistencias");
  }
}

async function obtenerAsistencia(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de asistencia inválida");
    }

    const asistencia = await Asistencia.findByPk(id);

    if (!asistencia) {
      throw new ErrorHandler(404, "La asistencia especificada no existe");
    }

    return asistencia;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerAsistencia:", error);
    throw new ErrorHandler(500, "Error interno al buscar la asistencia");
  }
}

async function crearAsistencia(asistencia) {
  try {
    const data = await Asistencia.create(asistencia);
    return data;
  } catch (error) {
    console.error("Error en crearAsistencia:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El ID de alumno especificado no existe");
    }

    throw new ErrorHandler(500, "Error interno al crear asistencia");
  }
}

async function eliminarAsistencia(id) {
  try {
    const filasBorradas = await Asistencia.destroy({
      where: {
        id_asistencia: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontro la asistencia especificada");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en eliminarAsistencia:", error);
    throw new ErrorHandler(500, "Error interno al eliminar la asistencia");
  }
}

async function modificarAsistencia(asistencia) {
  const { id_asistencia, fecha, estado, id_alumno } = asistencia;
  console.log("ASISTENCIAS-CONTROLLER:", asistencia);
  try {
    if (!id_asistencia || id_asistencia < 0) {
      throw new ErrorHandler(400, "ID invalida");
    }

    const filasAfectadas = await Asistencia.update(
      {
        fecha: fecha,
        estado: estado,
        id__alumno: id_alumno,
      },
      {
        where: {
          id_asistencia: id_asistencia,
        },
      },
    );

    if (filasAfectadas[0] === 0) {
      throw new ErrorHandler(404, "No se encontro la asistencia especificada");
    }

    return filasAfectadas;
  } catch (error) {
    console.error("Error en modificarAsistencia:", error);
    if (error instanceof ErrorHandler) {
      throw error;
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        400,
        "El alumno de la asistencia especificada no existe",
      );
    }

    throw new ErrorHandler(500, "Error interno al modificar la asistencia");
  }
}

export {
  obtenerTodosAsistencias,
  obtenerAsistencia,
  crearAsistencia,
  eliminarAsistencia,
  modificarAsistencia,
};
