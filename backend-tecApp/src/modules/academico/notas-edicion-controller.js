import { Op } from "sequelize";
import ErrorHandler from "../../utils/ErrorHandler.js";
import {
  Asignacion,
  Curso,
  Materia,
  Personal,
  Profesor,
} from "../../db/models/index.js";
import {
  DURACION_EDICION_PRECEPTOR_MS,
  obtenerPerfilPreceptorAsignacion,
  obtenerProfesorAsignacion,
  SolicitudEdicionNota,
} from "./notas-edicion-service.js";

export async function solicitarEdicionPlanilla(idUsuario, idAsignacion) {
  const id = Number(idAsignacion);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ErrorHandler(400, "La asignación de la planilla es obligatoria");
  }

  const { personal } = await obtenerPerfilPreceptorAsignacion(idUsuario, id);
  const ahora = new Date();
  const solicitudActiva = await SolicitudEdicionNota.findOne({
    where: {
      id_personal_preceptor: personal.id_personal,
      id_asignacion: id,
      [Op.or]: [
        { estado: "pendiente" },
        { estado: "aprobada", fecha_expiracion: { [Op.gt]: ahora } },
      ],
    },
  });
  if (solicitudActiva) {
    throw new ErrorHandler(409, "Ya tenés una solicitud pendiente o un permiso de edición activo");
  }

  return SolicitudEdicionNota.create({
    id_personal_preceptor: personal.id_personal,
    id_asignacion: id,
    estado: "pendiente",
    fecha_solicitud: ahora,
  });
}

export async function listarSolicitudesPreceptor(idUsuario, idCurso) {
  const curso = await Curso.findByPk(Number(idCurso));
  if (!curso) throw new ErrorHandler(404, "No se encontró el curso");
  const personal = await Personal.findOne({ where: { id_usuario: Number(idUsuario) } });
  if (!personal || Number(curso.id_preceptor) !== Number(personal.id_personal)) {
    throw new ErrorHandler(403, "Solo podés consultar solicitudes de cursos a tu cargo");
  }

  const asignaciones = await Asignacion.findAll({
    where: { id_curso: Number(idCurso) },
    attributes: ["id_asignacion"],
  });
  const ids = asignaciones.map((item) => Number(item.id_asignacion));
  if (ids.length === 0) return [];

  return SolicitudEdicionNota.findAll({
    where: {
      id_personal_preceptor: personal.id_personal,
      id_asignacion: { [Op.in]: ids },
    },
    order: [["fecha_solicitud", "DESC"]],
  });
}

export async function listarSolicitudesPendientesProfesor(idUsuario) {
  const profesor = await Profesor.findOne({ where: { id_usuario: Number(idUsuario) } });
  if (!profesor) throw new ErrorHandler(404, "No se encontró el perfil docente para este usuario");

  return SolicitudEdicionNota.findAll({
    where: { estado: "pendiente" },
    include: incluirDatosSolicitudEdicion(profesor.id_profesor),
    order: [["fecha_solicitud", "ASC"]],
  });
}

export async function listarAccesosEdicionProfesor(idUsuario) {
  const profesor = await Profesor.findOne({ where: { id_usuario: Number(idUsuario) } });
  if (!profesor) throw new ErrorHandler(404, "No se encontró el perfil docente para este usuario");

  return SolicitudEdicionNota.findAll({
    where: {
      [Op.or]: [
        { estado: "pendiente" },
        { estado: "aprobada", fecha_expiracion: { [Op.gt]: new Date() } },
      ],
    },
    include: incluirDatosSolicitudEdicion(profesor.id_profesor),
    order: [["fecha_solicitud", "ASC"]],
  });
}

function incluirDatosSolicitudEdicion(idProfesor) {
  return [
    {
      model: Asignacion,
      as: "asignacion",
      required: true,
      where: { id_profesor: idProfesor },
      include: [
        { model: Curso, as: "cursoAsignacion", attributes: ["id_curso", "nombre_curso"] },
        { model: Materia, as: "materiaAsignacion", attributes: ["id_materia", "nombre_materia"] },
      ],
    },
    {
      model: Personal,
      as: "preceptor",
      attributes: ["id_personal", "nombre", "apellido"],
    },
  ];
}

export async function decidirSolicitudEdicion(idUsuario, idSolicitud, decision) {
  if (!["aprobar", "rechazar", "revocar"].includes(decision)) {
    throw new ErrorHandler(400, "La decisión debe ser aprobar, rechazar o revocar");
  }
  const solicitud = await SolicitudEdicionNota.findByPk(Number(idSolicitud));
  if (!solicitud) throw new ErrorHandler(404, "No se encontró la solicitud");
  await obtenerProfesorAsignacion(idUsuario, solicitud.id_asignacion);
  const ahora = new Date();

  if (decision === "revocar") {
    if (solicitud.estado !== "aprobada") {
      throw new ErrorHandler(409, "La solicitud no tiene un permiso activo para revocar");
    }
    if (!solicitud.fecha_expiracion || new Date(solicitud.fecha_expiracion) <= ahora) {
      throw new ErrorHandler(409, "El permiso de edición ya venció");
    }
    solicitud.estado = "revocada";
    solicitud.fecha_expiracion = ahora;
  } else {
    if (solicitud.estado !== "pendiente") {
      throw new ErrorHandler(409, "La solicitud ya fue resuelta");
    }
    solicitud.estado = decision === "aprobar" ? "aprobada" : "rechazada";
    solicitud.fecha_expiracion = decision === "aprobar"
      ? new Date(ahora.getTime() + DURACION_EDICION_PRECEPTOR_MS)
      : null;
  }

  solicitud.fecha_decision = ahora;
  solicitud.id_usuario_decisor = Number(idUsuario);
  await solicitud.save();
  return solicitud;
}
