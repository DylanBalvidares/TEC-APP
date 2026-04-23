import Prestamo from "../models/prestamos-model.js";

async function obtenerTodosPrestamos() {
  try {
    const prestamos = await Recurso.findAll();

    return prestamos;
  } catch (error) {
    console.log("Error en obtenerPrestamos", error);
    return ("Error en obtenerPrestamos", error);
  }
}

async function obtenerPrestamo(id) {
  try {
    const recurso = Recurso.findByPk(id);

    if (!recurso) {
      throw new Error("Error en obtenerRecurso(id)");
    }

    return recurso;
  } catch (error) {
    console.log("Error en obtenerRecurso(id)", error);
    return "Error en obtenerRecurso(id)";
  }
}

async function crearRecurso(recurso) {
  try {
    const data = Recurso.create(recurso);

    return data;
  } catch (error) {
    console.log("Error en crearRecurso(recurso)", error);
    return ("Error en crearRecurso(recurso)", error);
  }
}

async function eliminarRecurso(id) {
  try {
    const data = await Recurso.destroy({
      where: {
        id_recurso: id,
      },
    });

    if (data === 0) {
      throw new Error("Error en eliminarBiblioteca(id)");
    }

    return data;
  } catch (error) {
    return ("Error en eliminarBiblioteca(id)", error);
  }
}

async function modificarRecurso(recurso) {
  try {
    const { id, nombre, tipo, descripcion, estado, id_biblioteca } = biblioteca;
    const data = await Biblioteca.update(
      {
        nombre: nombre,
        tipo: tipo,
        descripcion: descripcion,
        estado: estado,
        id_biblioteca: id_biblioteca,
      },
      {
        where: {
          id_recurso: id,
        },
      },
    );
    if (!data) {
      throw new Error("Error en modificarRecurso(recurso)");
    }

    return data;
  } catch (error) {
    console.log("Error en modificarRecurso(recurso)", error);
    return "Error en modificarRecurso(recurso)";
  }
}

export {
  obtenerTodosRecursos,
  obtenerRecurso,
  crearRecurso,
  eliminarRecurso,
  modificarRecurso,
};
