import ErrorHandler from "../ErrorHandler.js";
import { Alumno } from "../models/index.js";

async function obtenerTodosAlumnos() {
  try {
    const alumnos = await Alumno.findAll();

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

async function crearAlumno(alumno) {
  try {
    const data = await Alumno.create(alumno);
    return data;
  } catch (error) {
    console.error("Error en crearAlumno:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El DNI ingresado ya existe");
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw ErrorHandler(400, "El curso del alumno especificado no existe");
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
  const { id_alumno, nombre, apellido, dni, id_curso } = alumno;
  console.log("ALUMNOS-CONTROLLER:", alumno);
  try {
    if (id_curso < 0 || !id_curso) {
      throw new ErrorHandler(400, "ID invalida");
    }

    const filasAfectadas = await Alumno.update(
      //retorna un array[],donde "[0]"" es la cantidad de filas afectadas
      {
        nombre: nombre,
        apellido: apellido,
        dni: dni,
      },
      {
        where: {
          id_alumno: id_alumno,
        },
      },
    );

    if (filasAfectadas[0] === 0) {
      throw new ErrorHandler(404, "No se encontro el alumno especificado");
    }

    return filasAfectadas;
  } catch (error) {
    console.error("Error en modificarAlumno:", error);
    if (error instanceof ErrorHandler) {
      throw error;
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El curso del alumno especificado no existe");
    }

    throw new ErrorHandler(500, "Error interno al modificar alumno");
  }
}

export {
  obtenerTodosAlumnos,
  obtenerAlumno,
  crearAlumno,
  eliminarAlumno,
  modificarAlumno,
};
