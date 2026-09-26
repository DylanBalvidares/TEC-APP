import { Router } from "express";
import {
  crearNota,
  obtenerNota,
  obtenerTodasNotas,
  obtenerNotasProfesor,
  obtenerNotasPreceptorCurso,
  obtenerMisNotasAlumno,
  obtenerHistorialAlumno,
  eliminarNota,
  modificarNota,
} from "./notas-controller.js";

import comprobarPermiso from "../../middlewares/comprobarPermisos.js";

const notasRouter = Router();

// 1. Profesor: sus notas y asignaciones
notasRouter.get(
  "/notas/profesor",
  comprobarPermiso("profesor_ver_todos_notas"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const data = await obtenerNotasProfesor(idUsuario);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
);

// 2. Preceptor: notas de su curso
notasRouter.get(
  "/notas/preceptor/curso/:id_curso",
  comprobarPermiso("preceptor_ver_notas"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const data = await obtenerNotasPreceptorCurso(req.params.id_curso, idUsuario, idRol);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
);

// 3. Alumno: sus propias notas (identificado por token)
notasRouter.get(
  "/notas/mis-notas",
  comprobarPermiso("alumno_ver_mis_notas"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const data = await obtenerMisNotasAlumno(idUsuario);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
);

// 4. Historial de calificaciones por alumno
notasRouter.get(
  "/notas/historial/alumno/:id_alumno",
  comprobarPermiso(["profesor_ver_todos_notas", "preceptor_ver_notas", "alumno_ver_mis_notas"]),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const historial = await obtenerHistorialAlumno(req.params.id_alumno, idUsuario, idRol);
      return res.status(200).json(historial);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
);

// 5. Cargar / Crear nota
notasRouter.post(
  "/notas",
  comprobarPermiso("profesor_crear_nota"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const nota = await crearNota(req.body, idUsuario, idRol);
      return res.status(201).json(nota);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
);

// 6. Editar nota
notasRouter.patch(
  "/notas",
  comprobarPermiso("profesor_editar_nota"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const resultado = await modificarNota(req.body, idUsuario, idRol);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
);

// 7. Eliminar nota
notasRouter.delete(
  "/notas/:id",
  comprobarPermiso("profesor_eliminar_nota"),
  async (req, res) => {
    try {
      const idUsuario = req.headers["id_usuario"];
      const idRol = req.headers["id_rol"];
      const resultado = await eliminarNota(req.params.id, idUsuario, idRol);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
);

// 8. Rutas legadas
notasRouter.get(
  "/notas/:id",
  comprobarPermiso("profesor_ver_todos_notas"),
  async (req, res) => {
    try {
      const nota = await obtenerNota(req.params.id);
      return res.status(200).json(nota);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
);

notasRouter.get(
  "/notas",
  comprobarPermiso("profesor_ver_todos_notas"),
  async (req, res) => {
    try {
      const notas = await obtenerTodasNotas();
      return res.status(200).json(notas);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  }
);

export default notasRouter;
