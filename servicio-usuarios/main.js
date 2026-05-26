import express from "express";

import usuariosRouter from "./routes/usuarios-router.js";
import rolPermisosRouter from "./routes/rol-permisos-router.js";

const app = express();

const PORT = 3310;

app.use(express.json());

app.use("/apiUsuarios", usuariosRouter);
app.use("/apiPermisos", rolPermisosRouter);

app.listen(PORT, () => {
  console.log(`== SERVICIO USUARIOS CORRIENDO EN ${PORT} ==`);
});
