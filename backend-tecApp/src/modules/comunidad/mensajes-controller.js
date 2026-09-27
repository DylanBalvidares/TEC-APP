import { Op } from "sequelize";
import ErrorHandler from "../../utils/ErrorHandler.js";
import {
  Alumno,
  Asignacion,
  Curso,
  Personal,
  Profesor,
  MensajeWhatsapp,
} from "../../db/models/index.js";
import { enviarWhatsapp, normalizarTelefonoAR, diagnosticarTelefono } from "../../utils/whatsappProvider.js";

const ROL_ROOT = 8;

// Preceptor solo a tutores de sus cursos (mismo criterio que email-controller).
async function verificarAccesoPreceptorAlumno(idUsuarioPreceptor, alumno) {
  const personal = await Personal.findOne({ where: { id_usuario: idUsuarioPreceptor } });
  if (!personal) {
    throw new ErrorHandler(403, "No se encontró registro de personal para este usuario");
  }
  const cursos = await Curso.findAll({
    where: { id_preceptor: personal.id_personal },
    attributes: ["id_curso"],
  });
  const ids = cursos.map((c) => c.id_curso);
  if (ids.includes(alumno.id_curso) === false) {
    throw new ErrorHandler(403, "Acceso denegado: No tenés permiso sobre el curso de este alumno");
  }
}

// Profesor solo a tutores de alumnos de sus asignaciones (criterio notas-controller).
async function verificarAccesoProfesorAlumno(idUsuarioProfesor, alumno) {
  const profesor = await Profesor.findOne({ where: { id_usuario: idUsuarioProfesor } });
  if (!profesor) {
    throw new ErrorHandler(404, "No se encontró el perfil docente para este usuario");
  }
  const asignaciones = await Asignacion.findAll({
    where: { id_profesor: profesor.id_profesor },
    attributes: ["id_curso"],
  });
  const ids = [...new Set(asignaciones.map((a) => a.id_curso))];
  if (ids.includes(alumno.id_curso) === false) {
    throw new ErrorHandler(403, "Acceso denegado: el alumno no pertenece a tus cursos");
  }
}

async function persistir(data) {
  try {
    return await MensajeWhatsapp.create(data);
  } catch (error) {
    console.error("[ERROR] No se pudo persistir mensaje WhatsApp:", error.message);
    return null;
  }
}

export async function enviarWhatsappAAlumno(idAlumno, cuerpo, idRemitente, idRol) {
  console.log("[CTRL] Ejecutando controlador: enviarWhatsappAAlumno");
  if (!idAlumno || Number(idAlumno) <= 0) throw new ErrorHandler(400, "ID de alumno inválido");
  if (!cuerpo || !String(cuerpo).trim()) throw new ErrorHandler(400, "El mensaje es obligatorio");
  if (String(cuerpo).length > 1000) throw new ErrorHandler(400, "El mensaje no puede superar los 1000 caracteres");

  const alumno = await Alumno.findByPk(Number(idAlumno));
  if (!alumno) throw new ErrorHandler(404, "No se encontró el alumno especificado");

  const esRoot = Number(idRol) === ROL_ROOT;
  if (esRoot === false) {
    // Profesores y preceptores pasan por su chequeo de ámbito; root salta
    // autoría pero queda auditado (id_remitente).
    const personal = await Personal.findOne({ where: { id_usuario: idRemitente } });
    if (personal) {
      await verificarAccesoPreceptorAlumno(idRemitente, alumno);
    } else {
      await verificarAccesoProfesorAlumno(idRemitente, alumno);
    }
  }

  if (!alumno.telefono_tutor) {
    throw new ErrorHandler(404, "El alumno no tiene teléfono de tutor registrado");
  }
  const telefono = normalizarTelefonoAR(alumno.telefono_tutor);
  const nombreDest = `${alumno.nombre || ""} ${alumno.apellido || ""}`.trim();

  try {
    const r = await enviarWhatsapp(telefono, String(cuerpo).trim());
    const guardado = await persistir({
      id_remitente: idRemitente,
      id_destinatario: alumno.id_alumno,
      telefono_destino: telefono,
      nombre_destinatario: `Tutor de ${nombreDest}`.trim(),
      cuerpo: String(cuerpo).trim(),
      estado: "enviado",
      waba_message_id: r?.wabaId || null,
    });
    return { mensaje: `WhatsApp enviado al tutor de ${nombreDest} (${telefono})`, id_mensaje: guardado?.id_mensaje || null, waba_message_id: r?.wabaId || null };
  } catch (error) {
    if (error instanceof ErrorHandler && error.status !== 502) throw error;
    await persistir({
      id_remitente: idRemitente,
      id_destinatario: alumno.id_alumno,
      telefono_destino: telefono,
      nombre_destinatario: `Tutor de ${nombreDest}`.trim(),
      cuerpo: String(cuerpo).trim(),
      estado: "fallido",
      error_detalle: error.message?.slice(0, 1000) || null,
    });
    throw error instanceof ErrorHandler ? error : new ErrorHandler(502, "No se pudo enviar el WhatsApp");
  }
}

