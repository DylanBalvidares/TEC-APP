// Emisor de eventos en memoria para SSE (E13): colas (correo/WhatsApp),
// aviso de edición concurrente y notificaciones. Puro salvo el set de
// suscriptores.

const suscriptores = new Set();

/**
 * @param {Object} destino - { write(res), end(res) } mínimo para testear sin HTTP
 * @param {Object} [opciones] - { id_usuario } identidad del suscriptor (opcional).
 *   Se registra para poder hacer respuestas dirigidas: emitir() con id_usuario
 *   entrega el evento solo al dueño, y los demás suscriptores no lo ven.
 *   Sin identidad registrada se mantiene el comportamiento de difusión.
 * @returns {Function} desuscribir
 */
export function suscribir(destino, opciones = {}) {
  const entrada = {
    write: destino.write,
    end: destino.end,
    id_usuario:
      opciones.id_usuario === undefined || opciones.id_usuario === null
        ? null
        : Number(opciones.id_usuario),
  };
  suscriptores.add(entrada);
  return () => suscriptores.delete(entrada);
}

export function cantidadSuscriptores() {
  return suscriptores.size;
}

/**
 * @param {string} tipo
 * @param {Object} [datos]
 * @param {Object} [opciones] - { id_usuario } envío dirigido (opcional): solo
 *   lo recibe el suscriptor registrado con ese id. Sin opción, difusión a todos.
 */
export function emitir(tipo, datos = {}, opciones = {}) {
  const evento = { tipo, datos, fecha: new Date().toISOString() };
  const idObjetivo =
    opciones.id_usuario === undefined || opciones.id_usuario === null
      ? null
      : Number(opciones.id_usuario);
  for (const suscriptor of [...suscriptores]) {
    try {
      // Envío dirigido: si el evento es para un usuario concreto, solo recibe
      // quien se identificó con ese mismo id.
      if (idObjetivo && suscriptor.id_usuario !== idObjetivo) {
        continue;
      }
      suscriptor.write(evento);
    } catch {
      suscriptores.delete(suscriptor);
    }
  }
  return evento;
}

export function limpiarSuscriptores() {
  suscriptores.clear();
}
