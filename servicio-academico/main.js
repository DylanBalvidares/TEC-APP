//CONFIGURACIONES GLOBALES DE EXPRESS
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

const PORT = 3307;

app.use(cors());
app.use(express.json()); //PERMITE LEER JSON EN EL BODY DE UN REQUEST
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
  console.log(`== SERVICIO ACADEMICO CORRIENDO EN ${PORT} ==`);
});

export default app;
