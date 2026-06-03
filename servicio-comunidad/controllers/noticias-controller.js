import { ErrorHandler } from "../ErrorHandler.js";
import Noticia from "../models/noticias-model.js";

export async function obtenerTodasNoticias() {
  try {
    const noticias = await Noticia.findAll({
      order: [["fecha", "DESC"]],
    });

    if (!noticias.length) {
      throw new ErrorHandler(404, "No se encontraron noticias");
    }

    return noticias;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerTodasNoticias:", error);
    throw new ErrorHandler(500, "Error interno al obtener noticias");
  }
}

export async function obtenerNoticia(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de noticia inválido");
    }

    const noticia = await Noticia.findByPk(id);

    if (!noticia) {
      throw new ErrorHandler(404, "Noticia no encontrada");
    }

    return noticia;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerNoticia:", error);
    throw new ErrorHandler(500, "Error interno al obtener noticia");
  }
}

export async function crearNoticia(datos) {
  try {
    const { titulo, contenido, autor_id, imagen_url } = datos;

    if (!titulo || !contenido) {
      throw new ErrorHandler(400, "Título y contenido son requeridos");
    }

    const noticia = await Noticia.create({
      titulo,
      contenido,
      autor_id,
      imagen_url,
      fecha: new Date(),
    });

    return noticia;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en crearNoticia:", error);
    throw new ErrorHandler(500, "Error interno al crear noticia");
  }
}

export async function eliminarNoticia(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de noticia inválido");
    }

    const filasEliminadas = await Noticia.destroy({
      where: { id_noticia: id },
    });

    if (filasEliminadas === 0) {
      throw new ErrorHandler(404, "Noticia no encontrada");
    }

    return filasEliminadas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en eliminarNoticia:", error);
    throw new ErrorHandler(500, "Error interno al eliminar noticia");
  }
}

export async function actualizarNoticia(id, datos) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de noticia inválido");
    }

    const { titulo, contenido, imagen_url } = datos;

    if (!titulo && !contenido && !imagen_url) {
      throw new ErrorHandler(400, "Al menos un campo debe ser actualizado");
    }

    const [filasActualizadas] = await Noticia.update(
      {
        ...(titulo && { titulo }),
        ...(contenido && { contenido }),
        ...(imagen_url && { imagen_url }),
      },
      { where: { id_noticia: id } },
    );

    if (filasActualizadas === 0) {
      throw new ErrorHandler(404, "Noticia no encontrada");
    }

    return filasActualizadas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en actualizarNoticia:", error);
    throw new ErrorHandler(500, "Error interno al actualizar noticia");
  }
}