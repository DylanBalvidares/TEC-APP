// Selección de canal por tipo de notificación (E7). Puro y testeable:
// combina el canal por defecto del tipo con las preferencias del usuario
// (cada tipo puede apagarse con `false`).

export const CANALES = Object.freeze(["panel", "email", "whatsapp"]);

// Canal por defecto según el tipo de evento.
const CANAL_POR_TIPO = Object.freeze({
  inasistencia: ["panel", "whatsapp"],
  reunion: ["panel", "email"],
  sancion: ["panel", "whatsapp"],
  nota: ["panel"],
  comunicado: ["panel", "email"],
  sistema: ["panel"],
});

/**
 * @param {string} tipo - tipo de evento
 * @param {Object} preferencias - { [tipo]: string[] | false }
 * @returns {string[]} canales efectivos (solo panel/email/whatsapp)
 */
export function seleccionarCanal(tipo, preferencias = {}) {
  if (Object.hasOwn(preferencias, tipo)) {
    const pref = preferencias[tipo];
    if (pref === false) return [];
    if (Array.isArray(pref)) {
      return pref.filter((c) => CANALES.includes(c));
    }
  }
  const defecto = CANAL_POR_TIPO[tipo] || ["panel"];
  return [...defecto];
}
