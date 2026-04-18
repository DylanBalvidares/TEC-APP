import { Router } from "express";
const authRouter = Router();

// Ruta: POST /auth/registro
authRouter.post("/registro/:info", async (req, res) => {
  console.log("📩 Se recibió una petición en /auth/registro");
  console.log("📦 Datos:", req.body);

  try {
    const { nombre } = req.body;
    // Respuesta de prueba exitosa
    res.status(201).json({
      mensaje: "¡Conexión exitosa!",
      usuario: nombre,
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ mensaje: "Error interno" });
  }
});

export default authRouter;
