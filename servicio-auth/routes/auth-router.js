import { Router } from "express";
import { generarToken, login } from "../controllers/auth-controller.js";
import ErrorHandler from "../ErrorHandler.js";

const authRouter = Router();
//// ============== LOGIN ==============
authRouter.post("/auth/login", async (req, res) => {
  //{"email":"email@gmail.com","contrasena":"ejemplo_contrasena"}

  const { email, contrasena } = req.body;
  try {
    console.log("==== LOGIN POST ====");
    console.log("-USUARIO:", req.body);
    console.log("==============");

    const response = await login(req.body);

    return res.status(200).json(response);
  } catch (error) {
    console.log("=== ERROR->", error);
    return res.status(error.status).json(error.message);
  }
});

//// ============== REGISTRO ==============
authRouter.post("/auth/registro", async (req, res) => {
  try {
    console.log("==== POST ====");
    console.log("-USUARIO:", req.body);
    console.log("==============");
    const usuario = await crearUsuario(req.body);

    const infoUsuario = generarToken(usuario);

    return res.status(200).json(infoUsuario);
  } catch (error) {
    console.log("=== ERROR->", error);
    return res.status(error.status).json(error.message);
  }
});

//// ============== MODIFICAR USUARIO? ==============
authRouter.patch("/auth/", async (req, res) => {
  try {
    const usuario = await modificarUsuario(req.body);

    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

export default authRouter;
