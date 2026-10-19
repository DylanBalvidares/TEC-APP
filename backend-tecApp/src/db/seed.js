// SEED — Dataset completo de prueba para gestion_tecnica2.
//
// Reemplaza al seed de cursos anterior: ahora carga un dataset demo
// autocontenido (usuarios, cursos, alumnos, notas, boletines, asistencia,
// biblioteca, correos, auditoria, etc.) con IDs demo >= 9000.
//   * npm run seed                 -> carga (o recarga) el dataset completo
//   * npm run seed -- --limpiar    -> borra solo los datos demo
//
// Compatibilidad: los logins base de prueba.sql (root/profesor/preceptor/
// alumno@tecnica2.edu.ar, clave admin123) no se recrean; si existen, el
// dataset integra datos con ellos. La clave demo de las cuentas nuevas
// también es admin123 (se hashea sola al primer login).
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env de la raiz del repositorio (legacy: backend-tecApp/db/.env).
const rutaEnvRaiz = path.resolve(__dirname, "../../../.env");
const rutaEnvLegacy = path.resolve(__dirname, "../../db/.env");
if (existsSync(rutaEnvRaiz)) dotenv.config({ path: rutaEnvRaiz });
if (existsSync(rutaEnvLegacy)) dotenv.config({ path: rutaEnvLegacy });

const LIMPIAR = process.argv.includes("--limpiar");

// Credenciales: DATABASE_URL de Docker (mysql-db) no resuelve fuera del
// contenedor; fuera de Docker probamos primero localhost/127.0.0.1.
const EN_DOCKER = existsSync("/.dockerenv");
const urlBase = new URL(
  process.env.DATABASE_URL ||
  "mysql://root:root_pass@mysql-db:3306/gestion_tecnica2"
);

const config = {
  database:
    urlBase.pathname.split("/").filter(Boolean)[0] ||
    process.env.MYSQL_DATABASE ||
    "gestion_tecnica2",
  user: urlBase.username || process.env.DATABASE_USER || "root",
  password: urlBase.password || process.env.DATABASE_PASSWORD || "root_pass",
  port: Number(urlBase.port) || Number(process.env.DATABASE_PORT) || 3306,
};

const hosts = [...new Set(
  EN_DOCKER
    ? [urlBase.hostname, "localhost"]
    : ["127.0.0.1", "localhost", urlBase.hostname],
)];

const OK = (s) => `\x1b[1m\x1b[32m[SUCCESS]\x1b[0m ${s}`;
const ERROR = (s) => `\x1b[1m\x1b[31m[ERROR]\x1b[0m ${s}`;
const INFO = (s) => `\x1b[1m\x1b[36m[INFO]\x1b[0m ${s}`;

async function conectar() {
  const errores = [];
  for (const host of hosts) {
    try {
      const conn = await mysql.createConnection({
        host,
        user: config.user,
        password: config.password,
        port: config.port,
        database: config.database,
        multipleStatements: false,
      });
      await conn.query("SET NAMES utf8mb4 COLLATE utf8mb4_general_ci");
      await conn.query("SELECT 1");
      return { conn, host };
    } catch (error) {
      errores.push(`${host}: ${error.code || error.message}`);
    }
  }
  throw new Error(
    `No se pudo conectar a MySQL (${config.database}). Probé: ${errores.join(
      " | "
    )}. Levantá el stack con "npm run start -d" (raiz) y reintentá.`
  );
}

// Los ensure* crean tablas que viven solo en runtime (auditoria,
// configuracion) y columnas de migraciones vivas (ej. alumnos.email).
// Se importan dinamicamente DESPUES de fijar SKIP_DB_CONNECT para que la
// conexion de models/conexionDB no arranque su propio loop de reintentos,
// y con DATABASE_URL reescrita al host que ya funciono (en host local,
// "mysql-db" no resuelve).
async function aplicarEnsures(conn, host) {
  process.env.SKIP_DB_CONNECT = "1";
  process.env.DATABASE_URL = `mysql://${encodeURIComponent(config.user)}:${encodeURIComponent(config.password)}@${host}:${config.port}/${config.database}`;
  process.env.DATABASE_USER = config.user;
  process.env.DATABASE_PASSWORD = config.password;
  process.env.DATABASE_PORT = String(config.port);
  process.env.DATABASE_HOST = host;
  process.env.DATABASE_NAME = config.database;
  const modulos = [
    "./ensureCorreosTable.js",
    "./ensureMensajesWhatsapp.js",
    "./ensureAuditoria.js",
    "./ensureConfiguracion.js",
    "./ensureBoletines.js",
    "./ensurePlanesEstudio.js",
    "./ensureHorarios.js",
    "./ensureAlumnos.js",
    "./ensureObservaciones.js",
    "./ensureNotificaciones.js",
    "./ensureLibretaDigital.js",
    "./ensureCargos.js",
  ];
  for (const ruta of modulos) {
    const rutaAbsoluta = path.resolve(__dirname, ruta);
    if (!existsSync(rutaAbsoluta)) continue; // compatibilidad con repos viejos
    try {
      const mod = await import(rutaAbsoluta);
      if (typeof mod.default === "function") await mod.default(1);
    } catch (error) {
      console.error(ERROR(`ensure ${path.basename(ruta)}: ${error.message}`));
    }
  }
  // Sanity: conexion viva para la carga.
  await conn.query("SELECT 1");
}

function imprimirCredenciales(logins) {
  const filas = logins.map((l) => `  ${l.nombre_rol.padEnd(16)} ${l.email.padEnd(38)} admin123`);
  console.log(
    [
      "",
      INFO("Credenciales demo (todas con clave admin123):"),
      ...filas,
      "",
    ].join("\n")
  );
}

function imprimirConteos(conteos) {
  const entradas = Object.entries(conteos).filter(([, n]) => n > 0);
  console.log(INFO("Registros demo cargados por tabla:"));
  const ancho = Math.max(...entradas.map(([t]) => t.length));
  for (const [tabla, n] of entradas) {
    console.log(`  ${tabla.padEnd(ancho)} ${String(n).padStart(5)}`);
  }
  const total = entradas.reduce((sum, [, n]) => sum + n, 0);
  console.log(`  ${"".padEnd(ancho)} ------`);
  console.log(`  ${"TOTAL".padEnd(ancho)} ${String(total).padStart(5)}`);
}

async function main() {
  const { conn, host } = await conectar();
  console.log(OK(`Conectado a MySQL (${host}) — base ${config.database}`));

  try {
    await aplicarEnsures(conn, host);

    const { limpiarDataset, cargarDataset } = await import("./dataset/carga.js");

    if (LIMPIAR) {
      const limpiados = await limpiarDataset(conn);
      const total = Object.values(limpiados).reduce((a, b) => a + b, 0);
      console.log(OK(`Datos demo eliminados (${total} filas). Nada real fue tocado.`));
      return;
    }

    console.log(INFO("Limpiando dataset demo anterior (si hay)..."));
    await limpiarDataset(conn);
    console.log(INFO("Cargando dataset demo..."));
    const resultado = await cargarDataset(conn);

    console.log("");
    imprimirConteos(resultado.conteos);
    imprimirCredenciales(resultado.logins);
    console.log(OK("Dataset de prueba cargado correctamente."));
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error(ERROR(error.message));
  process.exit(1);
});
