import sequelize from "./conexionDB.js";

// Crea las tablas de boletines cuatrimestrales y sus permisos si la DB viva
// no los tiene. El volumen mysql persiste entre deploys, así que el init SQL
// no se re-ejecuta: sin esto, GET /api/academico/boletines/* falla con
// ER_NO_SUCH_TABLE o 403 aunque gestion_tecnica2.sql ya incluya las tablas.
async function ensureBoletines(intentos = 6) {
  const crearPeriodos = `
    CREATE TABLE IF NOT EXISTS \`periodos_boletin\` (
      \`id_periodo\`     int(11) NOT NULL AUTO_INCREMENT,
      \`ciclo_lectivo\`  int(11) NOT NULL,
      \`cuatrimestre\`   ENUM('1','2') NOT NULL,
      \`fecha_inicio\`   date NOT NULL,
      \`fecha_cierre\`   date NOT NULL,
      \`estado\`         ENUM('programado','abierto','cerrado') NOT NULL DEFAULT 'programado',
      \`createdAt\`      datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\`      datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id_periodo\`),
      UNIQUE KEY \`uq_periodo_ciclo_cuatri\` (\`ciclo_lectivo\`,\`cuatrimestre\`),
      KEY \`idx_periodo_estado\` (\`estado\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const crearMaterias = `
    CREATE TABLE IF NOT EXISTS \`boletin_materias\` (
      \`id_boletin_materia\` int(11) NOT NULL AUTO_INCREMENT,
      \`id_periodo\`    int(11) NOT NULL,
      \`id_curso\`      int(11) NOT NULL,
      \`id_asignacion\` int(11) NOT NULL,
      \`id_materia\`    int(11) NOT NULL,
      \`id_profesor\`   int(11) NOT NULL,
      \`id_plan\`       int(11) DEFAULT NULL,
      \`createdAt\`     datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\`     datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id_boletin_materia\`),
      UNIQUE KEY \`uq_bm_periodo_asig\` (\`id_periodo\`,\`id_asignacion\`),
      KEY \`idx_bm_periodo_curso\` (\`id_periodo\`,\`id_curso\`),
      CONSTRAINT \`fk_bm_periodo\`     FOREIGN KEY (\`id_periodo\`)    REFERENCES \`periodos_boletin\`(\`id_periodo\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_bm_curso\`       FOREIGN KEY (\`id_curso\`)      REFERENCES \`cursos\`(\`id_curso\`),
      CONSTRAINT \`fk_bm_asignacion\`  FOREIGN KEY (\`id_asignacion\`) REFERENCES \`asignaciones\`(\`id_asignacion\`),
      CONSTRAINT \`fk_bm_materia\`     FOREIGN KEY (\`id_materia\`)    REFERENCES \`materias\`(\`id_materia\`),
      CONSTRAINT \`fk_bm_profesor\`    FOREIGN KEY (\`id_profesor\`)   REFERENCES \`profesores\`(\`id_profesor\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const crearCalificaciones = `
    CREATE TABLE IF NOT EXISTS \`boletin_calificaciones\` (
      \`id_boletin_nota\` int(11) NOT NULL AUTO_INCREMENT,
      \`id_periodo\`    int(11) NOT NULL,
      \`id_asignacion\` int(11) NOT NULL,
      \`id_alumno\`     int(11) NOT NULL,
      \`tipo\`          ENUM('numerica','TED','TEP','TEA','sin_calificar') NOT NULL,
      \`valor\`         decimal(3,1) DEFAULT NULL,
      \`motivo\`        text DEFAULT NULL,
      \`createdAt\`     datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\`     datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id_boletin_nota\`),
      UNIQUE KEY \`uq_bc_periodo_asig_alumno\` (\`id_periodo\`,\`id_asignacion\`,\`id_alumno\`),
      KEY \`idx_bc_periodo_asig\` (\`id_periodo\`,\`id_asignacion\`),
      CONSTRAINT \`fk_bc_periodo\`    FOREIGN KEY (\`id_periodo\`)    REFERENCES \`periodos_boletin\`(\`id_periodo\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_bc_asignacion\` FOREIGN KEY (\`id_asignacion\`) REFERENCES \`asignaciones\`(\`id_asignacion\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_bc_alumno\`     FOREIGN KEY (\`id_alumno\`)     REFERENCES \`alumnos\`(\`id_alumno\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const crearFinalizaciones = `
    CREATE TABLE IF NOT EXISTS \`boletin_finalizaciones\` (
      \`id_finalizacion\`    int(11) NOT NULL AUTO_INCREMENT,
      \`id_periodo\`         int(11) NOT NULL,
      \`id_asignacion\`      int(11) NOT NULL,
      \`estado\`             ENUM('pendiente','en_progreso','finalizada') NOT NULL DEFAULT 'pendiente',
      \`finalizado_por\`     int(11) DEFAULT NULL,
      \`fecha_finalizacion\` datetime DEFAULT NULL,
      \`createdAt\`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\`          datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id_finalizacion\`),
      UNIQUE KEY \`uq_bf_periodo_asig\` (\`id_periodo\`,\`id_asignacion\`),
      CONSTRAINT \`fk_bf_periodo\`    FOREIGN KEY (\`id_periodo\`)    REFERENCES \`periodos_boletin\`(\`id_periodo\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_bf_asignacion\` FOREIGN KEY (\`id_asignacion\`) REFERENCES \`asignaciones\`(\`id_asignacion\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const crearReaperturas = `
    CREATE TABLE IF NOT EXISTS \`boletin_reaperturas\` (
      \`id_reapertura\`    int(11) NOT NULL AUTO_INCREMENT,
      \`id_periodo\`       int(11) NOT NULL,
      \`id_asignacion\`    int(11) NOT NULL,
      \`motivo_solicitud\` text NOT NULL,
      \`estado\`           ENUM('pendiente','aprobada','rechazada') NOT NULL DEFAULT 'pendiente',
      \`solicitado_por\`   int(11) NOT NULL,
      \`decidido_por\`     int(11) DEFAULT NULL,
      \`motivo_decision\`  text DEFAULT NULL,
      \`fecha_solicitud\`  datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`fecha_decision\`   datetime DEFAULT NULL,
      \`createdAt\`        datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      \`updatedAt\`        datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id_reapertura\`),
      KEY \`idx_br_periodo_asig\` (\`id_periodo\`,\`id_asignacion\`),
      KEY \`idx_br_estado\` (\`estado\`),
      CONSTRAINT \`fk_br_periodo\`    FOREIGN KEY (\`id_periodo\`)    REFERENCES \`periodos_boletin\`(\`id_periodo\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_br_asignacion\` FOREIGN KEY (\`id_asignacion\`) REFERENCES \`asignaciones\`(\`id_asignacion\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const crearHistorial = `
    CREATE TABLE IF NOT EXISTS \`boletin_historial\` (
      \`id_boletin_historial\` int(11) NOT NULL AUTO_INCREMENT,
      \`id_periodo\`      int(11) NOT NULL,
      \`id_asignacion\`   int(11) NOT NULL,
      \`id_alumno\`       int(11) DEFAULT NULL,
      \`accion\`          varchar(60) NOT NULL,
      \`valor_anterior\`  varchar(20) DEFAULT NULL,
      \`valor_nuevo\`     varchar(20) DEFAULT NULL,
      \`modificado_por\`  int(11) NOT NULL,
      \`motivo\`          varchar(255) DEFAULT NULL,
      \`fecha_cambio\`    datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id_boletin_historial\`),
      KEY \`idx_bh_periodo_asig\` (\`id_periodo\`,\`id_asignacion\`),
      KEY \`idx_bh_alumno\` (\`id_alumno\`),
      CONSTRAINT \`fk_bh_periodo\`    FOREIGN KEY (\`id_periodo\`)    REFERENCES \`periodos_boletin\`(\`id_periodo\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_bh_asignacion\` FOREIGN KEY (\`id_asignacion\`) REFERENCES \`asignaciones\`(\`id_asignacion\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const permisos = [
    "boletin_ver_periodos",
    "boletin_gestionar_periodos",
    "boletin_cargar",
    "boletin_finalizar",
    "boletin_solicitar_reapertura",
    "boletin_decidir_reapertura",
    "boletin_ver_planilla",
    "boletin_ver_consolidado",
    "boletin_ver_historial",
  ];
  const listaPermisos = permisos.map((p) => `'${p}'`).join(",");
  const queriesEstaticas = [
    crearPeriodos,
    crearMaterias,
    crearCalificaciones,
    crearFinalizaciones,
    crearReaperturas,
    crearHistorial,
    ...permisos.map(
      (p) => `INSERT IGNORE INTO \`permisos\` (\`nombre_permiso\`) VALUES ('${p}')`,
    ),
    // Profesor carga/finaliza/solicita y ve períodos e historial.
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 3, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN (
       'boletin_ver_periodos','boletin_cargar','boletin_finalizar',
       'boletin_solicitar_reapertura','boletin_ver_historial')`,
    // Preceptor: lectura de planillas/consolidados + períodos e historial.
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 4, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN (
       'boletin_ver_periodos','boletin_ver_planilla',
       'boletin_ver_consolidado','boletin_ver_historial')`,
    // Administrativo: gestiona períodos, decide reaperturas y supervisa.
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 7, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN (
       'boletin_ver_periodos','boletin_gestionar_periodos',
       'boletin_decidir_reapertura','boletin_ver_planilla',
       'boletin_ver_consolidado','boletin_ver_historial')`,
    // Root recibe TODOS los permisos en el SQL inicial, pero como estos se
    // crean en runtime hay que mapeárselos explícitamente.
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 8, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN (${listaPermisos})`,
  ];

  for (let i = 1; i <= intentos; i++) {
    try {
      for (const sql of queriesEstaticas) {
        await sequelize.query(sql);
      }
      const [columnasMaterias] = await sequelize.query(
        "SHOW COLUMNS FROM `boletin_materias` LIKE 'id_plan'",
      );
      if (!columnasMaterias.length) {
        await sequelize.query(
          "ALTER TABLE `boletin_materias` ADD COLUMN `id_plan` int(11) DEFAULT NULL AFTER `id_profesor`",
        );
      }
      console.log("[SUCCESS] Boletines verificados (6 tablas + 9 permisos)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureBoletines intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureBoletines();

export default ensureBoletines;
