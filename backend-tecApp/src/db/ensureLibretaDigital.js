import sequelize from "./conexionDB.js";

// Crea la tabla historial_notas y el permiso preceptor_ver_notas si la DB
// viva no los tiene. El volumen mysql persiste entre deploys, así que el
// init SQL no se re-ejecuta: sin esto, GET /api/academico/notas/* falla con
// ER_NO_SUCH_TABLE o 403 aunque gestion_tecnica2.sql ya incluya la tabla.
async function ensureLibretaDigital(intentos = 6) {
  const crearTabla = `
    CREATE TABLE IF NOT EXISTS \`historial_notas\` (
      \`id_historial\`          int(11)      NOT NULL AUTO_INCREMENT,
      \`id_nota\`               int(11)      NOT NULL,
      \`id_alumno\`             int(11)      NOT NULL,
      \`id_asignacion\`         int(11)      NOT NULL,
      \`calificacion_anterior\` decimal(3,1) DEFAULT NULL,
      \`calificacion_nueva\`    decimal(3,1) NOT NULL,
      \`modificado_por\`        int(11)      NOT NULL,
      \`fecha_cambio\`          datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`motivo\`                varchar(255) DEFAULT NULL,
      PRIMARY KEY (\`id_historial\`),
      KEY \`idx_hist_nota\` (\`id_nota\`),
      KEY \`idx_hist_alumno\` (\`id_alumno\`),
      KEY \`idx_hist_asig\` (\`id_asignacion\`),
      KEY \`idx_hist_mod_por\` (\`modificado_por\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  const queries = [
    crearTabla,
    "INSERT IGNORE INTO `permisos` (`nombre_permiso`) VALUES ('preceptor_ver_notas')",
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 4, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` = 'preceptor_ver_notas'`,
    // Root (id_rol=8) recibe TODOS los permisos en el SQL inicial, pero como
    // este permiso se crea en runtime (DB viva con volumen persistente),
    // hay que mapeárselo explícitamente.
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 8, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` = 'preceptor_ver_notas'`,
  ];

  for (let i = 1; i <= intentos; i++) {
    try {
      for (const sql of queries) {
        await sequelize.query(sql);
      }
      console.log("[SUCCESS] Libreta Digital verificada (historial_notas + permiso)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureLibretaDigital intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureLibretaDigital();

export default ensureLibretaDigital;
