import { where } from "sequelize";
import ErrorHandler from "../ErrorHandler.js";
import { Alumno, Curso } from "../models/index.js";

async function obtenerTodosAlumnos() {
  try {
    const alumnos = await Alumno.findAll({
      include: [
        {
          model: Curso,
          attributes: ["nombre_curso"],
        },
      ],
    });

    if (!alumnos.length) {
      throw new ErrorHandler(404, "No se encontraron alumnos");
    }

    return alumnos;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerTodosAlumnos:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumnos");
  }
}

async function obtenerAlumno(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de alumno inválida");
    }

    const alumno = await Alumno.findByPk(id);

    if (!alumno) {
      throw new ErrorHandler(404, "No se encontro el alumno especificado");
    }

    return alumno;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerAlumno:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumno");
  }
}

async function obtenerAlumnosCurso(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de curso inválida");
    }

    const alumnos = await Alumno.findAll({
      where: {
        id_curso: id,
      },
    });

    if (!alumnos.length) {
      throw new ErrorHandler(404, "No se encontraron alumnos asignados");
    }

    return alumnos;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerAlumnosCurso:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumnos");
  }
}

async function crearAlumno(alumno) {
  try {
    const data = await Alumno.create(alumno);
    return data;
  } catch (error) {
    console.error("Error en crearAlumno:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El DNI o ID de Usuario ingresado ya existe");
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El curso o usuario especificado no existe");
    }

    throw new ErrorHandler(500, "Error interno al crear alumno");
  }
}

async function eliminarAlumno(id) {
  try {
    const filasBorradas = await Alumno.destroy({
      where: {
        id_alumno: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontro el alumno especificado");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en eliminarAlumno:", error);
    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function modificarAlumno(alumno) {
  // Desestructuramos todos los campos definidos en el modelo
  const {
    id_alumno,
    nombre,
    apellido,
    dni,
    fecha_nacimiento,
    nombre_tutor,
    telefono_tutor,
    domicilio,
    estado,
    id_curso,
    id_usuario,
  } = alumno;

  console.log("ALUMNOS-CONTROLLER:", alumno);

  try {
    // CORRECCIÓN: Validamos el id_alumno, no el id_curso
    if (!id_alumno || id_alumno < 0) {
      throw new ErrorHandler(400, "ID de alumno inválida");
    }

    const filasAfectadas = await Alumno.update(
      {
        nombre,
        apellido,
        dni,
        fecha_nacimiento,
        nombre_tutor,
        telefono_tutor,
        domicilio,
        estado,
        id_curso,
        id_usuario,
      },
      {
        where: {
          id_alumno: id_alumno,
        },
      },
    );

    if (filasAfectadas[0] === 0) {
      throw new ErrorHandler(
        404,
        "No se encontro el alumno especificado o no hubo cambios",
      );
    }

    return filasAfectadas;
  } catch (error) {
    console.error("Error en modificarAlumno:", error);

    if (error instanceof ErrorHandler) {
      throw error;
    }

    // Agregamos manejo de errores de constraints para el update también
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(
        400,
        "El DNI o ID de Usuario ingresado ya está registrado en otro alumno",
      );
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El curso o usuario especificado no existe");
    }

    // Por si envían un estado Enum no válido o omiten un campo allowNull: false
    if (error.name === "SequelizeValidationError") {
      throw new ErrorHandler(
        400,
        "Datos de validación incorrectos. Verifique los campos enviados.",
      );
    }

    throw new ErrorHandler(500, "Error interno al modificar alumno");
  }
}

export {
  obtenerTodosAlumnos,
  obtenerAlumnosCurso,
  obtenerAlumno,
  crearAlumno,
  eliminarAlumno,
  modificarAlumno,
};
