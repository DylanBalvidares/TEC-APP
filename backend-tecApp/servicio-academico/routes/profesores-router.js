import { Router } from "express";

import {
  obtenerTodosProfesores,
  obtenerProfesor,
  eliminarProfesor,
  modificarProfesor,
  crearProfesor,
  validarIdentidadProfesor,
  sincronizarUsuarioProfesor,
  obtenerInfoParaProfesor,
  darDeBajaProfesor,
} from "../controllers/profesores-controller.js";

import comprobarPermiso from "../middlewares/comprobarPermisos.js";

const profesoresRouter = Router();

profesoresRouter.get(
  "/profesores-mi-info/:id",
  comprobarPermiso("profesor_ver_curso"),
  async (req, res) => {
    try {
      console.log(
        "==== PETICION GET EN PROFESORES-MI-INFO : req.params.id->",
        req.params.id,
        ";====",
      );
      const profesor = await obtenerInfoParaProfesor(req.params.id);
      return res.status(200).json(profesor);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

profesoresRouter.get("/profesores/:id", comprobarPermiso("administrativo_ver_todos_profesores"), async (req, res) => {
  try {
    const profesor = await obtenerProfesor(req.params.id);

    return res.status(200).json(profesor);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

profesoresRouter.post("/profesores/validar-identidad", async (req, res) => {
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m VALIDAR-IDENTIDAD BODY:", req.body);
    const profesor = await validarIdentidadProfesor(req.body);
    return res.status(200).json(profesor);
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m VALIDAR-IDENTIDAD ERROR:", error);
    return res.status(error.status).json({ message: error.message });
  }
});

profesoresRouter.patch("/profesores/sincronizar-usuario-profesor", async (req, res) => {
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m SINCRONIZAR-USUARIO-PROFESOR:", req.body);
    const profesor = await sincronizarUsuarioProfesor(req.body);
    return res.status(200).json(profesor);
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m SINCRONIZAR-USUARIO-PROFESOR ERROR:", error);
    return res.status(error.status).json({ message: error.message });
  }
});

profesoresRouter.get("/profesores", comprobarPermiso("administrativo_ver_todos_profesores"), async (req, res) => {
  try {
    const profesores = await obtenerTodosProfesores();
    return res.status(200).json(profesores);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

profesoresRouter.post("/profesores", comprobarPermiso("administrativo_crear_profesor"), async (req, res) => {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m PROFESOR REQUEST:", req.body); //DEBUG
  try {
    const curso = await crearProfesor(req.body);
    return res.status(200).json(curso);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

profesoresRouter.patch("/profesores/dar-de-baja/:id", comprobarPermiso("administrativo_eliminar_profesor"), async (req, res) => {
  try {
    const resultado = await darDeBajaProfesor(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

profesoresRouter.delete("/profesores/:id", comprobarPermiso("administrativo_eliminar_profesor"), async (req, res) => {
  try {
    const resultado = await eliminarProfesor(req.params.id);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

profesoresRouter.patch("/profesores", comprobarPermiso("administrativo_editar_profesor"), async (req, res) => {
  try {
    const profesor = req.body;

    const resultado = await modificarProfesor(profesor);
    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
});

export default profesoresRouter;
