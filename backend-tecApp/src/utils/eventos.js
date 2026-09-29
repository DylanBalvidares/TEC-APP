// Emisor de eventos en memoria para SSE (E13): colas (correo/WhatsApp) y
// aviso de edición concurrente. Puro salvo el set de suscriptores.

const suscriptores = new Set();

/**
 * @param {Object} destino - { write(res), end(res) } mínimo para testear sin HTTP
 */
export function suscribir(destino) {
  suscriptores.add(destino);
  return () => suscriptores.delete(destino);
}

export function cantidadSuscriptores() {
  return suscriptores.size;
}

export function emitir(tipo, datos = {}) {
  const evento = { tipo, datos, fecha: new Date().toISOString() };
  for (const destino of [...suscriptores]) {
    try {
      destino.write(evento);
    } catch {
      suscriptores.delete(destino);
    }
  }
  return evento;
}

export function limpiarSuscriptores() {
  suscriptores.clear();
}
