import sequelize from "./conexionDB.js";

// Crea la tabla mensajes_whatsapp y los permisos whatsapp_* si la DB viva
// no los tiene. El volumen mysql persiste entre deploys, así que el init SQL
// no se re-ejecuta: sin esto, GET /api/comunidad/mensajes/* falla con
// ER_NO_SUCH_TABLE o 403 aunque gestion_tecnica2.sql ya incluya la tabla.
const PERMISOS_WHATSAPP = [
  "whatsapp_enviar",
  "whatsapp_ver_propio",
  "whatsapp_ver_todos",
  "whatsapp_gestionar",
];

async function ensureMensajesWhatsapp(intentos = 6) {
  const crearTabla = `
    CREATE TABLE IF NOT EXISTS \`mensajes_whatsapp\` (
      \`id_mensaje\`           int(11)      NOT NULL AUTO_INCREMENT,
      \`id_remitente\`          int(11)      DEFAULT NULL,
      \`id_destinatario\`       int(11)      DEFAULT NULL,
      \`telefono_destino\`      varchar(20)  NOT NULL,
      \`nombre_destinatario\`   varchar(200) DEFAULT NULL,
      \`cuerpo\`                text         NOT NULL,
      \`fecha_envio\`           datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`estado\`                ENUM('pendiente','enviado','fallido','leido') NOT NULL DEFAULT 'pendiente',
      \`waba_message_id\`       varchar(255) DEFAULT NULL,
      \`error_detalle\`         text         DEFAULT NULL,
      \`leido\`                 tinyint(1)   NOT NULL DEFAULT 0,
      \`fecha_lectura\`         datetime     DEFAULT NULL,
      PRIMARY KEY (\`id_mensaje\`),
      KEY \`idx_wpp_remitente\` (\`id_remitente\`),
      KEY \`idx_wpp_destinatario\` (\`id_destinatario\`),
      KEY \`idx_wpp_estado\` (\`estado\`),
      KEY \`idx_wpp_fecha\` (\`fecha_envio\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  const queries = [
    crearTabla,
    ...PERMISOS_WHATSAPP.map(
      (p) => `INSERT IGNORE INTO \`permisos\` (\`nombre_permiso\`) VALUES ('${p}')`,
    ),
    // Profesor (3) y preceptor (4): enviar + ver solo su historial propio.
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 3, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN ('whatsapp_enviar','whatsapp_ver_propio')`,
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 4, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN ('whatsapp_enviar','whatsapp_ver_propio')`,
    // Administrativo (7): supervisión global (solo lectura).
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 7, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN ('whatsapp_ver_todos')`,
    // Root (8): control total. Se mapea explícito porque estos permisos se
    // crean en runtime (DB viva con volumen persistente).
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 8, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN (
       'whatsapp_enviar','whatsapp_ver_propio','whatsapp_ver_todos','whatsapp_gestionar')`,
  ];

  for (let i = 1; i <= intentos; i++) {
    try {
      for (const sql of queries) {
        await sequelize.query(sql);
      }
      console.log("[SUCCESS] WhatsApp verificado (mensajes_whatsapp + permisos)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureMensajesWhatsapp intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureMensajesWhatsapp();

export default ensureMensajesWhatsapp;
