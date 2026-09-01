import { Router } from "express";

import {
  obtenerTodosPrestamos,
  obtenerPrestamo,
  crearPrestamo,
  eliminarPrestamo,
  modificarPrestamo
} from "./prestamos-controller.js"

const prestamosRouter = Router();

prestamosRouter.get("/prestamos/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const prestamo = await obtenerPrestamo(id);
    return res.status(200).json(prestamo);
  } catch (error) {
    return res.status(404).json({ error });
  }
});

prestamosRouter.get("/prestamos", async (req, res) => {
  try {
    const prestamos = await obtenerTodosPrestamos();
    return res.status(200).json(prestamos);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

prestamosRouter.post("/prestamos/:prestamo", async (req, res) => {
  console.log("== PRESTAMOS REQUEST:", req.body); //DEBUG
  try {
    const prestamo = await crearPrestamo(req.body);
    return res.status(201).json(prestamo);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

prestamosRouter.delete("/prestamos/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const resultado = await eliminarPrestamo(id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error });
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
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

export default prestamosRouter;
