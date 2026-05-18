import express from "express";

import usuariosRouter from "./routes/usuarios-router.js";

const app = express();

const PORT = 3310;

app.use(express.json());

app.use("/apiUsuarios", usuariosRouter);

app.listen(PORT, () => {
  console.log(`== SERVICIO USUARIOS CORRIENDO EN ${PORT} ==`);
});
