import { Router } from "express";
import {
  crearNota,
  obtenerNota,
  obtenerTodasNotas,
  eliminarNota,
  modificarNota,
} from "../controllers/notas-controller.js";

const notasRouter = Router();

notasRouter.get("/notas/:id", async (req, res) => {
  try {
    const nota = await obtenerNota(req.params.id);
    return res.status(200).json(nota);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

notasRouter.get("/notas", async (req, res) => {
  try {
    const notas = await obtenerTodasNotas();
    return res.status(200).json(notas);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

notasRouter.post("/notas", async (req, res) => {
  try {
    const nota = await crearNota(req.body);
    return res.status(201).json(nota);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

notasRouter.delete("/notas/:id", async (req, res) => {
  try {
    const resultado = await eliminarNota(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

notasRouter.patch("/notas/:nota", async (req, res) => {
  const { id_nota, id_alumno, id_asignacion, calificacion, fecha_carga, observaciones } = req.body;
  try {
    const nota = {
      id_nota,
      id_alumno,
      id_asignacion,
      calificacion,
      fecha_carga,
      observaciones,
    };

    const resultado = await modificarNota(nota);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

export default notasRouter;
