import ErrorHandler from "../../utils/ErrorHandler.js";
import { Alumno, Curso } from "../../db/models/index.js";

async function validarIdentidadAlumno(data) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: validarIdentidadAlumno");
  const { dni, nacimiento } = data;

  if (!dni || !nacimiento) {
    throw new ErrorHandler(400, "El dni o la fecha de nacimiento inválida");
  }

  try {
    const alumno = await Alumno.findOne({
      where: {
        dni: dni,
        fecha_nacimiento: nacimiento,
      },
    });

    if (!alumno) {
      throw new ErrorHandler(404, "No se encontro el alumno especificado");
    }

    return {
      valido: true,
      alumno: alumno,
    };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAlumnoPorDniYNacimiento:", error);
    throw new ErrorHandler(500, "Error interno al obtenerAlumno");
  }
}

async function obtenerTodosAlumnos() {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerTodosAlumnos");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodosAlumnos:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumnos");
  }
}

async function obtenerAlumno(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerAlumno");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAlumno:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumno");
  }
}

async function obtenerAlumnosCurso(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerAlumnosCurso");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAlumnosCurso:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumnos");
  }
}

async function obtenerAlumnosCursoParaAlumno(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerAlumnosCursoParaAlumno");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de curso inválida");
    }

    const alumnos = await Alumno.findAll({
      where: {
        id_curso: id,
      },
      attributes: ["nombre", "apellido"],
    });

    if (!alumnos.length) {
      throw new ErrorHandler(404, "No se encontraron alumnos asignados");
    }

    return alumnos;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAlumnosCurso:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumnos");
  }
}

async function obtenerInfoParaAlumno(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerInfoParaAlumno");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de alumno inválida");
    }

    const alumno = await Alumno.findOne({
      where: {
        id_usuario: id,
      },

      attributes: ["id_alumno", "nombre", "apellido", "estado", "id_curso"],
    });

    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m OBTENER-INFO-PARA-ALUMNO:", alumno);

    if (!alumno) {
      throw new ErrorHandler(404, "No se encontró el alumno especificado");
    }

    return alumno;
  } catch (error) {
    // Esto está excelente para propagar tus errores personalizados
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAlumno:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumno");
  }
}

async function crearAlumno(alumno) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearAlumno");
  try {
    const data = await Alumno.create(alumno);
    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearAlumno:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El DNI o ID de Usuario ingresado ya existe");
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El curso o usuario especificado no existe");
    }

    throw new ErrorHandler(500, "Error interno al crear alumno");
  }
}

async function sincronizarUsuarioAlumno(payload) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: sincronizarUsuarioAlumno");
  try {
    const { idAlumno, idUsuario } = payload;

    if (!idAlumno || idUsuario < 0) {
      throw new ErrorHandler(400, "ID de alumno/usuario inválida");
    }

    const data = await Alumno.update(
      {
        id_usuario: idUsuario,
      },
      {
        where: {
          id_alumno: idAlumno,
        },
      },
    );

    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en sincronizarAlumno:", error);
    throw new ErrorHandler(500, "Error interno al sincronizar alumno");
  }
}

async function eliminarAlumno(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarAlumno");
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

    // Capturar error de FK: el alumno tiene asistencias/notas registradas
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        409,
        "No se puede eliminar el alumno porque tiene registros de asistencias o notas vinculados. " +
        "Primero eliminá sus registros de asistencia y calificaciones."
      );
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarAlumno:", error);
    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function modificarAlumno(alumno) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarAlumno");
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

  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ALUMNOS-CONTROLLER:", alumno);

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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarAlumno:", error);

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

async function darDeBajaAlumno(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: darDeBajaAlumno");
  try {
    // Soft delete: cambia el estado a 'baja' en vez de borrar físicamente
    // Esto preserva asistencias, notas y demás registros relacionados
    const [filasAfectadas] = await Alumno.update(
      { estado: "baja" },
      {
        where: {
          id_alumno: id,
        },
      },
    );

    if (filasAfectadas === 0) {
      throw new ErrorHandler(404, "No se encontro el alumno especificado");
    }

    return { mensaje: "Alumno dado de baja correctamente", id_alumno: id };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en darDeBajaAlumno:", error);
    throw new ErrorHandler(500, "Error interno al dar de baja al alumno");
  }
}

export {
  obtenerTodosAlumnos,
  obtenerAlumnosCurso,
  validarIdentidadAlumno,
  obtenerInfoParaAlumno,
  obtenerAlumnosCursoParaAlumno,
  obtenerAlumno,
  crearAlumno,
  sincronizarUsuarioAlumno,
  eliminarAlumno,
  modificarAlumno,
  darDeBajaAlumno,
};
