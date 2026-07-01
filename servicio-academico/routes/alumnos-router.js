import { Router } from "express";
import {
  crearAlumno,
  sincronizarUsuarioAlumno,
  obtenerAlumno,
  obtenerTodosAlumnos,
  obtenerAlumnosCurso,
  obtenerAlumnosCursoParaAlumno,
  eliminarAlumno,
  modificarAlumno,
  validarIdentidadAlumno,
  obtenerInfoParaAlumno,
} from "../controllers/alumnos-controller.js";

import comprobarPermiso from "../middlewares/comprobarPermisos.js";

const alumnosRouter = Router();

alumnosRouter.get(
  "/alumnos-mi-info/:id",
  comprobarPermiso("alumno_ver_perfil"),
  async (req, res) => {
    try {
      console.log(
        "==== PETICION GET EN ALUMNOS-MI-INFO : req.params.id->",
        req.params.id,
        ";====",
      );

      const alumno = await obtenerInfoParaAlumno(req.params.id);
      return res.status(200).json(alumno);
    } catch (error) {
      return res.status(error.status).json(error.message);
    }
  },
);

alumnosRouter.post("/alumnos/validar-identidad", async (req, res) => {
  try {
    console.log("==== VALIDAR-IDENTIDAD BODY:", req.body);
    const alumno = await validarIdentidadAlumno(req.body);
    return res.status(200).json(alumno);
  } catch (error) {
    console.log("==== VALIDAR-IDENTIDAD ERROR:", error);
    return res.status(error.status).json(error.message);
  }
});

alumnosRouter.patch("/alumnos/sincronizar-usuario-alumno", async (req, res) => {
  try {
    console.log("==== SINCRONIZAR-USUARIO-ALUMNO:", req.body);
    const alumno = await sincronizarUsuarioAlumno(req.body);
    return res.status(200).json(alumno);
  } catch (error) {
    console.log("==== VALIDAR-IDENTIDAD ERROR:", error);
    return res.status(error.status).json(error.message);
  }
});

alumnosRouter.get(
  "/alumnos/:id",
  comprobarPermiso("administrativo_ver_todos_alumnos"),
  async (req, res) => {
    try {
      const alumno = await obtenerAlumno(req.params.id);
      return res.status(200).json(alumno);
    } catch (error) {
      return res.status(error.status).json(error.message);
    }
  },
);

alumnosRouter.get(
  "/alumnos",
  comprobarPermiso("administrativo_ver_todos_alumnos"),
  async (req, res) => {
    try {
      const alumnos = await obtenerTodosAlumnos();
      return res.status(200).json(alumnos);
    } catch (error) {
      return res.status(error.status).json(error.message);
    }
  },
);

alumnosRouter.get(
  "/alumnos/curso/:id",
  comprobarPermiso("administrativo_ver_todos_alumnos"),
  async (req, res) => {
    try {
      const alumnos = await obtenerAlumnosCurso(req.params.id);
      return res.status(200).json(alumnos);
    } catch (error) {
      return res.status(error.status).json(error.message);
    }
  },
);

alumnosRouter.get("/alumnos/mi-curso/:id",comprobarPermiso("alumno_ver_mi_curso"),async (req, res) => {
    try {
      const alumnos = await obtenerAlumnosCursoParaAlumno(req.params.id);
      return res.status(200).json(alumnos);
    } catch (error) {
      return res.status(error.status).json(error.message);
    }
  },
);

alumnosRouter.post(
  "/alumnos",
  comprobarPermiso("administrativo_crear_alumno"),
  async (req, res) => {
    console.log("== ALUMNO REQUEST:", req.body); //DEBUG
    try {
      const alumno = await crearAlumno(req.body);
      return res.status(201).json(alumno);
    } catch (error) {
      return res.status(error.status).json(error.message);
    }
  },
);

alumnosRouter.delete(
  "/alumnos/:id",
  comprobarPermiso("administrativo_eliminar_alumno"),
  async (req, res) => {
    const id = req.params.id;
    try {
      const resultado = await eliminarAlumno(id);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status).json(error.message);
    }
  },
);

alumnosRouter.patch(
  "/alumnos",
  comprobarPermiso("administrativo_editar_alumno"),
  async (req, res) => {
    try {
      const resultado = await modificarAlumno(req.body);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status).json(error.message);
    }
  },
);

export default alumnosRouter;
