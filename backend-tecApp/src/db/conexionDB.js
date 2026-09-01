import "dotenv/config";
import { Sequelize } from "sequelize";

const databaseUrl = process.env.DATABASE_URL || "mysql://root:root_pass@localhost:3306/gestion_tecnica2";

let url;
try {
  url = new URL(databaseUrl);
} catch (e) {
  url = new URL("mysql://root:root_pass@localhost:3306/gestion_tecnica2");
}

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
    logging: false,
    define: {
      timestamps: false,
    },
    dialectOptions: {
      charset: "utf8mb4",
      collate: "utf8mb4_unicode_ci",
    },
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
  }
);

async function intentarConexion() {
  try {
    await sequelize.authenticate();
    console.log("\x1b[1m\x1b[32m[SUCCESS]\x1b[0m ¡Conexión a la base de datos establecida correctamente!");
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Fallo al conectar a la BD, reintentando en 5s...", error.message);
    setTimeout(intentarConexion, 5000);
  }
}

intentarConexion();

export default sequelize;
