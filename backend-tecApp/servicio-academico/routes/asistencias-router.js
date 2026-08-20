import { Router } from "express";
import {
  obtenerAsistencia,
  obtenerTodosAsistenciasCurso,
  obtenerHistorialAsistencias,
  crearAsistencia,
  eliminarAsistencia,
  modificarAsistencia,
  obtenerTodosAsistencias,
  guardarAsistenciasLote,
} from "../controllers/asistencias-controller.js";

import comprobarPermiso from "../middlewares/comprobarPermisos.js";

const asistenciasRouter = Router();

asistenciasRouter.get(
  "/asistencias/historial",
  comprobarPermiso("profesor_gestionar_asistencias"),
  async (req, res) => {
    try {
      const historial = await obtenerHistorialAsistencias(req.query);
      return res.status(200).json(historial);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

asistenciasRouter.get(
  "/asistencias/curso/:id",
  comprobarPermiso("profesor_gestionar_asistencias"),
  async (req, res) => {
    try {
      const asistencia = await obtenerTodosAsistenciasCurso(req.params.id);

      return res.status(200).json(asistencia);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

asistenciasRouter.get(
  "/asistencias/:id",
  comprobarPermiso("profesor_gestionar_asistencias"),
  async (req, res) => {
    try {
      const asistencia = await obtenerAsistencia(req.params.id);

      return res.status(200).json(asistencia);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

asistenciasRouter.get(
  "/asistencias",
  comprobarPermiso("profesor_gestionar_asistencias"),
  async (req, res) => {
    try {
      const asistencias = await obtenerTodosAsistencias();
      return res.status(200).json(asistencias);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

// NUEVA RUTA PARA LOTE
asistenciasRouter.post(
  "/asistencias/lote",
  comprobarPermiso("profesor_gestionar_asistencias"),
  async (req, res) => {
    console.log(JSON.stringify(req.body, null, 2));

    try {
      const resultado = await guardarAsistenciasLote(req.body);
      return res.status(200).json({
        mensaje: "Asistencias registradas exitosamente",
        datos: resultado,
      });
    } catch (error) {
      // Tu middleware de error handler asume que error tiene status y message
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

asistenciasRouter.post(
  "/asistencias/:asistencia",
  comprobarPermiso("profesor_gestionar_asistencias"),
  async (req, res) => {
    try {
      const asistencia = await crearAsistencia(req.body);
      return res.status(200).json(asistencia);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

asistenciasRouter.delete(
  "/asistencias/:id",
  comprobarPermiso("profesor_gestionar_asistencias"),
  async (req, res) => {
    try {
      const resultado = await eliminarAsistencia(req.params.id);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

asistenciasRouter.patch(
  "/asistencias/:asistencia",
  comprobarPermiso("profesor_gestionar_asistencias"),
  async (req, res) => {
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
      return res.status(error.status).json({ message: error.message });
    }
  },
);

export default asistenciasRouter;
