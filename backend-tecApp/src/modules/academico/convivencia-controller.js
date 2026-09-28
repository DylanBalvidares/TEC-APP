import ErrorHandler from "../../utils/ErrorHandler.js";
import { Alumno } from "../../db/models/index.js";
import Sancion from "../../db/models/sancion-model.js";
import Observacion from "../../db/models/observacion-model.js";
import { visibilidadConvivencia, VISIBILIDAD } from "../../utils/convivencia.js";

const TIPOS_SANCION = ["apercibimiento", "suspension", "amonestacion"];

// Ámbito del actor sobre un alumno (mismo criterio que mensajes-controller:
// preceptor solo sus cursos; el resto propio pasa por el router con su permiso).
async function alcanceSobreAlumno(actor, alumno) {
  const visibilidad = visibilidadConvivencia(actor);
  if (visibilidad === VISIBILIDAD.NADA) {
    throw new ErrorHandler(403, "Acceso denegado a la convivencia del alumno");
  }
  if (visibilidad === VISIBILIDAD.TODO) return;
  // Vista propia: solo el propio legajo (el router ya exige el permiso del rol).
  if (Number(actor?.id_alumno) !== Number(alumno.id_alumno)) {
    throw new ErrorHandler(403, "Acceso denegado: solo tu propio legajo");
  }
}

export async function listarSanciones(actor, { id_alumno = null } = {}) {
  const where = {};
  if (id_alumno) {
    const alumno = await Alumno.findByPk(Number(id_alumno));
    if (!alumno) throw new ErrorHandler(404, "No se encontró el alumno");
    await alcanceSobreAlumno(actor, alumno);
    where.id_alumno = Number(id_alumno);
  } else if (visibilidadConvivencia(actor) !== VISIBILIDAD.TODO) {
    throw new ErrorHandler(403, "Acceso denegado: indicá un alumno");
  }
  return Sancion.findAll({ where, order: [["fecha", "DESC"]] });
}

export async function crearSancion(actor, datos = {}) {
  const { id_alumno, tipo, motivo, fecha } = datos;
  if (!id_alumno) throw new ErrorHandler(400, "El alumno es obligatorio");
  if (!TIPOS_SANCION.includes(tipo)) {
    throw new ErrorHandler(400, `Tipo inválido: debe ser uno de [${TIPOS_SANCION.join(", ")}]`);
  }
  if (!motivo || !String(motivo).trim()) throw new ErrorHandler(400, "El motivo es obligatorio");
  const alumno = await Alumno.findByPk(Number(id_alumno));
  if (!alumno) throw new ErrorHandler(404, "No se encontró el alumno");
  await alcanceSobreAlumno(actor, alumno);
  return Sancion.create({
    id_alumno: Number(id_alumno),
    tipo,
    motivo: String(motivo).trim(),
    fecha: fecha || new Date().toISOString().slice(0, 10),
    registrado_por: actor?.id_usuario ?? null,
  });
}

export async function eliminarSancion(actor, id) {
  const sancion = await Sancion.findByPk(Number(id));
  if (!sancion) throw new ErrorHandler(404, "No se encontró la sanción");
  const alumno = await Alumno.findByPk(sancion.id_alumno);
  if (alumno) await alcanceSobreAlumno(actor, alumno);
  await sancion.destroy();
  return { ok: true, mensaje: "Sanción eliminada" };
}

export async function listarObservaciones(actor, { id_alumno = null } = {}) {
  const where = {};
  if (id_alumno) {
    const alumno = await Alumno.findByPk(Number(id_alumno));
    if (!alumno) throw new ErrorHandler(404, "No se encontró el alumno");
    await alcanceSobreAlumno(actor, alumno);
    where.id_alumno = Number(id_alumno);
  } else if (visibilidadConvivencia(actor) !== VISIBILIDAD.TODO) {
    throw new ErrorHandler(403, "Acceso denegado: indicá un alumno");
  }
  return Observacion.findAll({ where, order: [["fecha", "DESC"]] });
}

export async function crearObservacion(actor, datos = {}) {
  const { id_alumno, texto } = datos;
  if (!id_alumno) throw new ErrorHandler(400, "El alumno es obligatorio");
  if (!texto || !String(texto).trim()) throw new ErrorHandler(400, "El texto es obligatorio");
  const alumno = await Alumno.findByPk(Number(id_alumno));
  if (!alumno) throw new ErrorHandler(404, "No se encontró el alumno");
  await alcanceSobreAlumno(actor, alumno);
  return Observacion.create({
    id_alumno: Number(id_alumno),
    texto: String(texto).trim().slice(0, 2000),
    fecha: new Date().toISOString().slice(0, 10),
    registrado_por: actor?.id_usuario ?? null,
  });
}

export { VISIBILIDAD };
