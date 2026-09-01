import ErrorHandler from "../../utils/ErrorHandler.js";
import { Asignacion, Curso, Materia, Profesor, Nota } from "../../db/models/index.js";
import sequelize from "../../db/conexionDB.js";

async function obtenerTodasAsignaciones() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodasAsignaciones");
  try {
    const asignaciones = await Asignacion.findAll({
      include: [
        {
          model: Profesor,
          as: "profesorAsignacion",
          attributes: ["nombre", "apellido"],
        },
        {
          model: Materia,
          as: "materiaAsignacion",
          attributes: ["nombre_materia"],
        },
        {
          model: Curso,
          as: "cursoAsignacion",
          attributes: ["nombre_curso", "aula", "nivel", "turno"],
        },
      ],
    });

    if (!asignaciones.length) {
      throw new ErrorHandler(404, "No se encontraron asignaciones");
    }

    return asignaciones;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodasAsignaciones:", error);
    throw new ErrorHandler(500, "Error interno al obtener asignaciones");
  }
}

async function obtenerAsignacionesProfesor(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerAsignacionesProfesor");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de profesor inválida");
    }

    const asignaciones = await Asignacion.findAll({
      where: {
        id_profesor: id,
      },
      include: [
        {
          model: Profesor,
          as: "profesorAsignacion",
          attributes: ["nombre", "apellido"],
        },
        {
          model: Materia,
          as: "materiaAsignacion",
          attributes: ["nombre_materia"],
        },
        {
          model: Curso,
          as: "cursoAsignacion",
          attributes: ["nombre_curso", "aula", "nivel", "turno"],
        },
      ],
    });

    if (!asignaciones.length) {
      throw new ErrorHandler(404, "No se encontraron asignaciones");
    }

    return asignaciones;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAsignacionesProfesor:", error);
    throw new ErrorHandler(500, "Error interno al obtener asignaciones");
  }
}

async function obtenerAsignacionesCurso(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerAsignacionesCurso");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de curso inválida");
    }

    const asignaciones = await Asignacion.findAll({
      where: {
        id_curso: id,
      },
      include: [
        {
          model: Profesor,
          as: "profesorAsignacion",
          attributes: ["nombre", "apellido"],
        },
        {
          model: Materia,
          as: "materiaAsignacion",
          attributes: ["nombre_materia"],
        },
        {
          model: Curso,
          as: "cursoAsignacion",
          attributes: ["nombre_curso", "aula", "nivel", "turno"],
        },
      ],
    });

    if (!asignaciones.length) {
      throw new ErrorHandler(404, "No se encontraron asignaciones para este curso");
    }

    return asignaciones;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAsignacionesCurso:", error);
    throw new ErrorHandler(500, "Error interno al obtener asignaciones del curso");
  }
}

async function obtenerAsignacion(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerAsignacion");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de asignación inválida");
    }

    const asignacion = await Asignacion.findByPk(id);

    if (!asignacion) {
      throw new ErrorHandler(404, "No se encontró la asignación especificada");
    }

    return asignacion;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAsignacion:", error);
    throw new ErrorHandler(500, "Error interno al obtener asignación");
  }
}

async function crearAsignacion(asignacion) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearAsignacion");
  try {
    const data = await Asignacion.create(asignacion);
    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearAsignacion:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        400,
        "El curso, la materia o el profesor especificado no existen",
      );
    }

    throw new ErrorHandler(500, "Error interno al crear asignación");
  }
}

async function eliminarAsignacion(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarAsignacion");
  const t = await sequelize.transaction();

  try {
    // Eliminar primero las notas asociadas para no violar la FK constraint
    await Nota.destroy({
      where: { id_asignacion: id },
    }, { transaction: t });

    const filasBorradas = await Asignacion.destroy({
      where: { id_asignacion: id },
    }, { transaction: t });

    if (filasBorradas === 0) {
      await t.rollback();
      throw new ErrorHandler(404, "No se encontró la asignación especificada");
    }

    await t.commit();
    return filasBorradas;
  } catch (error) {
    await t.rollback();
    if (error instanceof ErrorHandler) throw error;

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarAsignacion:", error);
    throw new ErrorHandler(500, "Error interno al eliminar asignación");
  }
}

async function modificarAsignacion(asignacion) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarAsignacion");
  const { id_asignacion, id_curso, id_materia, id_profesor } = asignacion;

  try {
    if (!id_asignacion || id_asignacion < 0) {
      throw new ErrorHandler(400, "ID de asignación inválida");
    }

    const filasAfectadas = await Asignacion.update(
      {
        id_curso,
        id_materia,
        id_profesor,
      },
      {
        where: {
          id_asignacion,
        },
      },
    );

    if (filasAfectadas[0] === 0) {
      throw new ErrorHandler(404, "No se encontró la asignación especificada");
    }

    return filasAfectadas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarAsignacion:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        400,
        "El curso, la materia o el profesor especificado no existen",
      );
    }

    throw new ErrorHandler(500, "Error interno al modificar asignación");
  }
}

export {
  obtenerTodasAsignaciones,
  obtenerAsignacion,
  obtenerAsignacionesProfesor,
  obtenerAsignacionesCurso,
  crearAsignacion,
  eliminarAsignacion,
  modificarAsignacion,
};
