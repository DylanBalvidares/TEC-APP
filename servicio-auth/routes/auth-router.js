import { Router } from "express";
const authRouter = Router();
import {
  generarToken,
  obtenerTodosUsuarios,
  obtenerUsuario,
  crearUsuario,
  eliminarUsuario,
  modificarUsuario,
} from "../controllers/auth-controller.js";

authRouter.get("/auth", async (req, res) => {
  try {
    const usuarios = await obtenerTodosUsuarios();

    return res.status(200).json(usuarios);
  } catch (error) {
    console.log(`=== ERROR AUTH(GET) ${error} ===`);
    return res.status(error.status).json(error.message);
  }
});

authRouter.get("/auth/:id", async (req, res) => {
  try {
    const usuario = await obtenerUsuario(req.params.id);

    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

authRouter.delete("/auth/:id", async (req, res) => {
  try {
    const usuario = await eliminarUsuario(req.params.id);

    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

authRouter.post("/auth/", async (req, res) => {
  try {
    console.log("==== POST ====");
    console.log("-USUARIO:", req.body);
    console.log("==============");
    const usuario = await crearUsuario(req.body);

    const infoUsuario = generarToken(usuario);

    return res.status(200).json(infoUsuario);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

authRouter.patch("/auth/", async (req, res) => {
  try {
    const usuario = await modificarUsuario(req.body);

    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

export default authRouter;
