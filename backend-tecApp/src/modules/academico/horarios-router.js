import { Router } from "express";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import {
  obtenerHorarios,
  crearHorario,
  eliminarHorario,
} from "./horarios-controller.js";

const horariosRouter = Router();

horariosRouter.get(
  "/horarios",
  comprobarPermiso("horario_ver"),
  async (req, res) => {
    try {
      const data = await obtenerHorarios({ id_curso: req.query.id_curso || null });
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

horariosRouter.post(
  "/horarios",
  comprobarPermiso("horario_gestionar"),
  async (req, res) => {
    try {
      const data = await crearHorario(req.body);
      return res.status(201).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

horariosRouter.delete(
  "/horarios/:id",
  comprobarPermiso("horario_gestionar"),
  async (req, res) => {
    try {
      const data = await eliminarHorario(req.params.id);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

export default horariosRouter;
