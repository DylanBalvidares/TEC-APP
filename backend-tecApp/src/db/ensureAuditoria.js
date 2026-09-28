import sequelize from "./conexionDB.js";

// Crea la tabla auditoria si la DB viva no la tiene (el volumen mysql
// persiste entre deploys y el init SQL no se re-ejecuta).
async function ensureAuditoria(intentos = 6) {
  const crearTabla = `
    CREATE TABLE IF NOT EXISTS \`auditoria\` (
      \`id_auditoria\`  int(11)      NOT NULL AUTO_INCREMENT,
      \`id_usuario\`    int(11)      DEFAULT NULL,
      \`accion\`        varchar(30)  NOT NULL,
      \`entidad\`       varchar(50)  NOT NULL,
      \`id_entidad\`    int(11)      DEFAULT NULL,
      \`datos_antes\`   json         DEFAULT NULL,
      \`datos_despues\` json         DEFAULT NULL,
      \`ip\`            varchar(45)  DEFAULT NULL,
      \`fecha\`         datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id_auditoria\`),
      KEY \`idx_aud_entidad\` (\`entidad\`),
      KEY \`idx_aud_accion\` (\`accion\`),
      KEY \`idx_aud_usuario\` (\`id_usuario\`),
      KEY \`idx_aud_fecha\` (\`fecha\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  for (let i = 1; i <= intentos; i++) {
    try {
      await sequelize.query(crearTabla);
      console.log("[SUCCESS] Auditoría verificada (tabla auditoria)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureAuditoria intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureAuditoria();

export default ensureAuditoria;
