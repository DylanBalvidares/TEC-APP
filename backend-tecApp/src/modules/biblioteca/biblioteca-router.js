import { Router } from "express";

import {
  obtenerTodosBiblioteca,
  obtenerBiblioteca,
  crearBiblioteca,
  eliminarBiblioteca,
  modificarBiblioteca,
} from "./biblioteca-controller.js";
import comprobarPermiso, {
  soloAutenticado,
} from "../../middlewares/comprobarPermisos.js";

const bibliotecaRouter = Router();

const responderError = (res, error, mensajePorDefecto) => {
  const status = error?.status || error?.statusCode || 500;
  const mensaje = error?.message || mensajePorDefecto;
  return res.status(status).json({ ok: false, error: mensaje, message: mensaje });
};

// Leer el catálogo de libros está disponible para cualquier usuario de la
// institución (se mantiene el comportamiento actual, pero explícito).
bibliotecaRouter.get("/biblioteca/:id", comprobarPermiso(soloAutenticado), async (req, res) => {
  const id = req.params.id;

  try {
    const biblioteca = await obtenerBiblioteca(id);
    return res.status(200).json(biblioteca);
  } catch (error) {
    return responderError(res, error, "No se pudo obtener el libro");
  }
});

bibliotecaRouter.get("/biblioteca", comprobarPermiso(soloAutenticado), async (req, res) => {
  try {
    const biblioteca = await obtenerTodosBiblioteca();
    return res.status(200).json(biblioteca);
  } catch (error) {
    return responderError(res, error, "No se pudo obtener el catálogo");
  }
});

// Modificar el inventario requiere permiso de bibliotecario/root.
bibliotecaRouter.post(
  "/biblioteca/:biblioteca",
  comprobarPermiso("biblio_crear_recurso"),
  async (req, res) => {
    try {
      const biblioteca = await crearBiblioteca(req.body);
      return res.status(201).json(biblioteca);
    } catch (error) {
      return responderError(res, error, "No se pudo crear el registro");
    }
  },
);

bibliotecaRouter.delete(
  "/biblioteca/:id",
  comprobarPermiso("biblio_eliminar_recurso"),
  async (req, res) => {
    const id = req.params.id;

    try {
      const resultado = await eliminarBiblioteca(id);
      return res.status(200).json(resultado);
    } catch (error) {
      return responderError(res, error, "No se pudo eliminar el registro");
    }
  },
);

bibliotecaRouter.patch(
  "/biblioteca/:biblioteca",
  comprobarPermiso("biblio_editar_recurso"),
  async (req, res) => {
    const { id, nombre, ubicacion, responsable } = req.body;
    try {
      const biblioteca = {
        id: id,
        nombre: nombre,
        ubicacion: ubicacion,
        responsable: responsable,
      };

      const resultado = await modificarBiblioteca(biblioteca);
      return res.status(200).json(resultado);
    } catch (error) {
      return responderError(res, error, "No se pudo modificar el registro");
    }
  },
);

export default bibliotecaRouter;
