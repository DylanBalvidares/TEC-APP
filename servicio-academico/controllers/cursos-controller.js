import { Curso, Profesor } from "../models/index.js";
import ErrorHandler from "../ErrorHandler.js";

async function obtenerTodosCursos() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodosCursos");
  try {
    const cursos = await Curso.findAll({
      include: [
        {
          model: Profesor,
          as: "profesorTitular",
          attributes: ["nombre", "apellido"],
        },
      ],
    });

    if (!cursos.length) {
      throw new ErrorHandler(404, "No se encontraron cursos");
    }

    return cursos;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR->", error);
    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function obtenerCurso(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerCurso");
  try {
    if (id < 0 || !id) {
      throw new ErrorHandler(400, "ID invalida");
    }

    const curso = await Curso.findByPk(id);

    if (!curso) {
      throw new ErrorHandler(404, "No se encontro el curso especificado");
    }

    return curso;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function crearCurso(curso) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearCurso");
  try {
    // Se crea el curso directamente con los datos recibidos del body
    const nuevoCurso = await Curso.create(curso);
    return nuevoCurso;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    if (error.name === "SequelizeValidationError") {
      throw new ErrorHandler(400, "Datos inválidos: " + error.message);
    }
    throw new ErrorHandler(500, "Error al crear el curso");
  }
}

async function eliminarCurso(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarCurso");
  try {
    if (id < 0) {
      throw new ErrorHandler(400, "ID invalida");
    }

    const filasBorradas = await Curso.destroy({
      where: {
        id_curso: id,
      },
    });

    if (!filasBorradas) {
      throw new ErrorHandler(404, "No se encontro el curso especificado");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR AL ELIMINAR CURSO:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        400,
        "El curso no se puede eliminar porque tiene alumnos asignados, reasignalos a otro curso primero",
      );
    }

    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function modificarCurso(curso) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarCurso");
  const {
    id_curso,
    nombre_curso,
    nivel,
    ciclo_lectivo,
    capacidad_maxima,
    aula,
    turno,
    id_profesor_titular,
    estado,
  } = curso; // Puede ser req.body, cursoData, o el objeto que contenga la información
  try {
    if (!id_curso || id_curso < 0) throw new ErrorHandler(400, "ID inválida");

    // Actualizamos usando el objeto completo, evitando sobrescribir el ID
    delete curso.id_curso;

    const [filasAfectadas] = await Curso.update(curso, {
      where: {
        id_curso: id_curso,
      },
    });

    if (filasAfectadas === 0) {
      throw new ErrorHandler(404, "No se encontró el curso para actualizar");
    }

    return { mensaje: "Curso actualizado correctamente" };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    throw new ErrorHandler(500, "Error interno al modificar el curso");
  }
}

export {
  obtenerTodosCursos,
  obtenerCurso,
  crearCurso,
  eliminarCurso,
  modificarCurso,
};
