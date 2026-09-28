import { Router } from "express";
import comprobarPermiso, { soloAutenticado } from "../../middlewares/comprobarPermisos.js";
import {
  listarMisNotificaciones,
  marcarNotificacionLeida,
  obtenerPreferencias,
  guardarPreferencias,
} from "./notificaciones-controller.js";

const notificacionesRouter = Router();

const idPropio = (req) => Number(req.headers["id_usuario"]);

const manejar = (res, error) =>
  res.status(error.status || error.statusCode || 500).json({ message: error.message });

notificacionesRouter.get(
  "/notificaciones/mias",
  comprobarPermiso(soloAutenticado),
  async (req, res) => {
    try {
      const data = await listarMisNotificaciones(idPropio(req), {
        soloNoLeidas: req.query.noLeidas === "1",
      });
      return res.status(200).json({ ok: true, ...data });
    } catch (error) {
      return manejar(res, error);
    }
  },
);

notificacionesRouter.patch(
  "/notificaciones/:id/leida",
  comprobarPermiso(soloAutenticado),
  async (req, res) => {
    try {
      const data = await marcarNotificacionLeida(idPropio(req), req.params.id);
      return res.status(200).json({ ok: true, ...data });
    } catch (error) {
      return manejar(res, error);
    }
  },
);

notificacionesRouter.get(
  "/notificaciones/preferencias",
  comprobarPermiso(soloAutenticado),
  async (req, res) => {
    try {
      const data = await obtenerPreferencias(idPropio(req));
      return res.status(200).json({ ok: true, preferencias: data });
    } catch (error) {
      return manejar(res, error);
    }
  },
);

notificacionesRouter.put(
  "/notificaciones/preferencias",
  comprobarPermiso(soloAutenticado),
  async (req, res) => {
    try {
      const data = await guardarPreferencias(idPropio(req), req.body || {});
      return res.status(200).json({ ok: true, preferencias: data });
    } catch (error) {
      return manejar(res, error);
    }
  },
);

export default notificacionesRouter;
