import jwt from "jsonwebtoken";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import cors from "cors";

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
const PORT = 9000;

app.use(cors());

//RUTAS PUBLICAS, antes del middleware de verificarToken
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: "http://servicio-auth:3308",
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "" },
  }),
);

app.use(
  "/api/comunidad/uploads",
  createProxyMiddleware({
    target: "http://servicio-comunidad:3305/uploads", // Apunta directo al handler estático
    changeOrigin: true,
    pathRewrite: { "^/api/comunidad/uploads": "" }, // Deja solo el nombre del archivo (ej: /foto.png)
  }),
);

app.use(
  "/api/comunidad",
  createProxyMiddleware({
    target: "http://servicio-comunidad:3305",
    changeOrigin: true,
    pathRewrite: { "^/api/comunidad": "" },
  }),
);

app.use(verificarToken); //apartir de aca, todo requiere token

app.use(
  "/api/academico",
  createProxyMiddleware({
    target: "http://servicio-academico:3307",
    changeOrigin: true,
    pathRewrite: { "^/api/academico": "" },
  }),
);

app.use(
  "/api/biblioteca",
  createProxyMiddleware({
    target: "http://servicio-biblioteca:3309",
    changeOrigin: true,
    pathRewrite: { "^/api/biblioteca": "" },
  }),
);

app.use(
  "/api/usuarios",
  createProxyMiddleware({
    target: "http://servicio-usuarios:3310",
    changeOrigin: true,
    pathRewrite: { "^/api/usuarios": "" },
  }),
);

app.listen(PORT, () => {
  console.log(`=== API GATEWAY CORRIENDO EN ${PORT} ===`);
});
