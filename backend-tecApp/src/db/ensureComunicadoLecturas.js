import sequelize from "./conexionDB.js";

// Confirmaciones de lectura de comunicados: marca (id_comunicado, id_usuario)
// única, idempotente.
async function ensureComunicadoLecturas(intentos = 6) {
  const tablas = [
    `CREATE TABLE IF NOT EXISTS \`comunicado_lecturas\` (
      \`id_lectura\`     int(11)  NOT NULL AUTO_INCREMENT,
      \`id_comunicado\`  int(11)  NOT NULL,
      \`id_usuario\`     int(11)  NOT NULL,
      \`leida_en\`       datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id_lectura\`),
      UNIQUE KEY \`uq_lectura_comunicado_usuario\` (\`id_comunicado\`, \`id_usuario\`),
      KEY \`idx_lectura_comunicado\` (\`id_comunicado\`),
      KEY \`idx_lectura_usuario\` (\`id_usuario\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
  ];

  for (let i = 1; i <= intentos; i++) {
    try {
      for (const sql of tablas) {
        await sequelize.query(sql);
      }
      console.log("[SUCCESS] Comunicado lecturas verificada (confirmaciones de lectura)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureComunicadoLecturas intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureComunicadoLecturas();

export default ensureComunicadoLecturas;
