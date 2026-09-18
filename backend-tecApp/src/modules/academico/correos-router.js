import { Router } from "express";
import comprobarPermiso from "../../middlewares/comprobarPermisos.js";
import {
  obtenerCorreosDeAlumno,
  marcarCorreoLeido,
} from "./email-controller.js";

const correosRouter = Router();

// Historial de correos enviados a un alumno
correosRouter.get(
  "/alumnos/:id/correos",
  comprobarPermiso([
    "preceptor_enviar_email_alumno",
    "administrativo_ver_todos_alumnos",
  ]),
  async (req, res) => {
    try {
      // Solo un preceptor pasa la validación de acceso al curso del alumno
      const idUsuarioPreceptor =
        Number(req.headers["id_rol"]) === 4
          ? req.headers["id_usuario"]
          : null;

      const data = await obtenerCorreosDeAlumno(
        req.params.id,
        idUsuarioPreceptor,
      );
      res.status(200).json(data);
    } catch (error) {
      res
        .status(error.statusCode || error.status || 500)
        .json({ message: error.message });
    }
  },
);

// Marcar un correo como leído
correosRouter.patch(
  "/correos/:id/leido",
  comprobarPermiso([
    "alumno_ver_perfil",
    "preceptor_enviar_email_alumno",
    "administrativo_ver_todos_alumnos",
  ]),
  async (req, res) => {
    try {
      const correo = await marcarCorreoLeido(req.params.id);
      res.status(200).json(correo);
    } catch (error) {
      res
        .status(error.statusCode || error.status || 500)
        .json({ message: error.message });
    }
  },
);

export default correosRouter;