import "dotenv/config";

// DB: conexión + migraciones idempotentes (ensure*) para DBs vivas, donde el
// SQL de init no se re-ejecuta porque el volumen de MySQL persiste.
import "./db/conexionDB.js";
import "./db/ensureCorreosTable.js";
import "./db/ensureLibretaDigital.js";
import "./db/ensurePlanesEstudio.js";
import "./db/ensureMensajesWhatsapp.js";
import "./db/ensureCargos.js";
import "./db/ensureAuditoria.js";

// La app (middlewares, routers, 404 y error handler) vive en app.js para poder
// montarla en tests sin abrir un puerto fijo.
import app from "./app.js";

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log(
    `\x1b[1m\x1b[32m[SUCCESS]\x1b[0m BACKEND CORRIENDO EN PUERTO ${PORT}`,
  );
});

export default app;
