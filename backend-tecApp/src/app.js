import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";

// Middlewares
import autenticar from "./middlewares/autenticar.js";

// Routers por módulo
import authRouter from "./modules/auth/auth-router.js";

import usuariosRouter from "./modules/usuarios/usuarios-router.js";
import rolesRouter from "./modules/usuarios/roles-router.js";
import rolPermisosRouter from "./modules/usuarios/rol-permisos-router.js";

import alumnosRouter from "./modules/academico/alumnos-router.js";
import correosRouter from "./modules/academico/correos-router.js";
import cursosRouter from "./modules/academico/cursos-router.js";
import profesoresRouter from "./modules/academico/profesores-router.js";
import asistenciasRouter from "./modules/academico/asistencias-router.js";
import materiasRouter from "./modules/academico/materias-router.js";
import asignacionesRouter from "./modules/academico/asignaciones-router.js";
import planesRouter from "./modules/academico/planes-router.js";
import notasRouter from "./modules/academico/notas-router.js";
import personalRouter from "./modules/academico/personal-router.js";
import cargosRouter from "./modules/academico/cargos-router.js";

import comunidadRouter from "./modules/comunidad/comunidad-router.js";
import metricasRouter from "./modules/admin/metricas-router.js";
import auditoriaRouter from "./modules/admin/auditoria-router.js";
import reportesRouter from "./modules/admin/reportes-router.js";
import configRouter from "./modules/admin/config-router.js";
import backupRouter from "./modules/admin/backup-router.js";
import eventosRouter from "./modules/admin/eventos-router.js";
import horariosRouter from "./modules/academico/horarios-router.js";
import convivenciaRouter from "./modules/academico/convivencia-router.js";
import notificacionesRouter from "./modules/comunidad/notificaciones-router.js";

import bibliotecaRouter from "./modules/biblioteca/biblioteca-router.js";
import prestamosRouter from "./modules/biblioteca/prestamos-router.js";
import recursosRouter from "./modules/biblioteca/recursos-router.js";

// La app se construye acá (sin `listen` ni `dotenv`) para poder montarla en
// tests con un servidor efímero. El arranque real vive en server.js.
const app = express();
const ES_PRODUCCION = process.env.NODE_ENV === "production";

// Detrás de un proxy (Docker/nginx): permite que el rate-limit vea la IP real.
app.set("trust proxy", 1);

// Cabeceras de seguridad. CSP desactivada porque es una API JSON (el frontend
// define su propia política); CORP permisivo para que las imágenes de uploads
// se puedan mostrar desde otro origen.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// CORS con allowlist configurable (CSV en CORS_ORIGINS). En desarrollo, si no
// se configura, se permite cualquier origen para no romper el flujo local.
const origenesPermitidos = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Sin cabecera Origin (curl, SSR, mismo origen): se permite.
      if (!origin) return callback(null, true);
      if (origenesPermitidos.length === 0 && !ES_PRODUCCION) {
        return callback(null, true);
      }
      if (origenesPermitidos.includes(origin)) return callback(null, true);
      return callback(new Error("Origen no permitido por CORS"));
    },
    credentials: true,
  }),
);

// Límite del tamaño del body para evitar payloads abusivos.
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "1mb" }));

// Log de peticiones
app.use((req, res, next) => {
  console.log(`\x1b[1m\x1b[35m[REQ]\x1b[0m ${req.method} ${req.originalUrl}`);
  next();
});
// ==========================================
// Healthcheck (público, sin datos sensibles)
// ==========================================
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, status: "up" });
});

// ==========================================
// Servir estáticos de uploads
// ==========================================
// Las imágenes se consumen con <img src>, que no puede enviar el header
// Authorization; por eso la lectura queda pública. Se endurece con lista
// blanca de extensiones, sin listado de directorios y sin dotfiles.
const uploadDir = process.env.UPLOADS_DIR || path.resolve("uploads");
const EXTENSIONES_UPLOAD = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".avif",
  ".pdf",
]);

const soloExtensionesPermitidas = (req, res, next) => {
  const ext = path.extname(req.path).toLowerCase();
  if (!EXTENSIONES_UPLOAD.has(ext)) {
    return res.status(404).json({ ok: false, error: "Recurso no encontrado" });
  }
  next();
};

const servirUploads = express.static(uploadDir, {
  dotfiles: "deny",
  index: false,
  redirect: false,
  maxAge: ES_PRODUCCION ? "7d" : 0,
});

app.use("/api/comunidad/uploads", soloExtensionesPermitidas, servirUploads);
app.use("/uploads", soloExtensionesPermitidas, servirUploads);

// ==========================================
// 1. RUTAS PÚBLICAS
// ==========================================
// Rate-limit global de autenticación y uno más estricto para login/código
// (frena la fuerza bruta sobre credenciales y códigos de verificación).
export const limitadorAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Demasiados intentos. Esperá unos minutos e intentá de nuevo.",
  },
});

export const limitadorCredenciales = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    ok: false,
    error: "Demasiados intentos. Esperá unos minutos e intentá de nuevo.",
  },
});

app.use("/api/auth", limitadorAuth);
app.use("/api/auth/login", limitadorCredenciales);
app.use("/api/auth/verificar-codigo", limitadorCredenciales);
app.use("/api/auth", authRouter);

// ==========================================
// 2. RUTAS PROTEGIDAS (Requieren Token JWT)
// ==========================================
app.use("/api/usuarios", autenticar, usuariosRouter);
app.use("/api/usuarios", autenticar, rolesRouter);
app.use("/api/usuarios", autenticar, rolPermisosRouter);

app.use("/api/academico", autenticar, alumnosRouter);
app.use("/api/academico", autenticar, correosRouter);
app.use("/api/academico", autenticar, cursosRouter);
app.use("/api/academico", autenticar, profesoresRouter);
app.use("/api/academico", autenticar, asistenciasRouter);
app.use("/api/academico", autenticar, materiasRouter);
app.use("/api/academico", autenticar, asignacionesRouter);
app.use("/api/academico", autenticar, planesRouter);
app.use("/api/academico", autenticar, notasRouter);
app.use("/api/academico", autenticar, personalRouter);
app.use("/api/academico", autenticar, cargosRouter);
app.use("/api/academico", autenticar, horariosRouter);
app.use("/api/academico", autenticar, convivenciaRouter);

app.use("/api/comunidad", comunidadRouter);
app.use("/api/comunidad", autenticar, notificacionesRouter);

app.use("/api/admin", autenticar, metricasRouter);
app.use("/api/admin", autenticar, auditoriaRouter);
app.use("/api/admin", autenticar, reportesRouter);
app.use("/api/admin", autenticar, configRouter);
app.use("/api/admin", autenticar, backupRouter);
app.use("/api/admin", autenticar, eventosRouter);

app.use("/api/biblioteca", autenticar, bibliotecaRouter);
app.use("/api/biblioteca", autenticar, prestamosRouter);
app.use("/api/biblioteca", autenticar, recursosRouter);

// 404 uniforme para rutas desconocidas.
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Ruta no encontrada" });
});

// Middleware de manejo de errores global
app.use((err, req, res, next) => {
  console.error("\x1b[1m\x1b[31m[ERROR GLOBAL]\x1b[0m", err.message || err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    ok: false,
    error: err.message || "Error interno del servidor",
  });
});

export default app;
