import { ErrorHandler } from "../ErrorHandler.js";
import Comunicado from "../models/comunicados-model.js";

export async function obtenerTodosComunicados() {
  try {
    const comunicados = await Comunicado.findAll({
      order: [["fecha_publicacion", "DESC"]],
    });

    if (!comunicados.length) {
      throw new ErrorHandler(404, "No se encontraron comunicados");
    }

    return comunicados;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerTodosComunicados:", error);
    throw new ErrorHandler(500, "Error interno al obtener comunicados");
  }
}

export async function obtenerComunicado(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de comunicado inválido");
    }

    const comunicado = await Comunicado.findByPk(id);

    if (!comunicado) {
      throw new ErrorHandler(404, "Comunicado no encontrado");
    }

    return comunicado;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerComunicado:", error);
    throw new ErrorHandler(500, "Error interno al obtener comunicado");
  }
}

export async function crearComunicado(datos) {
  try {
    const { titulo, mensaje, importancia, destino, autor_id } = datos;

    if (!titulo || !mensaje) {
      throw new ErrorHandler(400, "Título y mensaje son requeridos");
    }

    const comunicado = await Comunicado.create({
      titulo,
      mensaje,
      importancia: importancia || "media",
      destino: destino || "todos",
      autor_id,
      fecha_publicacion: new Date(),
    });

    return comunicado;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en crearComunicado:", error);
    throw new ErrorHandler(500, "Error interno al crear comunicado");
  }
}

export async function eliminarComunicado(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de comunicado inválido");
    }

    const filasEliminadas = await Comunicado.destroy({
      where: { id_comunicado: id },
    });

    if (filasEliminadas === 0) {
      throw new ErrorHandler(404, "Comunicado no encontrado");
    }

    return filasEliminadas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en eliminarComunicado:", error);
    throw new ErrorHandler(500, "Error interno al eliminar comunicado");
  }
}

export async function actualizarComunicado(id, datos) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de comunicado inválido");
    }

    const { titulo, mensaje, importancia, destino } = datos;

    if (!titulo && !mensaje && !importancia && !destino) {
      throw new ErrorHandler(400, "Al menos un campo debe ser actualizado");
    }

    const [filasActualizadas] = await Comunicado.update(
      {
        ...(titulo && { titulo }),
        ...(mensaje && { mensaje }),
        ...(importancia && { importancia }),
        ...(destino && { destino }),
      },
      { where: { id_comunicado: id } },
    );

    if (filasActualizadas === 0) {
      throw new ErrorHandler(404, "Comunicado no encontrado");
    }

    return filasActualizadas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en actualizarComunicado:", error);
    throw new ErrorHandler(500, "Error interno al actualizar comunicado");
  }
}
