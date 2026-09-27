/**
 * Reglas puras de planes de estudio (sin DB, testeables con node --test).
 */

/** Año válido dentro de un plan: entero 1-7. */
export function esAnioValido(anio) {
  const n = Number(anio);
  return Number.isInteger(n) && n >= 1 && n <= 7;
}

const ESTADOS = ["borrador", "vigente", "historico"];

/** Estado válido de un plan. */
export function esEstadoValido(estado) {
  return ESTADOS.includes(estado);
}

/**
 * Un plan histórico es de solo lectura: no admite agregar/quitar materias
 * ni correlativas. Borrador y vigente sí.
 */
export function admiteEdicionContenido(estado) {
  return estado === "borrador" || estado === "vigente";
}

/**
 * Regla de correlativas v1: la materia requerida debe ser del mismo plan,
 * distinta, y de un año menor o igual (sin detección de ciclos transitivos).
 * Devuelve null si es válida o el mensaje de error.
 */
export function validarCorrelativa({ mismoPlan, esDistinta, anioMateria, anioReq }) {
  if (!mismoPlan) return "Las materias deben pertenecer al mismo plan";
  if (!esDistinta) return "Una materia no puede ser correlativa de sí misma";
  if (!esAnioValido(anioMateria) || !esAnioValido(anioReq)) {
    return "Año de materia inválido";
  }
  if (Number(anioReq) > Number(anioMateria)) {
    return "La correlativa debe ser de un año menor o igual";
  }
  return null;
}

/**
 * Normaliza los filtros de GET /planes/vigentes. Devuelve
 * { anio: number|null, idCurso: number|null } o lanza Error simple.
 */
export function normalizarFiltrosVigentes({ anio, curso }) {
  const idCurso = curso === undefined || curso === null || curso === "" ? null : Number(curso);
  if (idCurso !== null && (!Number.isInteger(idCurso) || idCurso <= 0)) {
    throw new Error("Parámetro curso inválido");
  }
  const anioNum = anio === undefined || anio === null || anio === "" ? null : Number(anio);
  if (anioNum !== null && !esAnioValido(anioNum)) {
    throw new Error("Parámetro anio inválido (1-7)");
  }
  return { anio: anioNum, idCurso };
}
