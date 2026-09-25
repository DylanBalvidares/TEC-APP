import { Op } from "sequelize";
import ErrorHandler from "../../utils/ErrorHandler.js";
import { Correo } from "../../db/models/index.js";

export async function obtenerHistorialGlobal(filtros = {}) {
  try {
    const where = {};

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.fecha_desde) {
      where.fecha_envio = { [Op.gte]: filtros.fecha_desde };
    }

    if (filtros.fecha_hasta) {
      where.fecha_envio = { ...where.fecha_envio, [Op.lte]: filtros.fecha_hasta };
    }

    const { count, rows } = await Correo.findAndCountAll({
      where,
      order: [["fecha_envio", "DESC"]],
      limit: filtros.limit || 50,
      offset: filtros.offset || 0,
    });

    return {
      success: true,
      lista: rows.map((correo) => ({
        id: correo.id_correo,
        remitente: correo.id_remitente,
        destinatario: correo.email_destino,
        asunto: correo.asunto,
        estado: correo.estado,
        fecha_envio: correo.fecha_envio,
        leido: correo.leido,
      })),
      total: count,
    };
  } catch (error) {
    console.error("Error en obtenerHistorialGlobal:", error);
    return {
      success: false,
      mensaje: error.message || "Error al obtener el historial",
    };
  }
}

export async function marcarCorreoLeido(id_correo) {
  try {
    if (!id_correo) {
      throw new ErrorHandler(400, "ID de correo inválido");
    }

    const correo = await Correo.findByPk(id_correo);

    if (!correo) {
      throw new ErrorHandler(404, "Correo no encontrado");
    }

    await correo.update({ leido: true, fecha_lectura: new Date() });

    return {
      success: true,
      mensaje: "Correo marcado como leído",
    };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en marcarCorreoLeido:", error);
    throw new ErrorHandler(500, "Error interno al marcar correo como leído");
  }
}