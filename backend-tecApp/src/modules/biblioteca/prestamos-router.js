import { Router } from "express";

import {
  obtenerTodosPrestamos,
  obtenerPrestamo,
  crearPrestamo,
  eliminarPrestamo,
  modificarPrestamo,
} from "./prestamos-controller.js";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";

const prestamosRouter = Router();

const responderError = (res, error, mensajePorDefecto) => {
  const status = error?.status || error?.statusCode || 500;
  const mensaje = error?.message || mensajePorDefecto;
  return res.status(status).json({ ok: false, error: mensaje, message: mensaje });
};

// Los préstamos contienen datos nominales de alumnos: sólo staff de biblioteca
// o root (root tiene todos los permisos en el seed).
prestamosRouter.get("/prestamos/:id", comprobarPermiso("biblio_ver_prestamos"), async (req, res) => {
  const id = req.params.id;

  try {
    const prestamo = await obtenerPrestamo(id);
    return res.status(200).json(prestamo);
  } catch (error) {
    return responderError(res, error, "No se pudo obtener el préstamo");
  }
});

prestamosRouter.get("/prestamos", comprobarPermiso("biblio_ver_prestamos"), async (req, res) => {
  try {
    const prestamos = await obtenerTodosPrestamos();
    return res.status(200).json(prestamos);
  } catch (error) {
    return responderError(res, error, "No se pudieron obtener los préstamos");
  }
});

prestamosRouter.post(
  "/prestamos/:prestamo",
  comprobarPermiso("biblio_crear_prestamo"),
  async (req, res) => {
    try {
      const prestamo = await crearPrestamo(req.body);
      return res.status(201).json(prestamo);
    } catch (error) {
      return responderError(res, error, "No se pudo registrar el préstamo");
    }
  },
);

prestamosRouter.delete(
  "/prestamos/:id",
  comprobarPermiso("biblio_editar_prestamo"),
  async (req, res) => {
    const id = req.params.id;

    try {
      const resultado = await eliminarPrestamo(id);
      return res.status(200).json(resultado);
    } catch (error) {
      return responderError(res, error, "No se pudo eliminar el préstamo");
    }
  },
);

prestamosRouter.patch(
  "/prestamos/:prestamo",
  comprobarPermiso("biblio_editar_prestamo"),
  async (req, res) => {
    const { id, fecha_prestamo, fecha_devolucion, estado, id_libro, id_usuario } =
      req.body;
    try {
      const prestamo = {
        id,
        fecha_prestamo,
        fecha_devolucion,
        estado,
        id_libro,
        id_usuario,
      };

      const resultado = await modificarPrestamo(prestamo);
      return res.status(200).json(resultado);
    } catch (error) {
      return responderError(res, error, "No se pudo modificar el préstamo");
    }
  },
);

export default prestamosRouter;
