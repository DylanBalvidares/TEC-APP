import Alumno from "../models/alumnos-model.js";

async function obtenerTodosAlumnos() {
  try {
    const alumnos = await Alumno.findAll();
    
    if (alumnos.length === 0) {
      throw new Error("No se encontraron alumnos");
    }

    return alumnos;
  } catch (error) {
    console.error("Error en obtenerTodosAlumnos", error);
    return "Error en obtenerTodosAlumnos";
  }
}

async function obtenerAlumno(id) {
  try {
    const alumno = await Alumno.findByPk(id);

    if (!alumno) {
      throw new Error("Error en obtenerAlumno(id)");
    }

    return alumno;
  } catch (error) {
    console.error("Error en obtenerAlumno(id):", error);
    return ("Error en obtenerAlumno(id):", error);
  }
}

async function crearAlumno(alumno) {
  try {
    const data = await Alumno.create(alumno);

    if (!data) {
      return new Error("Error en crearAlumno");
    }

    return data;
  } catch (error) {
    console.error("Error en crearAlumno(alumno):", error);
    return ("Error en crearAlumno(alumno):", error);
  }
}

async function eliminarAlumno(id) {
  try {
    const data = await Alumno.destroy({
      where: {
        id_alumno: id,
      },
    });

    if (data === 0) {
      throw new Error("Error en eliminarAlumno(id)");
    }

    return data;
  } catch (error) {
    console.error("Error en eliminarAlumno(id)");
    return "Error en eliminarAlumno(id)";
  }
}

async function modificarAlumno(alumno) {
  try {
    const { id, nombre, apellido, dni, curso } = alumno;
    const data = await Alumno.update(
      {
        nombre: nombre,
        apellido: apellido,
        dni: dni,
        id_curso: curso,
      },
      {
        where: {
          id_alumno: id,
        },
      },
    );

    if (!data) {
      throw new Error("Error en modificarNombre(alumno)");
    }

    return data;
  } catch (error) {
    console.error("Error en modificarNombre(id,nombre)");
    return "Error en modificarAlumno(alumno)";
  }
}

export {
  obtenerTodosAlumnos,
  obtenerAlumno,
  crearAlumno,
  eliminarAlumno,
  modificarAlumno,
};
