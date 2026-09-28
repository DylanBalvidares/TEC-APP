import { Op } from "sequelize";
import ErrorHandler from "../../utils/ErrorHandler.js";
import { Auditoria } from "../../db/models/index.js";
import { parsearPaginacion, respuestaPaginada } from "../../utils/paginacion.js";

const COLUMNAS_AUDITORIA = ["id_auditoria", "accion", "entidad", "id_usuario", "fecha"];

export async function listarAuditoria(query = {}) {
  try {
    const { page, limit, offset, sort, order } = parsearPaginacion(query, {
      columnas: COLUMNAS_AUDITORIA,
    });
    const where = {};
    if (query.entidad) where.entidad = String(query.entidad);
    if (query.accion) where.accion = String(query.accion);
    if (query.id_usuario !== undefined && query.id_usuario !== "") {
      where.id_usuario = Number(query.id_usuario);
    }
    if (query.desde || query.hasta) {
      where.fecha = {};
      if (query.desde) where.fecha[Op.gte] = query.desde;
      if (query.hasta) where.fecha[Op.lte] = query.hasta;
    }
    const { count, rows } = await Auditoria.findAndCountAll({
      where,
      limit,
      offset,
      order: sort ? [[sort, order]] : [["fecha", "DESC"]],
    });
    return respuestaPaginada({ filas: rows, total: count, page, limit });
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("[ERROR] listarAuditoria:", error.message);
    throw new ErrorHandler(500, "Error interno al consultar la auditoría");
  }
}
