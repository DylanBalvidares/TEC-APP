import { readFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mysql from "mysql2/promise";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../../db/.env") });

const databaseUrl =
  process.env.DATABASE_URL ||
  "mysql://root:root_pass@localhost:3306/gestion_tecnica2";

const url = new URL(databaseUrl);

const config = {
  database: url.pathname.split("/").filter(Boolean)[0] || "gestion_tecnica2",
  user: url.username || process.env.DATABASE_USER || "root",
  password: url.password || process.env.DATABASE_PASSWORD || "root_pass",
  port: Number(url.port) || Number(process.env.DATABASE_PORT) || 3306,
};

const hosts = [url.hostname, process.env.DATABASE_HOST, "localhost"]
  .filter(Boolean)
  .filter((h, i, arr) => arr.indexOf(h) === i);

const seedSql = readFileSync(
  path.resolve(__dirname, "../../db/seed.sql"),
  "utf8"
);

async function aplicarSeed(host) {
  const connection = await mysql.createConnection({
    host,
    user: config.user,
    password: config.password,
    port: config.port,
    database: config.database,
    multipleStatements: true,
  });

  await connection.query(seedSql);
  await connection.end();
}

async function main() {
  let ultimoError;

  for (const host of hosts) {
    try {
      await aplicarSeed(host);
      console.log(
        `\x1b[1m\x1b[32m[SUCCESS]\x1b[0m Seed aplicado correctamente (${host})`
      );
      return;
    } catch (error) {
      ultimoError = error;
    }
  }

  console.error(
    `\x1b[1m\x1b[31m[ERROR]\x1b[0m No se pudo aplicar el seed: ${ultimoError.message}`
  );
  process.exit(1);
}

main();