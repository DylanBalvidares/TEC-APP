import { Router } from "express";

import obtenerPermisosDeRol from "../controllers/rol-permisos-controller.js";

const rolPermisosRouter = Router();

rolPermisosRouter.get("/permisos/:id", async (req, res) => {
    
  try {
    const permisos = await obtenerPermisosDeRol(req.params.id);

    return res.status(200).json(permisos);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

rolPermisosRouter.get("/permisos", async (req, res) => {
    
  try {
    const idRol = req.query.id;
    if (!idRol) {
      return res.status(400).json({ message: "Falta el id del rol" });
    }

    const permisos = await obtenerPermisosDeRol(idRol);
    return res.status(200).json(permisos);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

export default rolPermisosRouter;
