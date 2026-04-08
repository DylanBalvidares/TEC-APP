//CONFIGURACIONES GLOBALES DE EXPRESS
import express from "express";
import alumnosRouter from "./routes/alumnos-router.js";
import cursosRouter from "./routes/cursos-router.js";

const app = express();

const PORT = 3307;

app.use(express.json()); //PERMITE LEER JSON EN EL BODY DE UN REQUEST

//RUTAS
app.use("/apiAlumnos", alumnosRouter);
app.use("/apiCursos", cursosRouter);

app.listen(PORT, () => {
  console.log(`== SERVICIO ACADEMICO CORRIENDO EN ${PORT} ==`);
});

export default app;
