import { Router } from "express";
import {
  crearMateria,
  obtenerMateria,
  obtenerTodasMaterias,
  eliminarMateria,
  modificarMateria,
} from "../controllers/materias-controller.js";

const materiasRouter = Router();

materiasRouter.get("/materias/:id", async (req, res) => {
  try {
    const materia = await obtenerMateria(req.params.id);
    return res.status(200).json(materia);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

materiasRouter.get("/materias", async (req, res) => {
  try {
    const materias = await obtenerTodasMaterias();
    return res.status(200).json(materias);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

materiasRouter.post("/materias", async (req, res) => {
  try {
    const materia = await crearMateria(req.body);
    return res.status(201).json(materia);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

materiasRouter.delete("/materias/:id", async (req, res) => {
  try {
    const resultado = await eliminarMateria(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

materiasRouter.patch("/materias/:materia", async (req, res) => {
  const { id_materia, nombre_materia } = req.body;
  try {
    const materia = {
      id_materia,
      nombre_materia,
    };

    const resultado = await modificarMateria(materia);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

export default materiasRouter;
