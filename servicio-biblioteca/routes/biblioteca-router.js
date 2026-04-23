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
    return res.json(biblioteca).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(404);
  }
});

bibliotecaRouter.get("/biblioteca", async (req, res) => {
  try {
    const biblioteca = await obtenerTodosBiblioteca();
    return res.json(biblioteca).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(201); //400?
  }
});

bibliotecaRouter.post("/biblioteca/:biblioteca", async (req, res) => {
  console.log("== BIBLIOTECA REQUEST:", req.body); //DEBUG
  try {
    const biblioteca = await crearBiblioteca(req.body);
    return res.json(biblioteca).statusCode(201);
  } catch (error) {
    return res.json(error).statusCode(400); //400?
  }
});

bibliotecaRouter.delete("/biblioteca/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const resultado = await eliminarBiblioteca(id);
    return res.json(resultado).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(400); //400?
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
    return res.json(resultado).statusCode(200); //200->>OK,put/patch
  } catch (error) {
    return res.json(error).statusCode(400); //400?
  }
});

export default bibliotecaRouter;
