import { test } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.SKIP_DB_CONNECT = "1";
delete process.env.DATABASE_URL;

import {
  SIN_CONEXION_A_DB,
  intentarConexion,
} from "../src/db/conexionDB.js";

test("durante los tests no se programa la conexión a la base", () => {
  assert.equal(SIN_CONEXION_A_DB, true);
  assert.equal(typeof intentarConexion, "function");
});

test("los modelos se importan sin base de datos disponible", async () => {
  const { Alumno, Rol, Usuario } = await import("../src/db/models/index.js");

  assert.ok(Alumno, "Alumno debe estar exportado");
  assert.ok(Rol, "Rol debe estar exportado");
  assert.ok(Usuario, "Usuario debe estar exportado");
});
