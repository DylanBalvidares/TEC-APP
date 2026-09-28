// Regla pura de visibilidad de convivencia (E4).
// Define qué legajos puede ver cada actor sin tocar la DB; los controllers
// la usan para filtrar antes de responder.

export const VISIBILIDAD = Object.freeze({
  TODO: "todo",
  PROPIO: "propio",
  NADA: "nada",
});

/**
 * @param {{ id_rol: number, esRoot: boolean }} actor
 * @param {string} entidad - "sancion" | "observacion"
 * @returns {string} VISIBILIDAD
 *
 * - root y roles con gestión (preceptor/administrativo) ven todo su ámbito;
 * - profesor y tutor ven lo propio (sus cursos / su hijo);
 * - el resto no ve nada.
 */
export function visibilidadConvivencia(actor = {}, entidad = "sancion") {
  const rol = Number(actor?.id_rol);
  if (actor?.esRoot || rol === 8) return VISIBILIDAD.TODO;
  // Gestión integral: preceptor (4) y administrativo (7).
  if (rol === 4 || rol === 7) return VISIBILIDAD.TODO;
  // Vista propia: profesor (3), tutor (6), alumno (1), delegado (2).
  if ([1, 2, 3, 6].includes(rol)) return VISIBILIDAD.PROPIO;
  return VISIBILIDAD.NADA;
}
