import sequelize from "./conexionDB.js";

// Crea las tablas de planes de estudio, la columna cursos.anio y los
// permisos de planes si la DB viva no los tiene. El volumen mysql persiste
// entre deploys, así que el init SQL no se re-ejecuta: sin esto, las rutas
// /api/academico/planes/* fallan en DBs creadas antes de esta feature.
async function ensurePlanesEstudio(intentos = 6) {
  const crearPlanes = `
    CREATE TABLE IF NOT EXISTS \`planes_estudio\` (
      \`id_plan\`               int(11)      NOT NULL AUTO_INCREMENT,
      \`nombre\`                varchar(150) NOT NULL,
      \`codigo\`                varchar(30)  NOT NULL,
      \`orientacion\`           varchar(100) NOT NULL,
      \`descripcion\`           text         DEFAULT NULL,
      \`duracion_anios\`        tinyint unsigned DEFAULT NULL,
      \`estado\`                ENUM('borrador','vigente','historico') NOT NULL DEFAULT 'borrador',
      \`fecha_vigencia_desde\`  date         DEFAULT NULL,
      \`fecha_vigencia_hasta\`  date         DEFAULT NULL,
      PRIMARY KEY (\`id_plan\`),
      UNIQUE KEY \`uq_plan_nombre\` (\`nombre\`),
      UNIQUE KEY \`uq_plan_codigo\` (\`codigo\`),
      KEY \`idx_plan_orientacion\` (\`orientacion\`),
      KEY \`idx_plan_estado\` (\`estado\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const crearPlanMaterias = `
    CREATE TABLE IF NOT EXISTS \`plan_materias\` (
      \`id_plan_materia\` int(11) NOT NULL AUTO_INCREMENT,
      \`id_plan\`         int(11) NOT NULL,
      \`id_materia\`      int(11) NOT NULL,
      \`anio\`            tinyint unsigned NOT NULL,
      \`cuatrimestre\`    ENUM('anual','1','2') NOT NULL DEFAULT 'anual',
      PRIMARY KEY (\`id_plan_materia\`),
      UNIQUE KEY \`uq_plan_materia_anio\` (\`id_plan\`,\`id_materia\`,\`anio\`),
      KEY \`idx_pm_plan\` (\`id_plan\`),
      KEY \`idx_pm_materia\` (\`id_materia\`),
      CONSTRAINT \`fk_pm_plan\`    FOREIGN KEY (\`id_plan\`)    REFERENCES \`planes_estudio\`(\`id_plan\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_pm_materia\` FOREIGN KEY (\`id_materia\`) REFERENCES \`materias\`(\`id_materia\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const crearCorrelativas = `
    CREATE TABLE IF NOT EXISTS \`correlativas\` (
      \`id_correlativa\`      int(11) NOT NULL AUTO_INCREMENT,
      \`id_plan_materia\`     int(11) NOT NULL,
      \`id_plan_materia_req\` int(11) NOT NULL,
      PRIMARY KEY (\`id_correlativa\`),
      UNIQUE KEY \`uq_correlativa\` (\`id_plan_materia\`,\`id_plan_materia_req\`),
      KEY \`idx_corr_pm\` (\`id_plan_materia\`),
      CONSTRAINT \`fk_corr_pm\`     FOREIGN KEY (\`id_plan_materia\`)     REFERENCES \`plan_materias\`(\`id_plan_materia\`) ON DELETE CASCADE,
      CONSTRAINT \`fk_corr_pm_req\` FOREIGN KEY (\`id_plan_materia_req\`) REFERENCES \`plan_materias\`(\`id_plan_materia\`) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `;

  const permisos = [
    "administrativo_ver_planes",
    "administrativo_crear_plan",
    "administrativo_editar_plan",
    "administrativo_eliminar_plan",
    "profesor_ver_planes",
    "preceptor_ver_planes",
  ];
  const queriesEstaticas = [
    crearPlanes,
    crearPlanMaterias,
    crearCorrelativas,
    ...permisos.map(
      (p) => `INSERT IGNORE INTO \`permisos\` (\`nombre_permiso\`) VALUES ('${p}')`,
    ),
    // Gestión (administrativo=7, root=8)
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 7, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN (
       'administrativo_ver_planes','administrativo_crear_plan',
       'administrativo_editar_plan','administrativo_eliminar_plan')`,
    // Lectura por rol docente
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 3, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` = 'profesor_ver_planes'`,
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 4, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` = 'preceptor_ver_planes'`,
    // Root recibe TODOS los permisos en el SQL inicial, pero como estos se
    // crean en runtime hay que mapeárselos explícitamente.
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 8, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN (
       'administrativo_ver_planes','administrativo_crear_plan',
       'administrativo_editar_plan','administrativo_eliminar_plan',
       'profesor_ver_planes','preceptor_ver_planes')`,
    // Plan de ejemplo (solo si no existe ninguno con ese código)
    `INSERT IGNORE INTO \`planes_estudio\`
       (\`nombre\`, \`codigo\`, \`orientacion\`, \`descripcion\`, \`duracion_anios\`, \`estado\`)
     VALUES
       ('Ciclo Básico', 'CB-2026', 'Ciclo Básico',
        'Plan de ejemplo: materias troncales de 1º a 3º año.', 3, 'vigente')`,
  ];

  for (let i = 1; i <= intentos; i++) {
    try {
      for (const sql of queriesEstaticas) {
        await sequelize.query(sql);
      }
      // Columna cursos.anio (sin IF NOT EXISTS en MySQL: se chequea antes).
      const [cols] = await sequelize.query(
        `SELECT COUNT(*) AS n FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cursos' AND COLUMN_NAME = 'anio'`,
      );
      if (!cols?.[0]?.n) {
        await sequelize.query(
          "ALTER TABLE `cursos` ADD COLUMN `anio` tinyint unsigned DEFAULT NULL AFTER `ciclo_lectivo`",
        );
      }
      // Backfill: el dígito inicial del nombre ("1º Año"→1, "6º B - ..."→6).
      // REGEXP_SUBSTR evita el error de CAST directo en modo estricto.
      await sequelize.query(
        `UPDATE \`cursos\` SET \`anio\` = CAST(REGEXP_SUBSTR(\`nombre_curso\`, '^[0-9]+') AS UNSIGNED)
         WHERE \`anio\` IS NULL
           AND CAST(REGEXP_SUBSTR(\`nombre_curso\`, '^[0-9]+') AS UNSIGNED) BETWEEN 1 AND 7`,
      );
      console.log("[SUCCESS] Planes de estudio verificados (tablas + cursos.anio + permisos)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensurePlanesEstudio intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensurePlanesEstudio();

export default ensurePlanesEstudio;
