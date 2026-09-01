import "dotenv";
import { Sequelize } from "sequelize";

console.log("[DEBUG] Conectando a BD:", process.env.DATABASE_NAME || "gestion_tecnica2");

// Extraer credenciales desde la URL de conexión
// para poder usar parámetros individuales (necesario para que dialectOptions funcione)
const url = new URL(process.env.DATABASE_URL);
const DB_CONFIG = {
  database: url.pathname.split("/").filter(Boolean)[0] || "gestion_tecnica2",
  username: url.username || "root",
  password: url.password || "root_pass",
  host: url.hostname || "localhost",
  port: url.port || 3306,
};

const sequelize = new Sequelize(
  DB_CONFIG.database,
  DB_CONFIG.username,
  DB_CONFIG.password,
  {
    host: DB_CONFIG.host,
    port: Number(DB_CONFIG.port),
    dialect: "mysql",
    logging: console.log,
    define: {
      timestamps: false,
    },
    dialectOptions: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
    // Asegura charset UTF-8 para toda la conexión
    charset: "utf8mb4",
    collate: "utf8mb4_unicode_ci",
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
      afterCreate: (conn, cb) => {
        conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;", (err) => {
          cb(err, conn);
        });
      },
    },
  },
);

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
