import { Router } from "express";
import {
  crearAlumno,
  obtenerAlumno,
  obtenerTodosAlumnos,
  obtenerAlumnosCurso,
  eliminarAlumno,
  modificarAlumno,
} from "../controllers/alumnos-controller.js";

import comprobarPermiso from "../middlewares/comprobarPermisos.js";

const alumnosRouter = Router();

alumnosRouter.get("/alumnos/:id", comprobarPermiso("administrativo_ver_todos_alumnos"), async (req, res) => {
  try {
    const alumno = await obtenerAlumno(req.params.id);
    return res.status(200).json(alumno);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

alumnosRouter.get("/alumnos", comprobarPermiso("administrativo_ver_todos_alumnos"), async (req, res) => {
  try {
    const alumnos = await obtenerTodosAlumnos();
    return res.status(200).json(alumnos);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

alumnosRouter.get("/alumnos/curso/:id", comprobarPermiso("administrativo_ver_todos_alumnos"), async (req, res) => {
  try {
    const alumnos = await obtenerAlumnosCurso(req.params.id);
    return res.status(200).json(alumnos);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

alumnosRouter.post("/alumnos", comprobarPermiso("administrativo_crear_alumno"), async (req, res) => {
  console.log("== ALUMNO REQUEST:", req.body); //DEBUG
  try {
    const alumno = await crearAlumno(req.body);
    return res.status(201).json(alumno);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

alumnosRouter.delete("/alumnos/:id", comprobarPermiso("administrativo_eliminar_alumno"), async (req, res) => {
  const id = req.params.id;
  try {
    const resultado = await eliminarAlumno(id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

alumnosRouter.patch("/alumnos", comprobarPermiso("administrativo_editar_alumno"), async (req, res) => {
  try {
    // CORRECCIÓN: Pasamos el req.body completo para que el controller actualice todos los campos
    const resultado = await modificarAlumno(req.body);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json(error.message);
  }
});

export default alumnosRouter;
