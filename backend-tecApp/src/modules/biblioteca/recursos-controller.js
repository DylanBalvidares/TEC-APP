import Recurso from "../../db/models/recursos-model.js";

async function obtenerTodosRecursos() {
  try {
    const recursos = await Recurso.findAll();
    return recursos;
  } catch (error) {
    console.log("Error en obtenerRecursos", error);
    return [];
  }
}

async function obtenerRecurso(id) {
  try {
    const recurso = await Recurso.findByPk(id);

    if (!recurso) {
      throw new Error("No se encontró el recurso especificado");
    }

    return recurso;
  } catch (error) {
    console.log("Error en obtenerRecurso(id)", error);
    throw error;
  }
}

async function crearRecurso(recurso) {
  try {
    const data = await Recurso.create(recurso);
    return data;
  } catch (error) {
    console.log("Error en crearRecurso(recurso)", error);
    throw error;
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
      throw new Error("No se encontró el recurso especificado");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function modificarRecurso(recurso) {
  try {
    const { id, nombre, tipo, descripcion, estado, id_biblioteca } = recurso;
    const data = await Recurso.update(
      {
        nombre,
        tipo,
        descripcion,
        estado,
        id_biblioteca,
      },
      {
        where: {
          id_recurso: id,
        },
      }
    );
    if (data[0] === 0) {
      throw new Error("No se encontró el recurso o no hubo cambios");
    }

    return data;
  } catch (error) {
    console.log("Error en modificarRecurso(recurso)", error);
    throw error;
  }
}

export {
  obtenerTodosRecursos,
  obtenerRecurso,
  crearRecurso,
  eliminarRecurso,
  modificarRecurso,
};
