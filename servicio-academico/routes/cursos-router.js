import { Router } from "express";
import {
  crearCurso,
  obtenerCurso,
  obtenerTodosCursos,
  eliminarCurso,
  modificarCurso,
  cancelarCurso,
} from "../controllers/cursos-controller.js";

import comprobarPermiso from "../middlewares/comprobarPermisos.js";

const cursosRouter = Router();

cursosRouter.get("/cursos/:id", comprobarPermiso("admin_ver_todos_cursos"), async (req, res) => {
    
  try {
    const curso = await obtenerCurso(req.params.id);

    return res.status(200).json(curso);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

cursosRouter.get("/info-curso-alumno/:id", comprobarPermiso("alumno_ver_mi_curso"), async (req, res) => {
    
  try {
    const curso = await obtenerCurso(req.params.id);

    return res.status(200).json(curso);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

cursosRouter.get("/cursos", comprobarPermiso("administrativo_ver_todos_cursos"), async (req, res) => {
    
  try {
    const cursos = await obtenerTodosCursos();
    return res.status(200).json(cursos);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

cursosRouter.post("/cursos", comprobarPermiso("administrativo_crear_curso"), async (req, res) => {
    
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m CURSO REQUEST:", req.body); //DEBUG
  try {
    const curso = await crearCurso(req.body);
    return res.status(201).json(req.body);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

cursosRouter.patch("/cursos/cancelar/:id", comprobarPermiso("administrativo_eliminar_curso"), async (req, res) => {
    
  try {
    const resultado = await cancelarCurso(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

cursosRouter.delete("/cursos/:id", comprobarPermiso("administrativo_eliminar_curso"), async (req, res) => {
    
  try {
    const resultado = await eliminarCurso(req.params.id);
    return res.status(204).json(resultado);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

cursosRouter.patch("/cursos", comprobarPermiso("administrativo_editar_curso"), async (req, res) => {
    
  try {
      const curso = await modificarCurso(req.body);
      return res.status(201).json(curso);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
});

export default cursosRouter;
