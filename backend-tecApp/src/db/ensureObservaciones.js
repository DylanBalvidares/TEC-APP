import sequelize from "./conexionDB.js";

async function ensureObservaciones(intentos = 6) {
  const crearTabla = `
    CREATE TABLE IF NOT EXISTS \`observaciones\` (
      \`id_observacion\` int(11)     NOT NULL AUTO_INCREMENT,
      \`id_alumno\`      int(11)     NOT NULL,
      \`texto\`          text        NOT NULL,
      \`fecha\`          date        NOT NULL,
      \`registrado_por\` int(11)     DEFAULT NULL,
      PRIMARY KEY (\`id_observacion\`),
      KEY \`idx_obs_alumno\` (\`id_alumno\`),
      KEY \`idx_obs_fecha\` (\`fecha\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  for (let i = 1; i <= intentos; i++) {
    try {
      await sequelize.query(crearTabla);
      console.log("[SUCCESS] Convivencia verificada (tabla observaciones)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureObservaciones intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureObservaciones();

export default ensureObservaciones;
