import { Router } from "express";
import {
  crearMateria,
  obtenerMateria,
  obtenerTodasMaterias,
  eliminarMateria,
  modificarMateria,
} from "../controllers/materias-controller.js";

import comprobarPermiso from "../middlewares/comprobarPermisos.js";

const materiasRouter = Router();

materiasRouter.get(
  "/materias/:id",
  comprobarPermiso("administrativo_ver_todos_materias"),
  async (req, res) => {
    
    try {
      const materia = await obtenerMateria(req.params.id);
      return res.status(200).json(materia);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

materiasRouter.get(
  "/materias",
  comprobarPermiso("administrativo_ver_todos_materias"),
  async (req, res) => {
    
    try {
      const materias = await obtenerTodasMaterias();
      return res.status(200).json(materias);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

materiasRouter.post(
  "/materias",
  comprobarPermiso("administrativo_crear_materia"),
  async (req, res) => {
    
    try {
      const materia = await crearMateria(req.body);
      return res.status(201).json(materia);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

materiasRouter.delete(
  "/materias/:id",
  comprobarPermiso("administrativo_eliminar_materia"),
  async (req, res) => {
    
    try {
      const resultado = await eliminarMateria(req.params.id);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

materiasRouter.patch(
  "/materias",
  comprobarPermiso("administrativo_editar_materia"),
  async (req, res) => {
    
    const { id_materia, nombre_materia, carga_horaria, descripcion } = req.body;
    try {
      const materia = {
        id_materia,
        nombre_materia,
        carga_horaria,
        descripcion,
      };

      const resultado = await modificarMateria(materia);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

export default materiasRouter;
