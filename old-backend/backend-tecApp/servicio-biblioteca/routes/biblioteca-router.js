import { Router } from "express";

import {
  obtenerTodosBiblioteca,
  obtenerBiblioteca,
  crearBiblioteca,
  eliminarBiblioteca,
  modificarBiblioteca,
} from "../controllers/biblioteca-controller.js";

const bibliotecaRouter = Router();

bibliotecaRouter.get("/biblioteca/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const biblioteca = await obtenerBiblioteca(id);
    return res.status(200).json(biblioteca);
  } catch (error) {
    return res.status(404).json({ error });
  }
});

bibliotecaRouter.get("/biblioteca", async (req, res) => {
  try {
    const biblioteca = await obtenerTodosBiblioteca();
    return res.status(200).json(biblioteca);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

bibliotecaRouter.post("/biblioteca/:biblioteca", async (req, res) => {
  console.log("== BIBLIOTECA REQUEST:", req.body); //DEBUG
  try {
    const biblioteca = await crearBiblioteca(req.body);
    return res.status(201).json(biblioteca);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

bibliotecaRouter.delete("/biblioteca/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const resultado = await eliminarBiblioteca(id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

bibliotecaRouter.patch("/biblioteca/:biblioteca", async (req, res) => {
  const { id, nombre, ubicacion, responsable } = req.body;
  try {
    const biblioteca = {
      id: id,
      nombre: nombre,
      ubicacion: ubicacion,
      responsable: responsable,
    };

    const resultado = await modificarBiblioteca(biblioteca);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

export default bibliotecaRouter;
