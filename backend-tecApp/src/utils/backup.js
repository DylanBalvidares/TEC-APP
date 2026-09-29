import crypto from "node:crypto";

// Serializador de backups (E9). Puro y sin DB: recibe { tabla, filas } y
// produce un documento versionado con checksum SHA-256 para verificar la
// restauración.

export const VERSION_BACKUP = 1;

export function serializarBackup(tablas = {}, fecha = new Date().toISOString()) {
  const documento = {
    version: VERSION_BACKUP,
    fecha,
    tablas: Object.fromEntries(
      Object.entries(tablas).map(([tabla, filas]) => [tabla, Array.isArray(filas) ? filas : []]),
    ),
  };
  const cuerpo = JSON.stringify(documento);
  const checksum = crypto.createHash("sha256").update(cuerpo).digest("hex");
  return { ...documento, checksum };
}

export function verificarBackup(documento) {
  if (!documento || typeof documento !== "object") {
    return { ok: false, error: "Documento inválido" };
  }
  if (documento.version !== VERSION_BACKUP) {
    return { ok: false, error: `Versión no soportada: ${documento.version}` };
  }
  if (!documento.checksum || !documento.tablas || typeof documento.tablas !== "object") {
    return { ok: false, error: "Falta checksum o tablas" };
  }
  const { checksum, ...resto } = documento;
  const esperado = crypto.createHash("sha256").update(JSON.stringify(resto)).digest("hex");
  if (esperado !== checksum) {
    return { ok: false, error: "Checksum inválido: el backup está corrupto o fue alterado" };
  }
  const totalFilas = Object.values(resto.tablas).reduce(
    (acc, filas) => acc + (Array.isArray(filas) ? filas.length : 0),
    0,
  );
  return { ok: true, tablas: Object.keys(resto.tablas), totalFilas, fecha: resto.fecha };
}
