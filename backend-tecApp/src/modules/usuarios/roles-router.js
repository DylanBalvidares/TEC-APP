import { Router } from "express";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import {
  obtenerTodosRoles,
  crearRol,
  modificarRol,
  eliminarRol,
} from "./roles-controller.js";

const rolesRouter = Router();

// Lectura: quien gestiona roles o asigna roles necesita ver el listado
rolesRouter.get(
  "/roles",
  comprobarPermiso(["root_gestionar_roles", "administrativo_asignar_rol"]),
  async (req, res) => {
    try {
      const data = await obtenerTodosRoles();
      res.status(200).json(data);
    } catch (e) {
      res
        .status(e.statusCode || e.status || 500)
        .json({ error: e.message });
    }
  },
);

rolesRouter.post(
  "/roles",
  comprobarPermiso("root_gestionar_roles"),
  async (req, res) => {
    try {
      const rol = await crearRol(req.body);
      res.status(201).json(rol);
    } catch (e) {
      res
        .status(e.statusCode || e.status || 500)
        .json({ error: e.message });
    }
  },
);

rolesRouter.put(
  "/roles/:id",
  comprobarPermiso("root_gestionar_roles"),
  async (req, res) => {
    try {
      const rol = await modificarRol(req.params.id, req.body);
      res.status(200).json(rol);
    } catch (e) {
      res
        .status(e.statusCode || e.status || 500)
        .json({ error: e.message });
    }
  },
);

rolesRouter.delete(
  "/roles/:id",
  comprobarPermiso("root_gestionar_roles"),
  async (req, res) => {
    try {
      const resultado = await eliminarRol(req.params.id);
      res.status(200).json(resultado);
    } catch (e) {
      res
        .status(e.statusCode || e.status || 500)
        .json({ error: e.message });
    }
  },
);

export default rolesRouter;