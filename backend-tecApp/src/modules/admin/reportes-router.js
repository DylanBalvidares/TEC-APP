import { Router } from "express";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import { obtenerResumenReportes } from "./reportes-controller.js";

const reportesRouter = Router();

reportesRouter.get(
  "/reportes/resumen",
  comprobarPermiso("administrativo_ver_reportes"),
  async (req, res) => {
    try {
      const data = await obtenerResumenReportes();
      return res.status(200).json({ ok: true, ...data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

export default reportesRouter;
