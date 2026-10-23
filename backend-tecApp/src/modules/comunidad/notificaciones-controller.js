import ErrorHandler from "../../utils/ErrorHandler.js";
import Notificacion from "../../db/models/notificacion-model.js";
import NotificacionPreferencia from "../../db/models/notificacion-preferencia-model.js";
import { seleccionarCanal, CANALES } from "../../utils/notificaciones.js";
import { emitir } from "../../utils/eventos.js";

export async function crearNotificacion({ id_usuario, tipo, titulo, cuerpo = null, id_comunicado = null }) {
  if (!id_usuario) throw new ErrorHandler(400, "El destinatario es obligatorio");
  if (!tipo) throw new ErrorHandler(400, "El tipo es obligatorio");
  if (!titulo || !String(titulo).trim()) throw new ErrorHandler(400, "El título es obligatorio");
  const notificacion = await Notificacion.create({
    id_usuario: Number(id_usuario),
    tipo: String(tipo),
    id_comunicado: id_comunicado ? Number(id_comunicado) : null,
    titulo: String(titulo).trim().slice(0, 200),
    cuerpo: cuerpo ? String(cuerpo).slice(0, 2000) : null,
  });
  const preferencias = await obtenerPreferencias(id_usuario);
  // Tiempo real (E13): avisa al canal SSE para que el destinatario la vea
  // sin recargar. Si no hay suscriptores, no hace nada. Envío dirigido: el
  // evento solo viaja por el stream del dueño.
  const plano = typeof notificacion.toJSON === "function" ? notificacion.toJSON() : notificacion;
  emitir(
    "notificacion",
    {
      id_usuario: Number(id_usuario),
      id_notificacion: plano.id_notificacion ?? plano.id ?? null,
      tipo: String(tipo),
      id_comunicado: plano.id_comunicado ?? null,
      titulo: plano.titulo ?? String(titulo),
      cuerpo: plano.cuerpo ?? cuerpo ?? null,
    },
    { id_usuario: Number(id_usuario) },
  );
  return {
    notificacion,
    canales: seleccionarCanal(tipo, preferencias),
  };
}

/**
 * Crea notificaciones de panel para varios usuarios (ej. fan-out de un
 * comunicado) y emite un evento SSE dirigido por cada una. No lanza por IDs
 * vacíos: en ese caso no hay destinatarios y devuelve 0 creadas.
 */
export async function crearNotificacionMasiva(idsUsuarios, { tipo, titulo, cuerpo = null, id_comunicado = null }) {
  const idsUnicos = [...new Set((idsUsuarios || []).map(Number).filter(Boolean))];
  if (idsUnicos.length === 0) {
    return { creadas: 0 };
  }
  if (!tipo) throw new ErrorHandler(400, "El tipo es obligatorio");
  if (!titulo || !String(titulo).trim()) throw new ErrorHandler(400, "El título es obligatorio");

  const filas = await Notificacion.bulkCreate(
    idsUnicos.map((id) => ({
      id_usuario: id,
      tipo: String(tipo),
      id_comunicado: id_comunicado ? Number(id_comunicado) : null,
      titulo: String(titulo).trim().slice(0, 200),
      cuerpo: cuerpo ? String(cuerpo).slice(0, 2000) : null,
    })),
  );

  for (const fila of filas) {
    const plano = typeof fila.toJSON === "function" ? fila.toJSON() : fila;
    emitir(
      "notificacion",
      {
        id_usuario: plano.id_usuario,
        id_notificacion: plano.id_notificacion ?? plano.id ?? null,
        tipo: String(tipo),
        id_comunicado: plano.id_comunicado ?? null,
        titulo: plano.titulo ?? String(titulo),
        cuerpo: plano.cuerpo ?? cuerpo ?? null,
      },
      { id_usuario: Number(plano.id_usuario) },
    );
  }

  return { creadas: filas.length };
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

/** Marca como leídas todas las notificaciones del usuario. */
export async function marcarTodasLeidas(idUsuario) {
  const id = Number(idUsuario);
  if (!id) throw new ErrorHandler(400, "El destinatario es obligatorio");
  const [actualizadas] = await Notificacion.update(
    { leida: true },
    { where: { id_usuario: id, leida: false } },
  );
  return { actualizadas };
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
