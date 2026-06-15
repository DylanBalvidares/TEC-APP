import { Router } from "express";
// BUG FIX: Se agregaron las importaciones faltantes de 'crearUsuario' y 'modificarUsuario'
import {
  generarToken,
  login,
  crearUsuario,
  modificarUsuario,
} from "../controllers/auth-controller.js";
import ErrorHandler from "../ErrorHandler.js";

const authRouter = Router();

//// ============== LOGIN ==============
authRouter.post("/login", async (req, res) => {
  // Espera recibir: {"email":"email@gmail.com","contrasena":"ejemplo_contrasena"}
  const { email, contrasena } = req.body;

  try {
    console.log("==== LOGIN POST ====");
    console.log("-USUARIO:", req.body);
    console.log("==============");

    const response = await login(req.body);

    return res.status(200).json(response);
  } catch (error) {
    console.log("=== ERROR->", error.name);

    // BUG FIX: Si error.status es undefined (error nativo), responde con un código 400 o 500 para evitar que se caiga Express
    const statusCode = error.status || 400;
    const message =
      error.message || "Ocurrió un error al intentar iniciar sesión.";

    return res.status(statusCode).json({ ok: false, error: message });
  }
});

//// ============== REGISTRO ==============
authRouter.post("/registro", async (req, res) => {
  try {
    console.log("==== POST REGISTRO ====");
    console.log("-USUARIO REGISTRANDO:", req.body);
    console.log("==============");

    // Ahora funciona correctamente gracias a la importación superior
    const usuario = await crearUsuario(req.body);

    const token = generarToken(usuario);

    return res.status(200).json({
      mensaje: "Registro exitoso",
      token: token,
      usuario: usuario,
    });
  } catch (error) {
    console.log("=== ERROR REGISTRO ->", error);

    // BUG FIX: Validación segura del código de estado del error
    const statusCode = error.status || 400;
    const message =
      error.message || "Ocurrió un error al procesar el registro.";

    return res.status(statusCode).json({ ok: false, error: message });
  }
});

//// ============== MODIFICAR USUARIO ==============
authRouter.patch("/auth/", async (req, res) => {
  try {
    // Ahora funciona correctamente gracias a la importación superior
    const usuario = await modificarUsuario(req.body);

    return res.status(200).json(usuario);
  } catch (error) {
    console.log("=== ERROR AL MODIFICAR ->", error);

    // BUG FIX: Validación segura del código de estado del error
    const statusCode = error.status || 400;
    const message = error.message || "No se pudo modificar el usuario.";

    return res.status(statusCode).json({ ok: false, error: message });
  }
});

export default authRouter;
