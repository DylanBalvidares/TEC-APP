import express from "express";
import cors from "cors";

import authRouter from "./routes/auth-router.js";

const app = express();

const PORT = 3308;

app.use(express.json());

app.use("/apiAuth", authRouter);

app.listen(PORT, () => {
  console.log(`== SERVICIO AUTH CORRIENDO EN ${PORT} ==`);
});
