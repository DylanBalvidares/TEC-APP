import express from "express";

import authRouter from "./routes/auth-router.js";

const app = express();

const PORT = process.env.PORT || 3308;

app.use(express.json());
// Middleware de log de peticiones
app.use((req, res, next) => {
  console.log(`\x1b[1m\x1b[35m[REQ]\x1b[0m ${req.method} ${req.originalUrl}`);
  next();
});


app.use("/", authRouter);

app.listen(PORT, () => {
  console.log(`\x1b[1m\x1b[32m[SUCCESS]\x1b[0m SERVICIO AUTH CORRIENDO EN ${PORT}`);
});
