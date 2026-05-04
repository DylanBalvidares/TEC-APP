import { Curso } from "../models/index.js";
import ErrorHandler from "../ErrorHandler.js";

async function obtenerTodosCursos() {
  try {
    const cursos = await Curso.findAll();

    if (!cursos.length) {
      throw new ErrorHandler(404, "No se encontraron cursos");
    }

    return cursos;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function obtenerCurso(id) {
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
  try {
    const data = await Curso.create(curso); //<--create:build & save

    return data;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function eliminarCurso(id) {
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

    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function modificarCurso(curso) {
  const { id_curso, nombre_curso, turno, aula } = curso;
  console.log("CURSOS-CONTROLLER:", curso);

  try {
    if (id_curso < 0 || !id_curso) {
      throw new ErrorHandler(400, "ID invalida");
    }

    const filasAfectadas = await Curso.update(
      //retorna un array[],donde "[0]"" es la cantidad de filas afectadas
      {
        nombre_curso: nombre_curso,
        turno: turno,
        aula: aula,
      },
      {
        where: {
          id_curso: id_curso,
        },
      },
    );

    if (filasAfectadas[0] === 0) {
      throw new ErrorHandler(404, " No se encontro el curso especificado");
    }

    return filasAfectadas;
  } catch (error) {
    console.log("=== ERROR ===");
    console.log(error);
    console.log(error.name);
    console.log(error.message);
    console.log(error.sql);
    console.log("=============");

    if (error instanceof ErrorHandler) {
      throw error;
    }

    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

export {
  obtenerTodosCursos,
  obtenerCurso,
  crearCurso,
  eliminarCurso,
  modificarCurso,
};
