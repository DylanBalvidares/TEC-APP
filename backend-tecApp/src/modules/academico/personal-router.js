import { Router } from "express";
import {
  crearPersonal,
  obtenerPersonal,
  obtenerTodoPersonal,
  eliminarPersonal,
  modificarPersonal,
  darDeBajaPersonal,
  sincronizarUsuarioPersonal,
} from "./personal-controller.js";

import comprobarPermiso from "../../middlewares/comprobarPermisos.js";

// Lectura de personal: root más los roles que gestionan usuarios
// (el administrativo necesita listar preceptores para asignarlos a cursos).
const PERMISO_VER_PERSONAL = [
  "root_gestionar_roles",
  "administrativo_crear_usuario",
  "administrativo_editar_usuario",
  "administrativo_eliminar_usuario",
];

const personalRouter = Router();

// Obtener un personal por ID
personalRouter.get("/personal/:id", comprobarPermiso(PERMISO_VER_PERSONAL), async (req, res) => {
    
  try {
    const personal = await obtenerPersonal(req.params.id);
    return res.status(200).json(personal);
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.message });
  }
});

// Obtener toda la lista de personal
personalRouter.get("/personal", comprobarPermiso(PERMISO_VER_PERSONAL), async (req, res) => {
    
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

// Sincronizar usuario con personal
personalRouter.patch(
  "/personal/sincronizar-usuario-personal",
  comprobarPermiso("root_gestionar_roles"),
  async (req, res) => {
    try {
      const resultado = await sincronizarUsuarioPersonal(req.body);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

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
