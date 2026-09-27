/**
 * Derivación del rol para el auto-registro.
 *
 * SEGURIDAD: el rol NUNCA debe tomarse del body que envía el cliente.
 * Sólo se acepta el rol asociado al padrón (`rol_asociado` del código de
 * verificación). Los roles privilegiados (root, administrativo por vía del
 * cliente) no son auto-asignables.
 */

/** IDs de rol del sistema (seed de la base de datos). */
export const ROLES_SISTEMA = Object.freeze({
  ALUMNO: 1,
  DELEGADO: 2,
  PROFESOR: 3,
  PRECEPTOR: 4,
  BIBLIOTECARIO: 5,
  TUTOR: 6,
  ADMINISTRATIVO: 7,
  ROOT: 8,
});

/**
 * Roles que el padrón puede otorgar en el auto-registro.
 * Deliberadamente NO incluye root.
 */
const ROLES_PADRON = Object.freeze({
  alumno: ROLES_SISTEMA.ALUMNO,
  profesor: ROLES_SISTEMA.PROFESOR,
  administrativo: ROLES_SISTEMA.ADMINISTRATIVO,
});

/**
 * @param {string|null|undefined} rolAsociado - rol del padrón (ej. "alumno")
 * @returns {number|null} id de rol válido o null si no se puede determinar
 */
export function derivarRolDesdePadron(rolAsociado) {
  if (!rolAsociado) return null;
  const clave = String(rolAsociado).trim().toLowerCase();
  return ROLES_PADRON[clave] ?? null;
}
