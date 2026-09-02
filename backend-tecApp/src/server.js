import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

// DB
import "./db/conexionDB.js";

// Middlewares
import autenticar from "./middlewares/autenticar.js";

// Routers por módulo
import authRouter from "./modules/auth/auth-router.js";

import usuariosRouter from "./modules/usuarios/usuarios-router.js";
import rolesRouter from "./modules/usuarios/roles-router.js";
import rolPermisosRouter from "./modules/usuarios/rol-permisos-router.js";

import alumnosRouter from "./modules/academico/alumnos-router.js";
import cursosRouter from "./modules/academico/cursos-router.js";
import profesoresRouter from "./modules/academico/profesores-router.js";
import asistenciasRouter from "./modules/academico/asistencias-router.js";
import materiasRouter from "./modules/academico/materias-router.js";
import asignacionesRouter from "./modules/academico/asignaciones-router.js";
import notasRouter from "./modules/academico/notas-router.js";
import personalRouter from "./modules/academico/personal-router.js";
import cargosRouter from "./modules/academico/cargos-router.js";

import comunidadRouter from "./modules/comunidad/comunidad-router.js";

import bibliotecaRouter from "./modules/biblioteca/biblioteca-router.js";
import prestamosRouter from "./modules/biblioteca/prestamos-router.js";
import recursosRouter from "./modules/biblioteca/recursos-router.js";

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

// Log de peticiones
app.use((req, res, next) => {
  console.log(`\x1b[1m\x1b[35m[REQ]\x1b[0m ${req.method} ${req.originalUrl}`);
  next();
});

// Servir estáticos de uploads
const uploadDir = process.env.UPLOADS_DIR || path.resolve("uploads");
app.use("/api/comunidad/uploads", express.static(uploadDir));
app.use("/uploads", express.static(uploadDir));

// ==========================================
// 1. RUTAS PÚBLICAS
// ==========================================
app.use("/api/auth", authRouter);

// ==========================================
// 2. RUTAS PROTEGIDAS (Requieren Token JWT)
// ==========================================
app.use("/api/usuarios", autenticar, usuariosRouter);
app.use("/api/usuarios", autenticar, rolesRouter);
app.use("/api/usuarios", autenticar, rolPermisosRouter);

app.use("/api/academico", autenticar, alumnosRouter);
app.use("/api/academico", autenticar, cursosRouter);
app.use("/api/academico", autenticar, profesoresRouter);
app.use("/api/academico", autenticar, asistenciasRouter);
app.use("/api/academico", autenticar, materiasRouter);
app.use("/api/academico", autenticar, asignacionesRouter);
app.use("/api/academico", autenticar, notasRouter);
app.use("/api/academico", autenticar, personalRouter);
app.use("/api/academico", autenticar, cargosRouter);

app.use("/api/comunidad", comunidadRouter);

app.use("/api/biblioteca", autenticar, bibliotecaRouter);
app.use("/api/biblioteca", autenticar, prestamosRouter);
app.use("/api/biblioteca", autenticar, recursosRouter);

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error("\x1b[1m\x1b[31m[ERROR GLOBAL]\x1b[0m", err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    ok: false,
    error: err.message || "Error interno del servidor",
  });
});

app.listen(PORT, () => {
  console.log(`\x1b[1m\x1b[32m[SUCCESS]\x1b[0m BACKEND CORRIENDO EN PUERTO ${PORT}`);
});

export default app;
