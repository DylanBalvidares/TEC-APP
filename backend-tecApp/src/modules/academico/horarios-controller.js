import { Op } from "sequelize";
import ErrorHandler from "../../utils/ErrorHandler.js";
import Horario from "../../db/models/horario-model.js";
import { Asignacion, Curso, Profesor, Materia } from "../../db/models/index.js";
import { validarBloque, detectarConflictos } from "../../utils/horarios.js";

// Resuelve curso/profesor/aula de cada bloque para el detector.
async function bloquesResueltos(excluirId = null) {
  const filas = await Horario.findAll({
    ...(excluirId ? { where: { id_horario: { [Op.ne]: excluirId } } } : {}),
    include: [
      {
        model: Asignacion,
        attributes: ["id_asignacion", "id_curso", "id_profesor", "id_materia"],
      },
    ],
  });
  return filas.map((h) => {
    const plano = typeof h.toJSON === "function" ? h.toJSON() : h;
    const a = plano.Asignacion || plano.asignacion || {};
    return {
      id_horario: plano.id_horario,
      id_curso: a.id_curso ?? null,
      id_profesor: a.id_profesor ?? null,
      aula: plano.aula,
      dia: plano.dia,
      hora_inicio: plano.hora_inicio,
      hora_fin: plano.hora_fin,
    };
  });
}

async function resolverAsignacion(idAsignacion) {
  const asignacion = await Asignacion.findByPk(Number(idAsignacion));
  if (!asignacion) throw new ErrorHandler(404, "No se encontró la asignación");
  const plano = typeof asignacion.toJSON === "function" ? asignacion.toJSON() : asignacion;
  return {
    id_curso: plano.id_curso ?? null,
    id_profesor: plano.id_profesor ?? null,
  };
}

export async function obtenerHorarios({ id_curso = null } = {}) {
  const asignaciones = await Asignacion.findAll({ attributes: ["id_asignacion", "id_curso"] });
  const ids = id_curso
    ? asignaciones.filter((a) => Number(a.id_curso) === Number(id_curso)).map((a) => a.id_asignacion)
    : null;
  return Horario.findAll({
    ...(ids ? { where: { id_asignacion: ids } } : {}),
    include: [
      {
        model: Asignacion,
        include: [
          { model: Curso, as: "cursoAsignacion", attributes: ["id_curso", "nombre_curso"] },
          { model: Profesor, as: "profesorAsignacion", attributes: ["id_profesor", "nombre", "apellido"] },
          { model: Materia, as: "materiaAsignacion", attributes: ["id_materia", "nombre_materia"] },
        ],
      },
    ],
    order: [["dia", "ASC"], ["hora_inicio", "ASC"]],
  });
}

export async function crearHorario(datos) {
  const error = validarBloque(datos);
  if (error) throw new ErrorHandler(400, error);
  if (!datos.id_asignacion) throw new ErrorHandler(400, "La asignación es obligatoria");

  const { id_curso, id_profesor } = await resolverAsignacion(datos.id_asignacion);
  const candidato = {
    id_curso,
    id_profesor,
    aula: datos.aula || null,
    dia: Number(datos.dia),
    hora_inicio: datos.hora_inicio,
    hora_fin: datos.hora_fin,
  };
  const conflictos = detectarConflictos(await bloquesResueltos(), candidato);
  if (conflictos.length > 0) {
    throw new ErrorHandler(409, conflictos[0].detalle);
  }
  return Horario.create({
    id_asignacion: Number(datos.id_asignacion),
    dia: candidato.dia,
    hora_inicio: candidato.hora_inicio,
    hora_fin: candidato.hora_fin,
    aula: candidato.aula,
  });
}

export async function eliminarHorario(id) {
  const horario = await Horario.findByPk(Number(id));
  if (!horario) throw new ErrorHandler(404, "No se encontró el horario");
  await horario.destroy();
  return { ok: true, mensaje: "Horario eliminado" };
}
