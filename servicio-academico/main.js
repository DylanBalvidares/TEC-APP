//CONFIGURACIONES GLOBALES DE EXPRESS
import express from "express";
import cors from "cors";

import alumnosRouter from "./routes/alumnos-router.js";
import cursosRouter from "./routes/cursos-router.js";
import profesoresRouter from "./routes/profesores-router.js";
import asistenciasRouter from "./routes/asistencias-router.js";
import middleware from "./routes/middleware.js";
import autoridadesRouter from "./routes/autoridades-router.js";

const app = express();

const PORT = 3307;

app.use(cors());
app.use(express.json()); //PERMITE LEER JSON EN EL BODY DE UN REQUEST

//RUTAS
app.use("/apiAlumnos", alumnosRouter);
app.use("/apiCursos", cursosRouter);
app.use("/apiProfesores", profesoresRouter);
app.use("/apiAsistencias", asistenciasRouter);
app.use("/apiAutoridades", autoridadesRouter);

//app.use(middleware(error, req, res, next)); //middleware

app.listen(PORT, () => {
  console.log(`== SERVICIO ACADEMICO CORRIENDO EN ${PORT} ==`);
});

export default app;
