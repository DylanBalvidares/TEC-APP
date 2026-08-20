import { Router } from "express";

import {
  obtenerTodosRecursos,
  obtenerRecurso,
  crearRecurso,
  eliminarRecurso,
  modificarRecurso,
} from "../controllers/recursos-controller.js";

const recursosRouter = Router();

recursosRouter.get("/recursos/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const recurso = await obtenerRecurso(id);
    return res.status(200).json(recurso);
  } catch (error) {
    return res.status(404).json({ error });
  }
});

recursosRouter.get("/recursos", async (req, res) => {
  try {
    const recursos = await obtenerTodosRecursos();
    return res.status(200).json(recursos);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

recursosRouter.post("/recursos/:recurso", async (req, res) => {
  console.log("== RECURSOS REQUEST:", req.body); //DEBUG
  try {
    const recurso = await crearRecurso(req.body);
    return res.status(201).json(recurso);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

recursosRouter.delete("/recursos/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const resultado = await eliminarRecurso(id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

recursosRouter.patch("/recursos/:recurso", async (req, res) => {
  const { id, nombre, tipo, descripcion, estado, id_biblioteca } = req.body;
  try {
    const recurso = {
      id: id,
      nombre: nombre,
      tipo: tipo,
      descripcion: descripcion,
      estado: estado,
      id_biblioteca: id_biblioteca,
    };

    const resultado = await modificarRecurso(recurso);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

export default recursosRouter;
