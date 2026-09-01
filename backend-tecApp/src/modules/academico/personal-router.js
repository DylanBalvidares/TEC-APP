import { Router } from "express";
import {
  crearPersonal,
  obtenerPersonal,
  obtenerTodoPersonal,
  eliminarPersonal,
  modificarPersonal,
  darDeBajaPersonal,
} from "./personal-controller.js";

import comprobarPermiso from "../../middlewares/comprobarPermisos.js";

const personalRouter = Router();

// Obtener un personal por ID
personalRouter.get("/personal/:id", comprobarPermiso("root_gestionar_roles"), async (req, res) => {
    
  try {
    const personal = await obtenerPersonal(req.params.id);
    return res.status(200).json(personal);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// Obtener toda la lista de personal
personalRouter.get("/personal", comprobarPermiso("root_gestionar_roles"), async (req, res) => {
    
  try {
    const todoPersonal = await obtenerTodoPersonal();
    return res.status(200).json(todoPersonal);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// Crear un nuevo registro de personal
personalRouter.post("/personal", comprobarPermiso("root_gestionar_roles"), async (req, res) => {
    
  try {
    const personal = await crearPersonal(req.body);
    return res.status(201).json(personal);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// Eliminar un personal por ID
personalRouter.patch("/personal/dar-de-baja/:id", comprobarPermiso("root_gestionar_roles"), async (req, res) => {
    
  try {
    const resultado = await darDeBajaPersonal(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

personalRouter.delete("/personal/:id", comprobarPermiso("root_gestionar_roles"), async (req, res) => {
    
  try {
    const resultado = await eliminarPersonal(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// Modificar datos de un personal
personalRouter.patch("/personal", comprobarPermiso("root_gestionar_roles"), async (req, res) => {
    
  try {
    const resultado = await modificarPersonal(req.body);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

export default personalRouter;
