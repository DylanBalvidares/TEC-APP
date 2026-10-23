import sequelize from "./conexionDB.js";

async function ensureNotificaciones(intentos = 6) {
  const tablas = [
    `CREATE TABLE IF NOT EXISTS \`notificaciones\` (
      \`id_notificacion\` int(11)      NOT NULL AUTO_INCREMENT,
      \`id_usuario\`      int(11)      NOT NULL,
      \`tipo\`            varchar(50)  NOT NULL,
      \`id_comunicado\`  int(11)      DEFAULT NULL,
      \`titulo\`          varchar(200) NOT NULL,
      \`cuerpo\`          text         DEFAULT NULL,
      \`leida\`           tinyint(1)   NOT NULL DEFAULT 0,
      \`fecha\`           datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id_notificacion\`),
      KEY \`idx_not_usuario\` (\`id_usuario\`),
      KEY \`idx_not_leida\` (\`leida\`),
      KEY \`idx_not_fecha\` (\`fecha\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
    `CREATE TABLE IF NOT EXISTS \`notificacion_preferencias\` (
      \`id_usuario\` int(11) NOT NULL,
      \`canales\`    json    NOT NULL,
      PRIMARY KEY (\`id_usuario\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  ];

  for (let i = 1; i <= intentos; i++) {
    try {
      for (const sql of tablas) {
        await sequelize.query(sql);
      }
      const [columnas] = await sequelize.query(
        "SHOW COLUMNS FROM `notificaciones` LIKE 'id_comunicado'",
      );
      if (columnas.length === 0) {
        await sequelize.query(
          "ALTER TABLE `notificaciones` ADD COLUMN `id_comunicado` int(11) DEFAULT NULL AFTER `tipo`",
        );
      }
      // Vincula avisos existentes cuando su título y extracto identifican de
      // forma exacta un comunicado publicado cerca de la fecha del aviso.
      await sequelize.query(
        `UPDATE \`notificaciones\` n
         INNER JOIN \`comunicados\` c
           ON n.\`tipo\` = 'comunicado'
          AND n.\`titulo\` = LEFT(c.\`titulo\`, 200)
          AND n.\`cuerpo\` <=> LEFT(c.\`mensaje\`, 300)
          AND n.\`fecha\` BETWEEN c.\`fecha_publicacion\` - INTERVAL 2 MINUTE
                               AND c.\`fecha_publicacion\` + INTERVAL 2 MINUTE
         SET n.\`id_comunicado\` = c.\`id_comunicado\`
         WHERE n.\`id_comunicado\` IS NULL`,
      );
      console.log("[SUCCESS] Notificaciones verificadas (tablas + preferencias)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureNotificaciones intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureNotificaciones();

export default ensureNotificaciones;
