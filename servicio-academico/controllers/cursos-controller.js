import Curso from "../models/cursos-model.js";

async function obtenerTodosCursos() {
  try {
    const cursos = await Curso.findAll();

    if (cursos.length === 0) {
      throw new Error("No se encontraron cursos");
    }

    return cursos;

  } catch (error) {
    console.error("Error en obtenerTodosCursos", error);
    return "Error en obtenerTodosCursos";
  }
}

async function obtenerCurso(id) {
  try {
    const curso = await Curso.findByPk(id);

    if (!curso) {
      throw new Error("Error en obtenerCurso(id)");
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
    console.error("Error en crearCurso(curso):", error);
    return ("Error en crearCurso(curso):", error);
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