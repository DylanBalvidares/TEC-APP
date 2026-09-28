import ErrorHandler from "../../utils/ErrorHandler.js";
import Notificacion from "../../db/models/notificacion-model.js";
import NotificacionPreferencia from "../../db/models/notificacion-preferencia-model.js";
import { seleccionarCanal, CANALES } from "../../utils/notificaciones.js";

export async function crearNotificacion({ id_usuario, tipo, titulo, cuerpo = null }) {
  if (!id_usuario) throw new ErrorHandler(400, "El destinatario es obligatorio");
  if (!tipo) throw new ErrorHandler(400, "El tipo es obligatorio");
  if (!titulo || !String(titulo).trim()) throw new ErrorHandler(400, "El título es obligatorio");
  const notificacion = await Notificacion.create({
    id_usuario: Number(id_usuario),
    tipo: String(tipo),
    titulo: String(titulo).trim().slice(0, 200),
    cuerpo: cuerpo ? String(cuerpo).slice(0, 2000) : null,
  });
  const preferencias = await obtenerPreferencias(id_usuario);
  return {
    notificacion,
    canales: seleccionarCanal(tipo, preferencias),
  };
}

export async function listarMisNotificaciones(idUsuario, { soloNoLeidas = false } = {}) {
  const where = { id_usuario: Number(idUsuario) };
  if (soloNoLeidas) where.leida = false;
  const { count, rows } = await Notificacion.findAndCountAll({
    where,
    order: [["fecha", "DESC"]],
    limit: 100,
  });
  return { total: count, lista: rows };
}

export async function marcarNotificacionLeida(idUsuario, idNotificacion) {
  const notificacion = await Notificacion.findByPk(Number(idNotificacion));
  if (!notificacion) throw new ErrorHandler(404, "No se encontró la notificación");
  if (Number(notificacion.id_usuario) !== Number(idUsuario)) {
    throw new ErrorHandler(403, "Acceso denegado: no es tu notificación");
  }
  if (!notificacion.leida) await notificacion.update({ leida: true });
  return { mensaje: "Notificación marcada como leída" };
}

export async function obtenerPreferencias(idUsuario) {
  const fila = await NotificacionPreferencia.findByPk(Number(idUsuario));
  if (!fila) return {};
  const plano = typeof fila.toJSON === "function" ? fila.toJSON() : fila;
  return plano.canales || {};
}

export async function guardarPreferencias(idUsuario, canales = {}) {
  const limpio = {};
  for (const [tipo, valor] of Object.entries(canales)) {
    if (valor === false) {
      limpio[tipo] = false;
    } else if (Array.isArray(valor)) {
      const validos = valor.filter((c) => CANALES.includes(c));
      limpio[tipo] = validos;
    } else {
      throw new ErrorHandler(400, `Preferencia inválida para ${tipo}`);
    }
  }
  const [fila] = await NotificacionPreferencia.findOrCreate({
    where: { id_usuario: Number(idUsuario) },
    defaults: { id_usuario: Number(idUsuario), canales: limpio },
  });
  await fila.update({ canales: limpio });
  return limpio;
}
