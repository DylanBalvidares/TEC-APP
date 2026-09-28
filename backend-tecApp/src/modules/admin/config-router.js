import { Router } from "express";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import { obtenerConfiguracion, actualizarConfiguracion } from "./config-controller.js";

const configRouter = Router();

configRouter.get(
  "/configuracion",
  comprobarPermiso("administrativo_ver_reportes"),
  async (req, res) => {
    try {
      const data = await obtenerConfiguracion();
      return res.status(200).json({ ok: true, config: data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

configRouter.put(
  "/configuracion",
  comprobarPermiso("root_gestionar_roles"),
  async (req, res) => {
    try {
      const data = await actualizarConfiguracion(req.body || {});
      return res.status(200).json({ ok: true, config: data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

export default configRouter;
