// Detector puro de solapamientos de horarios (E3). Sin DB: recibe los
// bloques existentes ya resueltos (con id_curso, id_profesor y aula) y el
// candidato, y devuelve la lista de conflictos.

function aMinutos(hora) {
  const [h, m] = String(hora).split(":").map(Number);
  return h * 60 + m;
}

export function bloquesSeSolapan(aInicio, aFin, bInicio, bFin) {
  return aMinutos(aInicio) < aMinutos(bFin) && aMinutos(bInicio) < aMinutos(aFin);
}

export function validarBloque(bloque) {
  if (!bloque) return "Bloque inválido";
  if (!Number.isInteger(bloque.dia) || bloque.dia < 1 || bloque.dia > 6) {
    return "El día debe ser un entero entre 1 (lunes) y 6 (sábado)";
  }
  const formato = /^\d{2}:\d{2}$/;
  if (!formato.test(bloque.hora_inicio || "") || !formato.test(bloque.hora_fin || "")) {
    return "El horario debe tener formato HH:MM";
  }
  if (aMinutos(bloque.hora_inicio) >= aMinutos(bloque.hora_fin)) {
    return "La hora de inicio debe ser anterior a la de fin";
  }
  return "";
}

/**
 * @param {Array} existentes - [{ id_horario, id_curso, id_profesor, aula, dia, hora_inicio, hora_fin }]
 * @param {Object} candidato - mismo formato (id_horario opcional para excluirse en edición)
 * @returns {Array<{ tipo, id_horario, detalle }>} conflictos (vacío = sin conflicto)
 */
export function detectarConflictos(existentes = [], candidato) {
  const error = validarBloque(candidato);
  if (error) return [{ tipo: "formato", id_horario: null, detalle: error }];

  const conflictos = [];
  for (const e of existentes) {
    if (candidato.id_horario && e.id_horario === candidato.id_horario) continue;
    if (Number(e.dia) !== Number(candidato.dia)) continue;
    if (!bloquesSeSolapan(e.hora_inicio, e.hora_fin, candidato.hora_inicio, candidato.hora_fin)) {
      continue;
    }
    if (e.id_curso && candidato.id_curso && Number(e.id_curso) === Number(candidato.id_curso)) {
      conflictos.push({
        tipo: "curso",
        id_horario: e.id_horario,
        detalle: `El curso ya tiene clases en ese horario (${e.hora_inicio}-${e.hora_fin})`,
      });
    }
    if (e.id_profesor && candidato.id_profesor && Number(e.id_profesor) === Number(candidato.id_profesor)) {
      conflictos.push({
        tipo: "profesor",
        id_horario: e.id_horario,
        detalle: `El profesor ya tiene clases en ese horario (${e.hora_inicio}-${e.hora_fin})`,
      });
    }
    const aulaE = String(e.aula || "").trim().toLowerCase();
    const aulaC = String(candidato.aula || "").trim().toLowerCase();
    if (aulaE && aulaC && aulaE === aulaC) {
      conflictos.push({
        tipo: "aula",
        id_horario: e.id_horario,
        detalle: `El aula ${candidato.aula} ya está ocupada en ese horario`,
      });
    }
  }
  return conflictos;
}
