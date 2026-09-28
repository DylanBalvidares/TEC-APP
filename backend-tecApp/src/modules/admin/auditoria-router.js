import { Router } from "express";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import { listarAuditoria } from "./auditoria-controller.js";

const auditoriaRouter = Router();

auditoriaRouter.get(
  "/auditoria",
  comprobarPermiso("root_ver_logs_sistema"),
  async (req, res) => {
    try {
      const data = await listarAuditoria(req.query);
      return res.status(200).json({ ok: true, ...data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

export default auditoriaRouter;
