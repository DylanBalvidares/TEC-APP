import express from "express";

import usuariosRouter from "./routes/usuarios-router.js";
import rolPermisosRouter from "./routes/rol-permisos-router.js";
import rolesRouter from "./routes/roles-router.js";

const app = express();

const PORT = 3310;

app.use(express.json());

app.use("/", usuariosRouter);
app.use("/", rolPermisosRouter);
app.use("/", rolesRouter);

app.listen(PORT, () => {
  console.log(`== SERVICIO USUARIOS CORRIENDO EN ${PORT} ==`);
});
