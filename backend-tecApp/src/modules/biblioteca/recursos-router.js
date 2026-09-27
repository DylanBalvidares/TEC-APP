import { Router } from "express";

import {
  obtenerTodosRecursos,
  obtenerRecurso,
  crearRecurso,
  eliminarRecurso,
  modificarRecurso,
} from "./recursos-controller.js";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";

const recursosRouter = Router();

const responderError = (res, error, mensajePorDefecto) => {
  const status = error?.status || error?.statusCode || 500;
  const mensaje = error?.message || mensajePorDefecto;
  return res.status(status).json({ ok: false, error: mensaje, message: mensaje });
};

// El catálogo de recursos es de consulta para el staff de biblioteca.
recursosRouter.get("/recursos/:id", comprobarPermiso("biblio_ver_recursos"), async (req, res) => {
  const id = req.params.id;

  try {
    const recurso = await obtenerRecurso(id);
    return res.status(200).json(recurso);
  } catch (error) {
    return responderError(res, error, "No se pudo obtener el recurso");
  }
});

recursosRouter.get("/recursos", comprobarPermiso("biblio_ver_recursos"), async (req, res) => {
  try {
    const recursos = await obtenerTodosRecursos();
    return res.status(200).json(recursos);
  } catch (error) {
    return responderError(res, error, "No se pudieron obtener los recursos");
  }
});

recursosRouter.post(
  "/recursos/:recurso",
  comprobarPermiso("biblio_crear_recurso"),
  async (req, res) => {
    try {
      const recurso = await crearRecurso(req.body);
      return res.status(201).json(recurso);
    } catch (error) {
      return responderError(res, error, "No se pudo crear el recurso");
    }
  },
);

recursosRouter.delete(
  "/recursos/:id",
  comprobarPermiso("biblio_eliminar_recurso"),
  async (req, res) => {
    const id = req.params.id;

    try {
      const resultado = await eliminarRecurso(id);
      return res.status(200).json(resultado);
    } catch (error) {
      return responderError(res, error, "No se pudo eliminar el recurso");
    }
  },
);

recursosRouter.patch(
  "/recursos/:recurso",
  comprobarPermiso("biblio_editar_recurso"),
  async (req, res) => {
    const { id, nombre, tipo, descripcion, estado, id_biblioteca } = req.body;
    try {
      const recurso = {
        id,
        nombre,
        tipo,
        descripcion,
        estado,
        id_biblioteca,
      };

      const resultado = await modificarRecurso(recurso);
      return res.status(200).json(resultado);
    } catch (error) {
      return responderError(res, error, "No se pudo modificar el recurso");
    }
  },
);

export default recursosRouter;
