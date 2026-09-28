import { Router } from "express";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import { obtenerMetricas } from "./metricas-controller.js";

const metricasRouter = Router();

metricasRouter.get(
  "/metricas",
  comprobarPermiso("administrativo_ver_reportes"),
  async (req, res) => {
    try {
      const data = await obtenerMetricas();
      return res.status(200).json({ ok: true, ...data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

export default metricasRouter;
