import ErrorHandler from "../../utils/ErrorHandler.js";
import ObjetoPerdido from "../../db/models/objetos-perdidos-model.js";

export async function obtenerTodosObjetos() {
  try {
    const objetos = await ObjetoPerdido.findAll({
      order: [["fecha_encontrado", "DESC"]],
    });

    if (!objetos.length) {
      throw new ErrorHandler(404, "No se encontraron objetos perdidos");
    }

    return objetos;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerTodosObjetos:", error);
    throw new ErrorHandler(500, "Error interno al obtener objetos");
  }
}

export async function obtenerObjeto(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de objeto inválido");
    }

    const objeto = await ObjetoPerdido.findByPk(id);

    if (!objeto) {
      throw new ErrorHandler(404, "Objeto no encontrado");
    }

    return objeto;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerObjeto:", error);
    throw new ErrorHandler(500, "Error interno al obtener objeto");
  }
}

export async function reportarObjeto(datos) {
  try {
    const { nombre, descripcion, encontrado_por } = datos;

    if (!nombre) {
      throw new ErrorHandler(400, "El nombre del objeto es requerido");
    }

    const objeto = await ObjetoPerdido.create({
      nombre,
      descripcion,
      encontrado_por,
      estado: "perdido",
      fecha_encontrado: new Date(),
    });

    return objeto;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en reportarObjeto:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "La autoridad especificada no existe");
    }

    throw new ErrorHandler(500, "Error interno al reportar objeto");
  }
}

export async function actualizarEstadoObjeto(id, estado) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de objeto inválido");
    }

    const estadosValidos = ["perdido", "encontrado", "reclamado"];
    if (!estadosValidos.includes(estado)) {
      throw new ErrorHandler(
        400,
        `Estado inválido. Opciones: ${estadosValidos.join(", ")}`,
      );
    }

    const [filasActualizadas] = await ObjetoPerdido.update(
      { estado },
      { where: { id_objeto: id } },
    );

    if (filasActualizadas === 0) {
      throw new ErrorHandler(404, "Objeto no encontrado");
    }

    return filasActualizadas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en actualizarEstadoObjeto:", error);
    throw new ErrorHandler(500, "Error interno al actualizar objeto");
  }
}

export async function eliminarObjeto(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de objeto inválido");
    }

    const filasEliminadas = await ObjetoPerdido.destroy({
      where: { id_objeto: id },
    });

    if (filasEliminadas === 0) {
      throw new ErrorHandler(404, "Objeto no encontrado");
    }

    return filasEliminadas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en eliminarObjeto:", error);
    throw new ErrorHandler(500, "Error interno al eliminar objeto");
  }
}