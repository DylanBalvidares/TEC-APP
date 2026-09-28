import sequelize from "./conexionDB.js";

const PERMISOS_HORARIOS = ["horario_ver", "horario_gestionar"];

async function ensureHorarios(intentos = 6) {
  const crearTabla = `
    CREATE TABLE IF NOT EXISTS \`horarios\` (
      \`id_horario\`    int(11)     NOT NULL AUTO_INCREMENT,
      \`id_asignacion\` int(11)     NOT NULL,
      \`dia\`           tinyint     NOT NULL,
      \`hora_inicio\`   varchar(5)  NOT NULL,
      \`hora_fin\`      varchar(5)  NOT NULL,
      \`aula\`          varchar(50) DEFAULT NULL,
      PRIMARY KEY (\`id_horario\`),
      KEY \`idx_hor_asignacion\` (\`id_asignacion\`),
      KEY \`idx_hor_dia\` (\`dia\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  const queries = [
    crearTabla,
    ...PERMISOS_HORARIOS.map(
      (p) => `INSERT IGNORE INTO \`permisos\` (\`nombre_permiso\`) VALUES ('${p}')`,
    ),
    // Lectura: alumno (1), profesor (3), preceptor (4), administrativo (7) y root (8).
    ...[1, 3, 4, 7, 8].map(
      (rol) => `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
       SELECT ${rol}, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` = 'horario_ver'`,
    ),
    // Gestión: administrativo (7) y root (8).
    ...[7, 8].map(
      (rol) => `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
       SELECT ${rol}, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` = 'horario_gestionar'`,
    ),
  ];

  for (let i = 1; i <= intentos; i++) {
    try {
      for (const sql of queries) {
        await sequelize.query(sql);
      }
      console.log("[SUCCESS] Horarios verificados (tabla horarios + permisos)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureHorarios intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureHorarios();

export default ensureHorarios;
