//CONFIGURACIONES GLOBALES DE EXPRESS
import "dotenv/config.js";
import express from "express";
import cors from "cors";

import alumnosRouter from "./routes/alumnos-router.js";
import cursosRouter from "./routes/cursos-router.js";
import profesoresRouter from "./routes/profesores-router.js";
import asistenciasRouter from "./routes/asistencias-router.js";
import materiasRouter from "./routes/materias-router.js";
import asignacionesRouter from "./routes/asignaciones-router.js";
import notasRouter from "./routes/notas-router.js";
//import autenticar from "./middlewares/autenticar.js";
import personalRouter from "./routes/personal-router.js";
import cargosRouter from "./routes/cargos-router.js";

const app = express();

const PORT = process.env.PORT || 3307;

app.use(cors());
app.use(express.json());
// Middleware de log de peticiones
app.use((req, res, next) => {
  console.log(`\x1b[1m\x1b[35m[REQ]\x1b[0m ${req.method} ${req.originalUrl}`);
  next();
});
 //PERMITE LEER JSON EN EL BODY DE UN REQUEST
//app.use(autenticar);

//RUTAS
app.use("/", alumnosRouter);
app.use("/", cursosRouter);
app.use("/", profesoresRouter);
app.use("/", asistenciasRouter);
app.use("/", personalRouter);
app.use("/", materiasRouter);
app.use("/", asignacionesRouter);
app.use("/", notasRouter);
app.use("/", cargosRouter);

app.listen(PORT, () => {
  console.log(`\x1b[1m\x1b[32m[SUCCESS]\x1b[0m SERVICIO ACADEMICO CORRIENDO EN ${PORT}`);
});

export default app;
