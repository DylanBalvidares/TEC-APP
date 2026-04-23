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
    return res.json(recurso).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(404);
  }
});

recursosRouter.get("/recursos", async (req, res) => {
  try {
    const recursos = await obtenerTodosRecursos();
    return res.json(recursos).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(201); //400?
  }
});

recursosRouter.post("/recursos/:recurso", async (req, res) => {
  console.log("== RECURSOS REQUEST:", req.body); //DEBUG
  try {
    const recurso = await crearRecurso(req.body);
    return res.json(recurso).statusCode(201);
  } catch (error) {
    return res.json(error).statusCode(400); //400?
  }
});

recursosRouter.delete("/recursos/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const resultado = await eliminarRecurso(id);
    return res.json(resultado).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(400); //400?
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
    return res.json(resultado).statusCode(200); //200->>OK,put/patch
  } catch (error) {
    return res.json(error).statusCode(400); //400?
  }
});

export default recursosRouter;
