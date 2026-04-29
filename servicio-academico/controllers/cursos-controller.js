import { Sequelize } from "sequelize";
import Curso from "../models/cursos-model.js";

async function obtenerTodosCursos() {
  try {
    const cursos = await Curso.findAll();

    if (!cursos.length) {
      throw {
        ok: true,
        status: 204,
        error: "No se encontraron cursos",
      }
      return;
    }

    return cursos;
  } catch (error) {
    throw {
      status: 500,
      error: "Error interno del servidor"
    }
  }

}

async function obtenerCurso(id) {

  try {

    if (id < 0) {
      throw {
        ok: false,
        status: 400,
        error: "id invalida"
      }

      return;
    }

    const curso = await Curso.findByPk(id);

    if (!curso) {
      throw {
        ok: true,
        status: 204,
        error: "No se encontro el curso especificado"
      }
    }

    return curso;
  } catch (error) {
    console.error("Error en obtenerAlumno(id):", error);
    return ("Error en obtenerAlumno(id):", error);
  }
}

async function crearCurso(curso) {
  try {
    const data = await Curso.create(curso); //<--create:build & save

    return data;
  } catch (error) {
    if (!error.status) {
      throw {
        status: 500,
        error: "Error interno del servidor"
      }

      return;
    }

    if (error instanceof Sequelize.UniqueConstraintError) {
      throw {
        ok: false,
        status: 500,
        error: "El curso especificado ya existe"
      }
      return;
    }

    if (error instanceof Sequelize.DatabaseError) {
      throw {
        ok: false,
        status: 500,
        error: "Error de BD"
      }
    }

    if (error instanceof Sequelize.ConnectionError) {
      throw {
        ok: false,
        status: 500,
        error: "Error conexion BD"
      }
    }
  }
}

async function eliminarCurso(id) {
  try {
    const data = await Curso.destroy({
      where: {
        id_curso: id,
      },
    });

    if (data === 0) {
      throw new Error("Error en eliminarCurso(id)");
    }

    return data;
  } catch (error) {
    console.error("Error en eliminarCurso(id)");
    return "Error en eliminarCurso(id)";
  }
}

async function modificarCurso(curso) {
  try {
    const { id, nombre, turno, aula } = curso;
    const data = await Curso.update(
      {
        nombre: nombre,
        turno: turno,
        aula: aula,
      },
      {
        where: {
          id_curso: id,
        },
      },
    );

    if (!data) {
      throw new Error("Error en modificarCurso(curso)");
    }

    return data;

  } catch (error) {
    console.error("Error en modificarCurso(curso)");
    return "Error en modificarCurso(curso)";
  }
}

export {
  obtenerTodosCursos,
  obtenerCurso,
  crearCurso,
  eliminarCurso,
  modificarCurso
};