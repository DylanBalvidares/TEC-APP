import sequelize from "./conexionDB.js";

// Parámetros institucionales y del ciclo lectivo con valores iniciales.
const VALORES_INICIALES = [
  ["institucion_nombre", "Escuela Técnica N°2", "Nombre de la institución"],
  ["institucion_direccion", "", "Dirección de la institución"],
  ["institucion_telefono", "", "Teléfono de contacto"],
  ["institucion_email", "", "Email institucional"],
  ["ciclo_lectivo_anio", String(new Date().getFullYear()), "Año del ciclo lectivo vigente"],
  ["ciclo_lectivo_inicio", "", "Inicio del ciclo lectivo (AAAA-MM-DD)"],
  ["ciclo_lectivo_fin", "", "Fin del ciclo lectivo (AAAA-MM-DD)"],
];

async function ensureConfiguracion(intentos = 6) {
  const crearTabla = `
    CREATE TABLE IF NOT EXISTS \`configuracion\` (
      \`clave\`                 varchar(100) NOT NULL,
      \`valor\`                 text         NOT NULL,
      \`descripcion\`           varchar(255) DEFAULT NULL,
      \`fecha_actualizacion\`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`clave\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
  `;

  for (let i = 1; i <= intentos; i++) {
    try {
      await sequelize.query(crearTabla);
      for (const [clave, valor, descripcion] of VALORES_INICIALES) {
        await sequelize.query(
          "INSERT IGNORE INTO `configuracion` (`clave`, `valor`, `descripcion`) VALUES (?, ?, ?)",
          { replacements: [clave, valor, descripcion] },
        );
      }
      console.log("[SUCCESS] Configuración verificada (tabla configuracion)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureConfiguracion intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureConfiguracion();

export default ensureConfiguracion;
