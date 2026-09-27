/**
 * Utilidades puras para la configuración de permisos de las rutas.
 *
 * Regla de seguridad: un endpoint NUNCA debe quedar abierto por olvido.
 * - Se exige un permiso explícito (string o array de strings).
 * - Si el endpoint sólo necesita autenticación, se marca explícitamente con
 *   `SOLO_AUTENTICADO`.
 * - Cualquier otro valor (undefined, array vacío, tipos raros) es un error de
 *   configuración y el middleware responde 500 en lugar de dejar pasar.
 */

export const SOLO_AUTENTICADO = Symbol("solo-autenticado");

/**
 * Normaliza el parámetro recibido por `comprobarPermiso`.
 * @param {string|string[]|symbol|undefined|null} permisoRequerido
 * @returns {string[]|null} Lista de permisos (vacía = sólo autenticación) o null si la config es inválida
 */
export function normalizarListaPermisos(permisoRequerido) {
  if (permisoRequerido === SOLO_AUTENTICADO) return [];

  if (typeof permisoRequerido === "string") {
    const limpio = permisoRequerido.trim();
    return limpio ? [limpio] : null;
  }

  if (Array.isArray(permisoRequerido)) {
    const lista = permisoRequerido
      .filter((p) => typeof p === "string" && p.trim())
      .map((p) => p.trim());
    return lista.length > 0 ? lista : null;
  }

  return null;
}
