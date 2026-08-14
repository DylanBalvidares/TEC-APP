import ErrorHandler from "../ErrorHandler.js";
import { Op } from "sequelize";
import { Alumno, Asistencia } from "../models/index.js";

async function obtenerTodosAsistencias() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodosAsistencias");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodosAsistencias:", error);
    throw new ErrorHandler(500, "Error interno al obtener asistencias");
  }
}

async function obtenerTodosAsistenciasCurso(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerTodosAsistenciasCurso");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodosAsistencias:", error);
    throw new ErrorHandler(500, "Error interno al obtener asistencias");
  }
}

async function obtenerAsistencia(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerAsistencia");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAsistencia:", error);
    throw new ErrorHandler(500, "Error interno al buscar la asistencia");
  }
}

async function obtenerHistorialAsistencias({ id_curso, fecha_desde, fecha_hasta } = {}) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerHistorialAsistencias");
  try {
    const where = {};

    if (id_curso) {
      where.id_curso = id_curso;
    }

    if (fecha_desde || fecha_hasta) {
      where.fecha = {};

      if (fecha_desde) {
        where.fecha[Op.gte] = fecha_desde;
      }

      if (fecha_hasta) {
        where.fecha[Op.lte] = fecha_hasta;
      }
    }

    const historial = await Asistencia.findAll({
      where,
      include: [
        {
          model: Alumno,
          as: "alumno",
          attributes: ["id_alumno", "nombre", "apellido"],
        },
      ],
      order: [["fecha", "ASC"], ["id_alumno", "ASC"]],
    });

    if (!historial.length) {
      throw new ErrorHandler(404, "No se encontró historial de asistencias");
    }

    return historial;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerHistorialAsistencias:", error);
    throw new ErrorHandler(500, "Error interno al obtener el historial de asistencias");
  }
}

async function crearAsistencia(asistencia) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearAsistencia");
  try {
    const data = await Asistencia.create(asistencia);
    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearAsistencia:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El ID de alumno especificado no existe");
    }

    throw new ErrorHandler(500, "Error interno al crear asistencia");
  }
}

async function eliminarAsistencia(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarAsistencia");
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

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        409,
        "No se puede eliminar la asistencia porque tiene dependencias vinculadas."
      );
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarAsistencia:", error);
    throw new ErrorHandler(500, "Error interno al eliminar la asistencia");
  }
}

async function modificarAsistencia(asistencia) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarAsistencia");
  const { id_asistencia, fecha, estado, id_alumno } = asistencia;
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ASISTENCIAS-CONTROLLER:", asistencia);
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarAsistencia:", error);
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
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: guardarAsistenciasLote");
  // Desestructurar desde datosLote directamente
  const { registrado_por, id_curso, fecha, registros } = datosLote;

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
  obtenerHistorialAsistencias,
  obtenerTodosAsistenciasCurso,
  crearAsistencia,
  eliminarAsistencia,
  modificarAsistencia,
  guardarAsistenciasLote,
};
