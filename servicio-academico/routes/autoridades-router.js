import { Router } from "express";
import {
  crearAutoridad,
  obtenerAutoridad,
  obtenerTodasAutoridades,
  eliminarAutoridad,
  modificarAutoridad,
} from "../controllers/autoridades-controller.js";

const autoridadesRouter = Router();

autoridadesRouter.get("/autoridades/:id", async (req, res) => {
  try {
    const autoridad = await obtenerAutoridad(req.params.id);
    return res.status(200).json(autoridad);
  } catch (error) {
    return res.status(error.status || 500).json(error.message);
  }
});

autoridadesRouter.get("/autoridades", async (req, res) => {
  try {
    const autoridades = await obtenerTodasAutoridades();
    return res.status(200).json(autoridades);
  } catch (error) {
    return res.status(error.status || 500).json(error.message);
  }
});

autoridadesRouter.post("/autoridades", async (req, res) => {
  try {
    const autoridad = await crearAutoridad(req.body);
    return res.status(201).json(autoridad);
  } catch (error) {
    return res.status(error.status || 500).json(error.message);
  }
});

autoridadesRouter.delete("/autoridades/:id", async (req, res) => {
  try {
    const resultado = await eliminarAutoridad(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status || 500).json(error.message);
  }
});

autoridadesRouter.patch("/autoridades", async (req, res) => {
  try {
    const resultado = await modificarAutoridad(req.body);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status || 500).json(error.message);
  }
});

export default autoridadesRouter;