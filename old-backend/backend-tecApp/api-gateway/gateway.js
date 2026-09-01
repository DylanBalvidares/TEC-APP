import jwt from "jsonwebtoken";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

console.log("=== GATEWAY SECRET:", process.env.JWT_SECRET);

function verificarToken(req, res, next) {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.headers["id_usuario"] = payload.id || payload.id_usuario; // intenta obtener el id desde ambos lugares
    req.headers["email"] = payload.email;
    req.headers["id_rol"] = payload.id_rol || payload.rol; // intenta obtener el rol desde ambos lugares
    //req.headers["expiracion del token"] = payload.exp;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expirado" });
    }

    return res.status(401).json({ error: "Token inválido" });
  }
}

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());//solo utilizar en entorno de desarrollo localhost,etc

// Configuración de CORS permitiendo tu IP pública
/*
app.use(cors({
  origin: 'http://186.0.171.84:7070', // Tu IP y puerto donde está el frontend
  methods: ['GET', 'POST', 'PUT', 'PATCH','DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
*/
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || "http://servicio-auth:3308";
const ACADEMICO_SERVICE_URL = process.env.ACADEMICO_SERVICE_URL || "http://servicio-academico:3307";
const COMUNIDAD_SERVICE_URL = process.env.COMUNIDAD_SERVICE_URL || "http://servicio-comunidad:3305";
const BIBLIOTECA_SERVICE_URL = process.env.BIBLIOTECA_SERVICE_URL || "http://servicio-biblioteca:3309";
const USUARIOS_SERVICE_URL = process.env.USUARIOS_SERVICE_URL || "http://servicio-usuarios:3310";

//RUTAS PUBLICAS, antes del middleware de verificarToken
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "" },
  }),
);

app.use(
  "/api/comunidad/uploads",
  createProxyMiddleware({
    target: `${COMUNIDAD_SERVICE_URL}/uploads`,
    changeOrigin: true,
    pathRewrite: { "^/api/comunidad/uploads": "" },
  }),
);

app.use(
  "/api/comunidad",
  createProxyMiddleware({
    target: COMUNIDAD_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/comunidad": "" },
  }),
);

app.use(verificarToken); //apartir de aca, todo requiere token

app.use(
  "/api/academico",
  createProxyMiddleware({
    target: ACADEMICO_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/academico": "" },
  }),
);

app.use(
  "/api/biblioteca",
  createProxyMiddleware({
    target: BIBLIOTECA_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/biblioteca": "" },
  }),
);

app.use(
  "/api/usuarios",
  createProxyMiddleware({
    target: USUARIOS_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: { "^/api/usuarios": "" },
  }),
);

app.listen(PORT, () => {
  console.log(`=== API GATEWAY CORRIENDO EN ${PORT} ===`);
});
