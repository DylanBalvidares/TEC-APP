import { Router } from "express";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import {
  listarSanciones,
  crearSancion,
  eliminarSancion,
  listarObservaciones,
  crearObservacion,
} from "./convivencia-controller.js";

const convivenciaRouter = Router();

const actorDe = (req) => ({
  id_usuario: Number(req.headers["id_usuario"]),
  id_rol: Number(req.headers["id_rol"]),
  id_alumno: req.headers["id_alumno"] ? Number(req.headers["id_alumno"]) : null,
  esRoot: Number(req.headers["id_rol"]) === 8,
});

const manejar = (res, error) =>
  res.status(error.status || error.statusCode || 500).json({ message: error.message });

convivenciaRouter.get(
  "/sanciones",
  comprobarPermiso(["preceptor_ver_sanciones", "preceptor_gestionar_sanciones", "tutor_ver_sanciones_hijo"]),
  async (req, res) => {
    try {
      return res.status(200).json(await listarSanciones(actorDe(req), req.query));
    } catch (error) {
      return manejar(res, error);
    }
  },
);

convivenciaRouter.post(
  "/sanciones",
  comprobarPermiso("preceptor_gestionar_sanciones"),
  async (req, res) => {
    try {
      return res.status(201).json(await crearSancion(actorDe(req), req.body));
    } catch (error) {
      return manejar(res, error);
    }
  },
);

convivenciaRouter.delete(
  "/sanciones/:id",
  comprobarPermiso("preceptor_gestionar_sanciones"),
  async (req, res) => {
    try {
      return res.status(200).json(await eliminarSancion(actorDe(req), req.params.id));
    } catch (error) {
      return manejar(res, error);
    }
  },
);

convivenciaRouter.get(
  "/observaciones",
  comprobarPermiso(["preceptor_ver_sanciones", "preceptor_gestionar_sanciones", "tutor_ver_sanciones_hijo"]),
  async (req, res) => {
    try {
      return res.status(200).json(await listarObservaciones(actorDe(req), req.query));
    } catch (error) {
      return manejar(res, error);
    }
  },
);

convivenciaRouter.post(
  "/observaciones",
  comprobarPermiso("preceptor_gestionar_sanciones"),
  async (req, res) => {
    try {
      return res.status(201).json(await crearObservacion(actorDe(req), req.body));
    } catch (error) {
      return manejar(res, error);
    }
  },
);

export default convivenciaRouter;
