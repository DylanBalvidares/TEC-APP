import "dotenv/config.js";
import express from "express";

import usuariosRouter from "./routes/usuarios-router.js";
import rolPermisosRouter from "./routes/rol-permisos-router.js";
import rolesRouter from "./routes/roles-router.js";

const app = express();

const PORT = process.env.PORT || 3310;

app.use(express.json());
// Middleware de log de peticiones
app.use((req, res, next) => {
  console.log(`\x1b[1m\x1b[35m[REQ]\x1b[0m ${req.method} ${req.originalUrl}`);
  next();
});


app.use("/", usuariosRouter);
app.use("/", rolPermisosRouter);
app.use("/", rolesRouter);

app.listen(PORT, () => {
  console.log(`\x1b[1m\x1b[32m[SUCCESS]\x1b[0m SERVICIO USUARIOS CORRIENDO EN ${PORT}`);
});
