import { Router } from "express";
import {
  crearAsignacion,
  obtenerAsignacion,
  obtenerTodasAsignaciones,
  eliminarAsignacion,
  modificarAsignacion,
} from "../controllers/asignaciones-controller.js";

import comprobarPermiso from "../middlewares/comprobarPermisos.js";

const asignacionesRouter = Router();

asignacionesRouter.get("/asignaciones/:id", comprobarPermiso("administrativo_ver_todos_asignaciones"), async (req, res) => {
  try {
    const asignacion = await obtenerAsignacion(req.params.id);
    return res.status(200).json(asignacion);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

asignacionesRouter.get("/asignaciones", comprobarPermiso("administrativo_ver_todos_asignaciones"), async (req, res) => {
  try {
    const asignaciones = await obtenerTodasAsignaciones();
    return res.status(200).json(asignaciones);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

asignacionesRouter.post("/asignaciones", comprobarPermiso("administrativo_crear_asignacion"), async (req, res) => {
  try {
    const asignacion = await crearAsignacion(req.body);
    return res.status(201).json(asignacion);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

asignacionesRouter.delete("/asignaciones/:id", comprobarPermiso("administrativo_eliminar_asignacion"), async (req, res) => {
  try {
    const resultado = await eliminarAsignacion(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

asignacionesRouter.patch("/asignaciones", comprobarPermiso("administrativo_editar_asignacion"), async (req, res) => {
  const { id_asignacion, id_curso, id_materia, id_profesor } = req.body;
  try {
    const asignacion = {
      id_asignacion,
      id_curso,
      id_materia,
      id_profesor,
    };

    const resultado = await modificarAsignacion(asignacion);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

export default asignacionesRouter;
