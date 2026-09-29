import { Router } from "express";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import { exportarBackup, validarBackup } from "./backup-controller.js";

const backupRouter = Router();

backupRouter.get(
  "/backup/export",
  comprobarPermiso("root_gestionar_roles"),
  async (req, res) => {
    try {
      const data = await exportarBackup();
      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="tecapp-backup-${data.fecha.slice(0, 10)}.json"`,
      );
      return res.status(200).json({ ok: true, backup: data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

backupRouter.post(
  "/backup/verificar",
  comprobarPermiso("root_gestionar_roles"),
  async (req, res) => {
    try {
      const data = validarBackup(req.body?.backup ?? req.body);
      return res.status(200).json({ ok: true, ...data });
    } catch (error) {
      return res
        .status(error.status || error.statusCode || 500)
        .json({ ok: false, error: error.message });
    }
  },
);

export default backupRouter;
