import ErrorHandler from "../ErrorHandler.js";
import { Alumno, Asistencia } from "../models/index.js";

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

async function obtenerTodosAsistenciasCurso(id) {
  try {
    const asistencias = await Asistencia.findAll({
      where: {
        id_curso: id,
      },
      include: [
        {
          model: Alumno,
          as: "alumno",
          attributes: ["nombre", "apellido"],
        },
      ],
    });

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
        id_alumno: id_alumno,
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

// Agregamos un segundo parámetro para recibir el ID del usuario
async function guardarAsistenciasLote(datosLote) {
  // CORRECCIÓN 1: Desestructurar desde datosLote.payload
  const { registrado_por, id_curso, fecha, registros } = datosLote.payload;

  try {
    if (!id_curso || !fecha || !registros || !Array.isArray(registros)) {
      throw new ErrorHandler(
        400,
        "Faltan datos requeridos o el formato es incorrecto",
      );
    }

    const asistenciasParaGuardar = registros.map((reg) => ({
      id_alumno: reg.id_alumno,
      id_curso: id_curso,
      fecha: fecha,
      estado: reg.estado,
      registrado_por: registrado_por,
    }));

    console.log(
      "ASISTENCIAS A INSERTAR:",
      JSON.stringify(asistenciasParaGuardar, null, 2),
    );

    const resultado = await Asistencia.bulkCreate(asistenciasParaGuardar, {
      updateOnDuplicate: ["estado"],
    });

    return resultado;
  } catch (error) {
    console.error("=================================");
    console.error("NAME:", error.name);
    console.error("MESSAGE:", error.message);
    console.error("PARENT:", error.parent);
    console.error("SQL:", error.sql);
    console.error("=================================");
    if (error instanceof ErrorHandler) {
      throw error;
    }

    if (error.name === "SequelizeValidationError") {
      throw new ErrorHandler(400, error.errors[0].message);
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "Un alumno o curso especificado no existe");
    }

    throw new ErrorHandler(
      500,
      "Error interno al guardar las asistencias en lote",
    );
  }
}

export {
  obtenerTodosAsistencias,
  obtenerAsistencia,
  obtenerTodosAsistenciasCurso,
  crearAsistencia,
  eliminarAsistencia,
  modificarAsistencia,
  guardarAsistenciasLote,
};
