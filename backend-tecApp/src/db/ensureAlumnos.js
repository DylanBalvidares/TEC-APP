import sequelize from "./conexionDB.js";

// Agrega la columna email al legajo de alumnos si la DB viva no la tiene.
// El volumen mysql persiste entre deploys, así que el init SQL no se
// re-ejecuta: sin esto, el email ingresado por el preceptor al crear/editar
// un alumno se descarta silenciosamente (Sequelize ignora el atributo) y
// POST /alumnos/enviar-email falla cuando el alumno no tiene cuenta de
// usuario asociada.
async function ensureAlumnos(intentos = 6) {
  // SHOW COLUMNS LIKE es el patrón usado por ensureBoletines (ver id_plan).
  for (let i = 1; i <= intentos; i++) {
    try {
      const [columnas] = await sequelize.query(
        "SHOW COLUMNS FROM `alumnos` LIKE 'email'",
      );
      if (!columnas.length) {
        await sequelize.query(
          "ALTER TABLE `alumnos` ADD COLUMN `email` varchar(150) DEFAULT NULL AFTER `domicilio`",
        );
        console.log("[SUCCESS] Columna alumnos.email agregada");
      } else {
        console.log("[SUCCESS] Alumnos verificados (columna email presente)");
      }
      return;
    } catch (error) {
      console.error(
        `[ERROR] ensureAlumnos intento ${i}/${intentos}:`,
        error.message,
      );
      if (i < intentos) {
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  }
}

ensureAlumnos();

export default ensureAlumnos;
