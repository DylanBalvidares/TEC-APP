import "dotenv/config.js";
import express from "express";
import cors from "cors";
import comunidadRouter from "./routes/comunidad-router.js";
import errorMiddleware from "./ErrorHandler.js";

import { Noticia, Comunicado, ObjetoPerdido } from "./models/index.js";

const app = express();

const PORT = process.env.COMUNIDAD_PORT || 3005;

app.use(cors());

app.use(express.json());

// middleware para parsear datos de formularios si fuera necesario
app.use(express.urlencoded({ extended: true }));

app.use("/api/comunidad", comunidadRouter);

// Ruta base de diagnóstico (Health Check)
app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "servicio-comunidad",
    timestamp: new Date(),
  });
});

// Este middleware debe ir SIEMPRE al final de todas las rutas y middlewares
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`   Servicio Comunidad iniciado con éxito.`);
  console.log(`   Escuchando peticiones en el puerto: ${PORT}`);
  console.log(`====================================================`);
});

export default app;
