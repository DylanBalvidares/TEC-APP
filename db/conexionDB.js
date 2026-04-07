import "dotenv";
import { Sequelize } from "sequelize";

console.log("=== URL:", process.env.DATABASE_URL);
console.log("=== DATABASE NAME:", process.env.DATABASE_NAME);
console.log("=== PASSWORD:", process.env.DATABASE_PASSWORD);

const sequelize = new Sequelize(
  "mysql://root:root_pass@mysql-db:3306/gestion_tecnica2",
  //process.env.DATABASE_NAME,
  //process.env.DATABASE_USER,
  //process.env.DATABASE_PASSWORD,
  //"mysql://root@mysql-db:3306/gestion_tecnica2",
  {
    dialect: "mysql",
    logging: console.log,
    define: {
      timestamps: false, //DESHABILITAR TIMESTAMPS(
      // campos automaticos que registran
      // cuando se creo o se actualizo la BD)
    },
  },
);

async function intentarConexion() {
  try {
    await sequelize.authenticate();
    console.log("=== ¡La conexion a la BD es CORRECTA! ===");
  } catch (error) {
    console.log(
      "=== ¡La conexion a la BD FALLO,REINTENTANDO...! ===->ERROR:",
      error,
    );
    setTimeout(intentarConexion, 5000);
  }
}

intentarConexion();

export default sequelize;
