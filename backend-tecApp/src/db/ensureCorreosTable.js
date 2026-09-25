import sequelize from "./conexionDB.js";

// Crea la tabla del historial de emails si la DB viva no la tiene.
// El volumen mysql persiste entre deploys, así que el init SQL no se
// re-ejecuta: sin esto, GET /api/comunidad/monitoreo falla con
// ER_NO_SUCH_TABLE aunque el seed ya incluya la tabla.
async function ensureCorreosTable(intentos = 6) {
  const sql = `
    CREATE TABLE IF NOT EXISTS \`correos_enviados\` (
      \`id_correo\`       int(11)      NOT NULL AUTO_INCREMENT,
      \`id_remitente\`    int(11)      DEFAULT NULL,
      \`id_destinatario\` int(11)      DEFAULT NULL,
      \`email_destino\`   varchar(255) NOT NULL,
      \`asunto\`          varchar(255) NOT NULL,
      \`cuerpo\`          text         NOT NULL,
      \`fecha_envio\`     datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`estado\`          ENUM('enviado','fallido') NOT NULL DEFAULT 'enviado',
      \`message_id\`      varchar(255) DEFAULT NULL,
      \`leido\`           tinyint(1)   NOT NULL DEFAULT 0,
      \`fecha_lectura\`   datetime     DEFAULT NULL,
      PRIMARY KEY (\`id_correo\`),
      KEY \`idx_correo_fecha\`  (\`fecha_envio\`),
      KEY \`idx_correo_estado\` (\`estado\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  for (let i = 1; i <= intentos; i++) {
    try {
      await sequelize.query(sql);
      console.log("[SUCCESS] Tabla correos_enviados verificada");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureCorreosTable intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureCorreosTable();

export default ensureCorreosTable;
