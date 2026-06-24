import { where } from "sequelize";
import ErrorHandler from "../ErrorHandler.js";
import { Asignacion, Curso, Materia, Profesor } from "../models/index.js";

async function obtenerTodasAsignaciones() {
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
    console.error("Error en obtenerTodasAsignaciones:", error);
    throw new ErrorHandler(500, "Error interno al obtener asignaciones");
  }
}

async function obtenerAsignacionesProfesor(id) {
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
    console.error("Error en obtenerAsignacionesProfesor:", error);
    throw new ErrorHandler(500, "Error interno al obtener asignaciones");
  }
}

async function obtenerAsignacion(id) {
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
    console.error("Error en obtenerAsignacion:", error);
    throw new ErrorHandler(500, "Error interno al obtener asignación");
  }
}

async function crearAsignacion(asignacion) {
  try {
    const data = await Asignacion.create(asignacion);
    return data;
  } catch (error) {
    console.error("Error en crearAsignacion:", error);

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
  try {
    const filasBorradas = await Asignacion.destroy({
      where: {
        id_asignacion: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontró la asignación especificada");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en eliminarAsignacion:", error);
    throw new ErrorHandler(500, "Error interno al eliminar asignación");
  }
}

async function modificarAsignacion(asignacion) {
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
    console.error("Error en modificarAsignacion:", error);

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
  crearAsignacion,
  eliminarAsignacion,
  modificarAsignacion,
};
