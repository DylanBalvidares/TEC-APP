import "dotenv/config.js";
import express from "express";

import bibliotecaRouter from "./routes/biblioteca-router.js"
import prestamosRouter from "./routes/prestamos-router.js";
import recursosRouter from "./routes/recursos-router.js"

import Biblioteca from "./models/biblioteca-model.js";
import Recurso from "./models/recursos-model.js";
import Prestamo from "./models/prestamos-model.js";

Biblioteca.hasMany(Recurso, { foreignKey: "id_biblioteca" });
Recurso.hasMany(Prestamo, { foreignKey: "id_recurso" });
Prestamo.belongsTo(Recurso, { foreignKey: "id_recurso" });

const app = express();

const PORT = process.env.PORT || 3309;

app.use(express.json());

app.use("/apiBiblioteca", bibliotecaRouter);
app.use("/apiPrestamos", prestamosRouter);
app.use("/apiRecursos", recursosRouter);

app.listen(PORT, () => {
    console.log(`== SERVICIO BIBLIOTECA CORRIENDO EN ${PORT} ==`);

});