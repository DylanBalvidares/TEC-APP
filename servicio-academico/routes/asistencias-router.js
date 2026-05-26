import { Router } from "express";
import {
  obtenerAsistencia,
  crearAsistencia,
  eliminarAsistencia,
  modificarAsistencia,
  obtenerTodosAsistencias,
} from "../controllers/asistencias-controller.js";

import comprobarPermiso from "../middlewares/comprobarPermisos.js";

const asistenciasRouter = Router();

asistenciasRouter.get("/asistencias/:id", comprobarPermiso("profesor_gestionar_asistencias"), async (req, res) => {
  try {
    const asistencia = await obtenerAsistencia(req.params.id);

    return res.status(200).json(asistencia);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

asistenciasRouter.get("/asistencias", comprobarPermiso("profesor_gestionar_asistencias"), async (req, res) => {
  try {
    const asistencias = await obtenerTodosAsistencias();
    return res.status(200).json(asistencias);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

asistenciasRouter.post("/asistencias/:asistencia", comprobarPermiso("profesor_gestionar_asistencias"), async (req, res) => {
  try {
    const asistencia = await crearAsistencia(req.body);
    return res.status(200).json(asistencia);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

asistenciasRouter.delete("/asistencias/:id", comprobarPermiso("profesor_gestionar_asistencias"), async (req, res) => {
  try {
    const resultado = await eliminarAsistencia(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

asistenciasRouter.patch("/asistencias/:asistencia", comprobarPermiso("profesor_gestionar_asistencias"), async (req, res) => {
  const { id_asistencia, fecha, estado, id_alumno } = req.body;
  try {
    const asistencia = {
      id_asistencia: id_asistencia,
      fecha: fecha,
      estado: estado,
      id_alumno: id_alumno,
    };

    const resultado = await modificarAsistencia(asistencia);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

export default asistenciasRouter;
