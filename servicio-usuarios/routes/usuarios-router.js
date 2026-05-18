import { Router } from "express";
const usuariosRouter = Router();
import {
  buscarUsuario,
  obtenerTodosUsuarios,
  obtenerUsuario,
  crearUsuario,
  eliminarUsuario,
  modificarUsuario,
} from "../controllers/usuarios-controller.js";

usuariosRouter.get("/usuarios", async (req, res) => {
  try {
    const usuarios = await obtenerTodosUsuarios();

    return res.status(200).json(usuarios);
  } catch (error) {
    console.log(`=== ERROR USUARIOS(GET) ${error} ===`);
    return res.status(error.status).json(error.message);
  }
});

/* 
usuariosRouter.get("/usuarios/:id", async (req, res) => {
  try {
    const usuario = await obtenerUsuario(req.params.id);

    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});
*/

usuariosRouter.get("/usuarios/:email", async (req, res) => {
  try {
    const usuario = await buscarUsuario(req.params.email);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

usuariosRouter.delete("/usuarios/:id", async (req, res) => {
  try {
    const usuario = await eliminarUsuario(req.params.id);

    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

usuariosRouter.post("/usuarios/", async (req, res) => {
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

usuariosRouter.patch("/usuarios/", async (req, res) => {
  try {
    const usuario = await modificarUsuario(req.body);

    return res.status(200).json(usuario);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

export default usuariosRouter;
