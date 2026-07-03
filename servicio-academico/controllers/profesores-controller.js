import ErrorHandler from "../ErrorHandler.js";
import { Profesor } from "../models/index.js";

async function validarIdentidadProfesor(data) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: validarIdentidadProfesor");
  const { dni, nacimiento } = data;

  if (!dni || !nacimiento) {
    throw new ErrorHandler(400, "El dni o la fecha de nacimiento inválida");
  }

  try {
    const profesor = await Profesor.findOne({
      where: {
        dni: dni,
        fecha_nacimiento: nacimiento,
      },
    });

    if (!profesor) {
      throw new ErrorHandler(404, "No se encontro el profesor especificado");
    }

    return {
      valido: true,
      info: profesor,
    };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en validarIdentidadProfesor:", error);
    throw new ErrorHandler(500, "Error interno al validarIdentidadProfesor");
  }
}

async function obtenerTodosProfesores() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodosProfesores");
  try {
    const profesores = await Profesor.findAll();

    if (!profesores.length) {
      throw new ErrorHandler(404, "No se encontraron profesores");
    }

    return profesores;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodosProfesores:", error);
    throw new ErrorHandler(500, "Error interno al obtener profesores");
  }
}

async function obtenerProfesor(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerProfesor");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de profesor inválida");
    }

    const profesor = await Profesor.findByPk(id);

    if (!profesor) {
      throw new ErrorHandler(404, "Profesor no encontrado");
    }

    return profesor;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerProfesor:", error);
    throw new ErrorHandler(500, "Error interno al buscar profesor");
  }
}

async function crearProfesor(profesor) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearProfesor");
  try {
    const data = await Profesor.create(profesor);
    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearProfesor:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El DNI o el email ya se encuentran registrados");
    }

    throw new ErrorHandler(500, "Error al registrar el profesor");
  }
}

async function eliminarProfesor(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarProfesor");
  try {
    const filasBorradas = await Profesor.destroy({
      where: {
        id_profesor: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontró el profesor especificado");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarProfesor:", error);
    throw new ErrorHandler(500, "Error interno al eliminar profesor");
  }
}

async function modificarProfesor(profesor) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarProfesor");
  const {
    id_profesor,
    nombre,
    apellido,
    dni,
    email,
    telefono,
    fecha_nacimiento,
    domicilio,
    fecha_contratacion,
    estado,
    titulo_habilitante,
    especialidad,
  } = profesor;

  try {
    if (!id_profesor) {
      throw new ErrorHandler(400, "ID invalida");
    }

    const [filasAfectadas] = await Profesor.update(
      {
        nombre,
        apellido,
        dni,
        email,
        telefono,
        fecha_nacimiento,
        domicilio,
        fecha_contratacion,
        estado,
        titulo_habilitante,
        especialidad,
      },
      {
        where: {
          id_profesor,
        },
      },
    );

    if (filasAfectadas === 0) {
      throw new ErrorHandler(404, "No se encontró el profesor especificado");
    }

    return filasAfectadas;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarProfesor:", error);
    if (error instanceof ErrorHandler) {
      throw error;
    }
    throw new ErrorHandler(500, "Error interno al modificar profesor");
  }
}

async function sincronizarUsuarioProfesor(payload) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: sincronizarUsuarioProfesor");
  try {
    const { idProfesor, idUsuario } = payload;

    if (!idProfesor || idUsuario < 0) {
      throw new ErrorHandler(400, "ID de profesor/usuario inválida");
    }

    const data = await Profesor.update(
      {
        id_usuario: idUsuario,
      },
      {
        where: {
          id_profesor: idProfesor,
        },
      }
    );

    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en sincronizarProfesor:", error);
    throw new ErrorHandler(500, "Error interno al sincronizar profesor");
  }
}

export {
  obtenerTodosProfesores,
  obtenerProfesor,
  validarIdentidadProfesor,
  crearProfesor,
  eliminarProfesor,
  modificarProfesor,
  sincronizarUsuarioProfesor,
};
