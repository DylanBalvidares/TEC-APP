import { Router } from "express";
import obtenerTodosRoles from "../controllers/roles-controller.js";

const rolesRouter = Router();

rolesRouter.get("/roles", async (req, res) => {
  try {
    const data = await obtenerTodosRoles();
    res.status(200).json(data);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

export default rolesRouter;
