import { Router } from "express";

import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import {
  obtenerPermisosDeRolPorId,
  obtenerTodosPermisos,
  asignarPermisosARol,
} from "./rol-permisos-controller.js";

const rolPermisosRouter = Router();

// ============== CATÁLOGO DE PERMISOS (debe ir antes que /permisos/:id) ==============
rolPermisosRouter.get(
  "/permisos/all",
  comprobarPermiso("root_gestionar_permisos"),
  async (req, res) => {
    try {
      const permisos = await obtenerTodosPermisos();
      return res.status(200).json(permisos);
    } catch (error) {
      return res
        .status(error.statusCode || error.status || 500)
        .json({ message: error.message });
    }
  },
);

// ============== PERMISOS POR ROL (query ?id=) ==============
rolPermisosRouter.get(
  "/permisos",
  comprobarPermiso(["root_gestionar_permisos", "administrativo_asignar_rol"]),
  async (req, res) => {
    try {
      const idRol = req.query.id;
      if (!idRol) {
        return res.status(400).json({ message: "Falta el id del rol" });
      }

      const permisos = await obtenerPermisosDeRolPorId(idRol);
      return res.status(200).json(permisos);
    } catch (error) {
      return res
        .status(error.statusCode || error.status || 500)
        .json({ message: error.message });
    }
  },
);

// ============== PERMISOS POR ROL (:id) ==============
rolPermisosRouter.get(
  "/permisos/:id",
  comprobarPermiso(["root_gestionar_permisos", "administrativo_asignar_rol"]),
  async (req, res) => {
    try {
      const permisos = await obtenerPermisosDeRolPorId(req.params.id);
      return res.status(200).json(permisos);
    } catch (error) {
      return res
        .status(error.statusCode || error.status || 500)
        .json({ message: error.message });
    }
  },
);

// ============== ASIGNAR PERMISOS A UN ROL (reemplaza el set completo) ==============
rolPermisosRouter.put(
  "/permisos/:id",
  comprobarPermiso("root_gestionar_permisos"),
  async (req, res) => {
    try {
      const resultado = await asignarPermisosARol(
        req.params.id,
        req.body?.permisos,
      );
      return res.status(200).json(resultado);
    } catch (error) {
      return res
        .status(error.statusCode || error.status || 500)
        .json({ message: error.message });
    }
  },
);

export default rolPermisosRouter;