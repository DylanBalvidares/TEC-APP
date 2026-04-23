import { Router } from "express";

import {
  obtenerTodosPrestamos,
  obtenerPrestamo,
  crearPrestamo,
  eliminarPrestamo,
  modificarPrestamo
} from "../controllers/prestamos-controller.js"

const prestamosRouter = Router();

prestamosRouter.get("/prestamos/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const prestamo = await obtenerPrestamo(id);
    return res.json(prestamo).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(404);
  }
});

prestamosRouter.get("/prestamos", async (req, res) => {
  try {
    const prestamos = await obtenerTodosPrestamos();
    return res.json(prestamos).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(201); //400?
  }
});

prestamosRouter.post("/prestamos/:prestamo", async (req, res) => {
  console.log("== PRESTAMOS REQUEST:", req.body); //DEBUG
  try {
    const prestamo = await crearPrestamo(req.body);
    return res.json(prestamo).statusCode(201);
  } catch (error) {
    return res.json(error).statusCode(400); //400?
  }
});

prestamosRouter.delete("/prestamos/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const resultado = await eliminarPrestamo(id);
    return res.json(resultado).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(400); //400?
  }
});

prestamosRouter.patch("/prestamos/:prestamo", async (req, res) => {
  const { idPrestamo, idRecurso, idUsuario, fechaPrestamo, fechaDevolucion, estado } = req.body;
  try {
    const prestamo = {
      id_prestamo: idPrestamo,
      id_recurso: idRecurso,
      id_usuario: idUsuario,
      fecha_prestamo: fechaPrestamo,
      fecha_devolucion: fechaDevolucion,
      estado: estado
    };

    const resultado = await modificarPrestamo(prestamo);
    return res.json(resultado).statusCode(200); //200->>OK,put/patch
  } catch (error) {
    return res.json(error).statusCode(400); //400?
  }
});

export default prestamosRouter;
