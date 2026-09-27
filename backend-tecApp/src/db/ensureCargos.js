import sequelize from "./conexionDB.js";

// Inserta los permisos de cargos si la DB viva no los tiene. El volumen mysql
// persiste entre deploys, así que el init SQL no se re-ejecuta: sin esto, un
// administrativo o root recién desplegado recibe 403 en /api/academico/cargos.
const PERMISOS_CARGOS = ["administrativo_ver_cargos", "root_gestionar_cargos"];

async function ensureCargos(intentos = 6) {
  const queries = [
    ...PERMISOS_CARGOS.map(
      (p) => `INSERT IGNORE INTO \`permisos\` (\`nombre_permiso\`) VALUES ('${p}')`,
    ),
    // Administrativo (7): sólo lectura del catálogo.
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 7, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` = 'administrativo_ver_cargos'`,
    // Root (8): lectura y gestión. Explícito porque estos permisos nacen en
    // runtime y el seed "todos los permisos" no se re-ejecuta.
    `INSERT IGNORE INTO \`rol_permisos\` (\`id_rol\`, \`id_permiso\`)
     SELECT 8, id_permiso FROM \`permisos\` WHERE \`nombre_permiso\` IN (
       'administrativo_ver_cargos','root_gestionar_cargos')`,
  ];

  for (let i = 1; i <= intentos; i++) {
    try {
      for (const sql of queries) {
        await sequelize.query(sql);
      }
      console.log("[SUCCESS] Cargos verificado (permisos administrativo_ver / root_gestionar)");
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureCargos intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureCargos();

export default ensureCargos;
