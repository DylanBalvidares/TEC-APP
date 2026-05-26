import { Router } from "express";
import {
  crearCurso,
  obtenerCurso,
  obtenerTodosCursos,
  eliminarCurso,
  modificarCurso,
} from "../controllers/cursos-controller.js";

import comprobarPermiso from "../middlewares/comprobarPermisos.js";

const cursosRouter = Router();

cursosRouter.get("/cursos/:id", comprobarPermiso("admin_ver_todos_cursos"), async (req, res) => {
  try {
    const curso = await obtenerCurso(req.params.id);

    return res.status(200).json(curso);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

cursosRouter.get("/cursos", comprobarPermiso("admin_ver_todos_cursos"), async (req, res) => {
  try {
    const cursos = await obtenerTodosCursos();
    return res.status(200).json(cursos);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

cursosRouter.post("/cursos/:curso", comprobarPermiso("admin_asignar_curso"), async (req, res) => {
  console.log("== CURSO REQUEST:", req.body); //DEBUG
  try {
    const curso = await crearCurso(req.body);
    return res.status(201).json(req.body);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

cursosRouter.delete("/cursos/:id", comprobarPermiso("admin_asignar_curso"), async (req, res) => {
  try {
    const resultado = await eliminarCurso(req.params.id);
    return res.status(204).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

cursosRouter.patch("/cursos/:curso", comprobarPermiso("admin_asignar_curso"), async (req, res) => {
  const { id_curso, nombre_curso, turno, aula } = req.body;
  console.log("CURSOS-ROUTER:", req.body);
  try {
    const curso = {
      id_curso: id_curso,
      nombre_curso: nombre_curso,
      turno: turno,
      aula: aula,
    };

    const resultado = await modificarCurso(curso);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

export default cursosRouter;
