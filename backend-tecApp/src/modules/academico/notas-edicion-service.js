import { Op } from "sequelize";
import ErrorHandler from "../../utils/ErrorHandler.js";
import {
  Asignacion,
  Curso,
  Personal,
  Profesor,
  SolicitudEdicionNota,
} from "../../db/models/index.js";

export const DURACION_EDICION_PRECEPTOR_MS = 24 * 60 * 60 * 1000;

export async function obtenerPerfilPreceptorAsignacion(idUsuario, idAsignacion) {
  const personal = await Personal.findOne({ where: { id_usuario: Number(idUsuario) } });
  if (!personal) {
    throw new ErrorHandler(403, "No hay un legajo de preceptor asociado a esta cuenta");
  }

  const asignacion = await Asignacion.findByPk(Number(idAsignacion), {
    include: [{ model: Curso, as: "cursoAsignacion" }],
  });
  if (!asignacion) throw new ErrorHandler(404, "No se encontró la asignación solicitada");
  if (Number(asignacion.cursoAsignacion?.id_preceptor) !== Number(personal.id_personal)) {
    throw new ErrorHandler(403, "Solo podés solicitar edición de cursos a tu cargo");
  }

  return { personal, asignacion };
}

export async function exigirEdicionTemporalPreceptor(idUsuario, idAsignacion) {
  const { personal } = await obtenerPerfilPreceptorAsignacion(idUsuario, idAsignacion);
  const permiso = await SolicitudEdicionNota.findOne({
    where: {
      id_personal_preceptor: personal.id_personal,
      id_asignacion: Number(idAsignacion),
      estado: "aprobada",
      fecha_expiracion: { [Op.gt]: new Date() },
    },
  });
  if (!permiso) {
    throw new ErrorHandler(403, "El profesor titular todavía no habilitó la edición de esta planilla");
  }
}

export async function obtenerProfesorAsignacion(idUsuario, idAsignacion) {
  const profesor = await Profesor.findOne({ where: { id_usuario: Number(idUsuario) } });
  if (!profesor) throw new ErrorHandler(404, "No se encontró el perfil docente para este usuario");
  const asignacion = await Asignacion.findByPk(Number(idAsignacion));
  if (!asignacion) throw new ErrorHandler(404, "No se encontró la asignación solicitada");
  if (Number(asignacion.id_profesor) !== Number(profesor.id_profesor)) {
    throw new ErrorHandler(403, "Solo el profesor titular puede decidir esta solicitud");
  }
  return { profesor, asignacion };
}

export { SolicitudEdicionNota };
