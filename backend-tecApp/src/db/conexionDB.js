import { Sequelize } from "sequelize";

const ES_PRODUCCION = process.env.NODE_ENV === "production";
const DATABASE_URL_POR_DEFECTO = "mysql://root:root_pass@mysql-db:3306/gestion_tecnica2";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && ES_PRODUCCION) {
  throw new Error(
    "DATABASE_URL es obligatoria en producción: no se usan credenciales por defecto.",
  );
}

let url;

try {
  url = new URL(databaseUrl || DATABASE_URL_POR_DEFECTO);
} catch (error) {
  console.error("[ERROR] DATABASE_URL inválida:", error.message);

  if (ES_PRODUCCION) {
    throw new Error("DATABASE_URL inválida en producción.");
  }

  url = new URL(DATABASE_URL_POR_DEFECTO);
}

const DB_CONFIG = {
  database: url.pathname.split("/").filter(Boolean)[0] || "gestion_tecnica2",
  username: url.username || "root",
  password: url.password || "root_pass",
  host: url.hostname || "mysql-db",
  port: Number(url.port) || 3306,
};

const sequelize = new Sequelize(
  DB_CONFIG.database,
  DB_CONFIG.username,
  DB_CONFIG.password,
  {
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    dialect: "mysql",
    logging: false,

    define: {
      timestamps: false,
    },

    dialectOptions: {
      charset: "utf8mb4",
    },

    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

async function intentarConexion() {
  try {
    await sequelize.authenticate();

    console.log(
      "\x1b[1m\x1b[32m[SUCCESS]\x1b[0m ¡Conexión a la base de datos establecida correctamente!"
    );
  } catch (error) {
    console.error(
      "\x1b[1m\x1b[31m[ERROR]\x1b[0m Fallo al conectar a la BD:",
      error.message
    );

    setTimeout(intentarConexion, 5000);
  }
}

// En tests no se abre conexión: los tests importan modelos y routers sin base
// disponible, y el reintento con setTimeout mantendría vivo el proceso (la
// suite quedaría colgada). SKIP_DB_CONNECT permite forzarlo en otros entornos.
const SIN_CONEXION_A_DB =
  process.env.NODE_ENV === "test" ||
  process.env.SKIP_DB_CONNECT === "1" ||
  // Defensivo: `node --test` ejecuta cada archivo en un proceso hijo que expone
  // NODE_TEST_CONTEXT. Así un test que importe modelos de forma estática (antes
  // de poder fijar NODE_ENV) tampoco dispara la conexión real.
  Boolean(process.env.NODE_TEST_CONTEXT);

if (!SIN_CONEXION_A_DB) {
  intentarConexion();
}

export { intentarConexion, SIN_CONEXION_A_DB };
export default sequelize;
