import "dotenv";
import { Sequelize } from "sequelize";

console.log("[DEBUG] DATABASE URL:", process.env.DATABASE_URL);
console.log("[DEBUG] DATABASE NAME:", process.env.DATABASE_NAME);
// console.log("[DEBUG] PASSWORD:", process.env.DATABASE_PASSWORD); // Oculto por seguridad

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "mysql",
  logging: console.log,
  define: {
    timestamps: false, //DESHABILITAR TIMESTAMPS(
    // campos automaticos que registran
    // cuando se creo o se actualizo la BD)
  },
});

async function intentarConexion() {
  try {
    await sequelize.authenticate();
    //sequelize.sync(); //===== NO DESCOMENTAR
    console.log("[INFO] ¡La conexion a la BD es CORRECTA!");
  } catch (error) {
    console.error("[ERROR] ¡La conexion a la BD FALLO, REINTENTANDO...! -> ERROR:", error);
    setTimeout(intentarConexion, 5000);
  }
}

intentarConexion();

export default sequelize;
