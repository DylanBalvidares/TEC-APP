import { Router } from "express";

import {
  obtenerTodosProfesores,
  obtenerProfesor,
  eliminarProfesor,
  modificarProfesor,
  crearProfesor,
} from "../controllers/profesores-controller.js";

const profesoresRouter = Router();

profesoresRouter.get("/profesores/:id", async (req, res) => {
  try {
    const profesor = await obtenerProfesor(req.params.id);

    return res.status(200).json(profesor);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

profesoresRouter.get("/profesores", async (req, res) => {
  try {
    const profesores = await obtenerTodosProfesores();
    return res.status(200).json(profesores);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

profesoresRouter.post("/profesores/:profesor", async (req, res) => {
  console.log("== PROFESOR REQUEST:", req.body); //DEBUG
  try {
    const curso = await crearProfesor(req.body);
    return res.status(200).json(curso);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

profesoresRouter.delete("/profesores/:id", async (req, res) => {
  try {
    const resultado = await eliminarProfesor(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

profesoresRouter.patch("/profesores/:profesor", async (req, res) => {
  const { id_profesor, nombre, apellido, materia, email } = req.body;

  try {
    const profesor = {
      id_profesor: id_profesor,
      nombre: nombre,
      apellido: nombre,
      materia: materia,
      email: email,
    };

    const resultado = await modificarProfesor(profesor);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

export default profesoresRouter;
