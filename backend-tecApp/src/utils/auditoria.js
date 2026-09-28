import Auditoria from "../db/models/auditoria-model.js";

// Campos que nunca se persisten en claro en la auditoría.
const CAMPOS_SENSIBLES = new Set([
  "contrasena",
  "password",
  "contrasenia",
  "token",
  "codigo",
  "codigo_verificacion",
]);

export function sanearAuditoria(valor) {
  if (Array.isArray(valor)) return valor.map(sanearAuditoria);
  if (valor && typeof valor === "object") {
    if (typeof valor.toJSON === "function") {
      try {
        return sanearAuditoria(valor.toJSON());
      } catch {
        return null;
      }
    }
    const copia = {};
    for (const [clave, v] of Object.entries(valor)) {
      copia[clave] = CAMPOS_SENSIBLES.has(clave) ? "[REDACTED]" : sanearAuditoria(v);
    }
    return copia;
  }
  return valor;
}

/**
 * Registra un cambio en la tabla auditoria. Nunca lanza: la auditoría no
 * puede romper una escritura de negocio.
 */
export async function registrarAuditoria({
  id_usuario = null,
  accion,
  entidad,
  id_entidad = null,
  antes = null,
  despues = null,
  ip = null,
}) {
  try {
    if (!accion || !entidad) return null;
    return await Auditoria.create({
      id_usuario: id_usuario === undefined ? null : id_usuario,
      accion: String(accion),
      entidad: String(entidad),
      id_entidad: id_entidad === undefined ? null : id_entidad,
      datos_antes: antes ? sanearAuditoria(antes) : null,
      datos_despues: despues ? sanearAuditoria(despues) : null,
      ip: ip ? String(ip).slice(0, 45) : null,
    });
  } catch (error) {
    console.error("[ERROR] No se pudo registrar auditoría:", error.message);
    return null;
  }
}

/**
 * Atajo para routers: deriva actor e IP del request.
 * Uso: await auditarEscritura(req, { accion: "crear", entidad: "usuario", id_entidad, despues: req.body })
 */
export async function auditarEscritura(req, { accion, entidad, id_entidad = null, antes = null, despues = null }) {
  return registrarAuditoria({
    id_usuario: req.headers?.["id_usuario"] ?? null,
    accion,
    entidad,
    id_entidad,
    antes,
    despues,
    ip: req.ip ?? null,
  });
}
