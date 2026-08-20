import "dotenv/config.js";
import express from "express";

import bibliotecaRouter from "./routes/biblioteca-router.js"
import prestamosRouter from "./routes/prestamos-router.js";
import recursosRouter from "./routes/recursos-router.js"

const app = express();

const PORT = process.env.PORT || 3309;

app.use(express.json());

app.use("/apiBiblioteca", bibliotecaRouter);
app.use("/apiPrestamos", prestamosRouter);
app.use("/apiRecursos", recursosRouter);

app.listen(PORT, () => {
    console.log(`== SERVICIO BIBLIOTECA CORRIENDO EN ${PORT} ==`);

});