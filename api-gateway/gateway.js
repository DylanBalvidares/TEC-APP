import jwt from "jsonwebtoken";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
console.log("=== GATEWAY SECRET:", process.env.JWT_SECRET);

function verificarToken(req, res, next) {
  const header = req.headers["authorization"];
  const token = header && header.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    //req.headers["id_usuario"] = payload.id;
    //req.headers["email"] = payload.email;
    //req.headers["id_rol"] = payload.id_rol;
    //req.headers[expiracion del token] = ??

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

//RUTAS PUBLICAS, antes del middleware de verificarToken
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: "http://servicio-auth:3308",
    changeOrigin: true,
    pathRewrite: { "^/api/auth": "" },
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
