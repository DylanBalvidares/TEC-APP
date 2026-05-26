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
import middleware from "./routes/middleware.js";
import autenticar from "./middlewares/autenticar.js";
import autoridadesRouter from "./routes/autoridades-router.js";

const app = express();

const PORT = 3307;

app.use(cors());
app.use(express.json()); //PERMITE LEER JSON EN EL BODY DE UN REQUEST
app.use(autenticar);

//RUTAS
app.use("/apiAlumnos", alumnosRouter);
app.use("/apiCursos", cursosRouter);
app.use("/apiProfesores", profesoresRouter);
app.use("/apiAsistencias", asistenciasRouter);
app.use("/apiAutoridades", autoridadesRouter);
app.use("/apiMaterias", materiasRouter);
app.use("/apiAsignaciones", asignacionesRouter);
app.use("/apiNotas", notasRouter);

app.use(middleware);

app.listen(PORT, () => {
  console.log(`== SERVICIO ACADEMICO CORRIENDO EN ${PORT} ==`);
});

export default app;
