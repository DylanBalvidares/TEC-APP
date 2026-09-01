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
  darDeBajaAlumno,
} from "../controllers/alumnos-controller.js";

import { enviarEmailAAlumno } from "../controllers/email-controller.js";

import comprobarPermiso from "../middlewares/comprobarPermisos.js";
import validarCursoPreceptor from "../middlewares/validarCursoPreceptor.js";

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
      return res.status(error.status).json({ message: error.message });
    }
  },
);

alumnosRouter.post("/alumnos/validar-identidad", async (req, res) => {
  
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m VALIDAR-IDENTIDAD BODY:", req.body);
    const alumno = await validarIdentidadAlumno(req.body);
    return res.status(200).json(alumno);
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m VALIDAR-IDENTIDAD ERROR:", error);
    return res.status(error.status).json({ message: error.message });
  }
});

alumnosRouter.patch("/alumnos/sincronizar-usuario-alumno", async (req, res) => {
  
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m SINCRONIZAR-USUARIO-ALUMNO:", req.body);
    const alumno = await sincronizarUsuarioAlumno(req.body);
    return res.status(200).json(alumno);
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m VALIDAR-IDENTIDAD ERROR:", error);
    return res.status(error.status).json({ message: error.message });
  }
});

alumnosRouter.get(
  "/alumnos/:id",
  comprobarPermiso(["administrativo_ver_todos_alumnos", "preceptor_ver_perfil_alumno"]),
  validarCursoPreceptor,
  async (req, res) => {
    
    try {
      const alumno = await obtenerAlumno(req.params.id);
      return res.status(200).json(alumno);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
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
      return res.status(error.status).json({ message: error.message });
    }
  },
);

alumnosRouter.get(
  "/alumnos/curso/:id",
  comprobarPermiso(["administrativo_ver_todos_alumnos", "preceptor_ver_alumnos_de_curso"]),
  validarCursoPreceptor,
  async (req, res) => {
    
    try {
      const alumnos = await obtenerAlumnosCurso(req.params.id);
      return res.status(200).json(alumnos);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

alumnosRouter.get("/alumnos/mi-curso/:id", comprobarPermiso("alumno_ver_mi_curso"), async (req, res) => {
  
  try {
    const alumnos = await obtenerAlumnosCursoParaAlumno(req.params.id);
    return res.status(200).json(alumnos);
  } catch (error) {
    return res.status(error.status).json({ message: error.message });
  }
},
);

alumnosRouter.post(
  "/alumnos",
  comprobarPermiso(["administrativo_crear_alumno", "preceptor_crear_alumno"]),
  validarCursoPreceptor,
  async (req, res) => {
    
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ALUMNO REQUEST:", req.body); //DEBUG
    try {
      const alumno = await crearAlumno(req.body);
      return res.status(201).json(alumno);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

alumnosRouter.delete(
  "/alumnos/:id",
  comprobarPermiso(["administrativo_eliminar_alumno", "preceptor_eliminar_alumno"]),
  validarCursoPreceptor,
  async (req, res) => {
    
    const id = req.params.id;
    try {
      const resultado = await eliminarAlumno(id);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

alumnosRouter.patch(
  "/alumnos/dar-de-baja/:id",
  comprobarPermiso("administrativo_eliminar_alumno"),
  async (req, res) => {
    const id = req.params.id;
    try {
      const resultado = await darDeBajaAlumno(id);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

alumnosRouter.patch(
  "/alumnos",
  comprobarPermiso(["administrativo_editar_alumno", "preceptor_editar_alumno"]),
  validarCursoPreceptor,
  async (req, res) => {
    
    try {
      const resultado = await modificarAlumno(req.body);
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status).json({ message: error.message });
    }
  },
);

// ============== ENVIAR EMAIL A ALUMNO ==============
alumnosRouter.post(
  "/alumnos/enviar-email/:id_alumno",
  comprobarPermiso("preceptor_enviar_email_alumno"),
  async (req, res) => {
    try {
      const idUsuarioPreceptor = req.headers["id_usuario"];
      const resultado = await enviarEmailAAlumno(
        req.params.id_alumno,
        req.body,
        idUsuarioPreceptor,
      );
      return res.status(200).json(resultado);
    } catch (error) {
      return res.status(error.status || 500).json({ message: error.message });
    }
  },
);

export default alumnosRouter;
