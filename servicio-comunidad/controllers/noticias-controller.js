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

    const imagenUrl = `http://servicio-comunidad:3305/uploads/${noticias.imagen}`;

    return {
      //esto funciona, y no se que hace, esta escrito de forma rara,
      //pero funciona y devulve la url por cada noticia
      noticias: noticias.map((n) => ({
        ...n.toJSON(),
        //imagen_url: `http://servicio-comunidad:3305/uploads/${n.imagen}`,
        imagen_url: `http://localhost:3305/uploads/${n.imagen}`,
      })),
    };
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

export async function crearNoticia(datos, archivo) {
  console.log("=== Datos recibidos en crearNoticia ===");
  console.log(datos);
  console.log("=======================================");
  try {
    const { titulo, contenido, autor_id } = datos;

    if (!titulo || !contenido) {
      throw new ErrorHandler(400, "Título y contenido son requeridos");
    }

    const nombreImagen = archivo.filename || null;
    const imagenPath = archivo.path || null;

    const noticia = await Noticia.create({
      titulo: titulo,
      contenido: contenido,
      autor_id: autor_id,
      imagen: nombreImagen,
      imagen_path: imagenPath,
      fecha: new Date(),
    });

    const imagenUrl = `http://servicio-comunidad:3305/uploads/${nombreImagen}`;

    return {
      noticia,
      imagen_url: imagenUrl,
    };
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

    const { titulo, contenido, imagen } = datos;

    if (!titulo && !contenido && !imagen) {
      throw new ErrorHandler(400, "Al menos un campo debe ser actualizado");
    }

    const [filasActualizadas] = await Noticia.update(
      {
        ...(titulo && { titulo: titulo }),
        ...(contenido && { contenido: contenido }),
        ...(imagen && { imagen: imagen }),
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