export async function listarMisMensajes(idRemitente, { limit = 50, offset = 0 } = {}) {
  const { count, rows } = await MensajeWhatsapp.findAndCountAll({
    where: { id_remitente: idRemitente },
    order: [["fecha_envio", "DESC"]],
    limit: Math.min(Number(limit) || 50, 200),
    offset: Number(offset) || 0,
  });
  return { total: count, lista: rows };
}

export async function listarTodosMensajes({ estado, remitente, destinatario, desde, hasta, limit = 50, offset = 0, buscar } = {}) {
  const where = {};
  if (estado) where.estado = estado;
  if (remitente) where.id_remitente = Number(remitente);
  if (destinatario) where.id_destinatario = Number(destinatario);
  if (desde || hasta) {
    where.fecha_envio = {};
    if (desde) where.fecha_envio[Op.gte] = desde;
    if (hasta) where.fecha_envio[Op.lte] = hasta;
  }
  if (buscar) {
    where[Op.or] = [
      { cuerpo: { [Op.like]: `%${buscar}%` } },
      { telefono_destino: { [Op.like]: `%${buscar}%` } },
      { nombre_destinatario: { [Op.like]: `%${buscar}%` } },
    ];
  }
  const { count, rows } = await MensajeWhatsapp.findAndCountAll({
    where,
    order: [["fecha_envio", "DESC"]],
    limit: Math.min(Number(limit) || 50, 200),
    offset: Number(offset) || 0,
  });
  return { total: count, lista: rows };
}

export async function reenviarMensaje(idMensaje, idRemitente) {
  const msg = await MensajeWhatsapp.findByPk(Number(idMensaje));
  if (!msg) throw new ErrorHandler(404, "Mensaje no encontrado");
  const r = await enviarWhatsapp(msg.telefono_destino, msg.cuerpo);
  const nuevo = await persistir({
    id_remitente: idRemitente,
    id_destinatario: msg.id_destinatario,
    telefono_destino: msg.telefono_destino,
    nombre_destinatario: msg.nombre_destinatario,
    cuerpo: msg.cuerpo,
    estado: "enviado",
    waba_message_id: r?.wabaId || null,
  });
  return { mensaje: "Mensaje reenviado", id_mensaje: nuevo?.id_mensaje || null };
}

export async function eliminarMensaje(idMensaje) {
  const msg = await MensajeWhatsapp.findByPk(Number(idMensaje));
  if (!msg) throw new ErrorHandler(404, "Mensaje no encontrado");
  await msg.destroy();
  return { mensaje: "Registro de mensaje eliminado" };
}

// Solo lectura: lista teléfonos con formato inválido para que el admin los
// corrija en las fichas. No modifica nada.
export async function diagnosticarTelefonos() {
  const [alumnos, profesores, personal] = await Promise.all([
    Alumno.findAll({ attributes: ["id_alumno", "nombre", "apellido", "telefono_tutor"] }),
    Profesor.findAll({ attributes: ["id_profesor", "nombre", "apellido", "telefono"] }),
    Personal.findAll({ attributes: ["id_personal", "nombre", "apellido", "telefono"] }),
  ]);
  const mal = (lista, idKey, telKey, tipo) =>
    lista
      .map((r) => ({
        tipo,
        id: r[idKey],
        nombre: `${r.apellido || ""}, ${r.nombre || ""}`.trim(),
        telefono: r[telKey] || null,
        motivo: diagnosticarTelefono(r[telKey]).motivo,
      }))
      .filter((x) => diagnosticarTelefono(x.telefono).ok === false);
  const invalidos = [
    ...mal(alumnos, "id_alumno", "telefono_tutor", "alumno"),
    ...mal(profesores, "id_profesor", "telefono", "profesor"),
    ...mal(personal, "id_personal", "telefono", "personal"),
  ];
  return {
    total_revisados: alumnos.length + profesores.length + personal.length,
    total_invalidos: invalidos.length,
    invalidos,
  };
}

export async function marcarMensajeLeido(idMensaje) {
  const msg = await MensajeWhatsapp.findByPk(Number(idMensaje));
  if (!msg) throw new ErrorHandler(404, "Mensaje no encontrado");
  if (!msg.leido) await msg.update({ leido: true, fecha_lectura: new Date(), estado: "leido" });
  return { mensaje: "Mensaje marcado como leído" };
}
