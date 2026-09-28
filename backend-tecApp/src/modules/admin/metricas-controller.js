import { Op } from "sequelize";
import ErrorHandler from "../../utils/ErrorHandler.js";
import {
  Alumno,
  Profesor,
  Curso,
  Asistencia,
  Comunicado,
} from "../../db/models/index.js";



// Caché en memoria de 60 s: las métricas agregan varias tablas y el panel
// las pide en cada visita a Overview.
const CACHE_TTL_MS = 60 * 1000;
let cache = { fecha: 0, datos: null };

function hoyLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function calcularMetricas() {
  const [
    totalAlumnos,
    alumnosActivos,
    alumnosSinCurso,
    totalProfesores,
    totalCursos,
    totalComunicados,
    asistenciaHoy,
    ultimosAlumnos,
    comunicadosRecientes,
  ] = await Promise.all([
    Alumno.count(),
    Alumno.count({ where: { estado: { [Op.ne]: "baja" } } }),
    Alumno.count({ where: { id_curso: null } }),
    Profesor.count(),
    Curso.count(),
    Comunicado.count(),
    Asistencia.findAll({
      where: { fecha: hoyLocal() },
      attributes: ["estado"],
    }),
    Alumno.findAll({
      order: [["id_alumno", "DESC"]],
      limit: 3,
      attributes: ["id_alumno", "nombre", "apellido", "dni", "id_curso"],
      include: [{ model: Curso, attributes: ["nombre_curso"] }],
    }),
    Comunicado.findAll({
      order: [["fecha_publicacion", "DESC"]],
      limit: 4,
      attributes: ["id_comunicado", "titulo", "destino", "fecha_publicacion"],
    }),
  ]);

  // El seed histórico usa 'tardanza' y el modelo 'tarde': se unifican.
  const porEstado = { presente: 0, ausente: 0, tarde: 0, justificado: 0 };
  for (const r of asistenciaHoy) {
    let estado = r.estado ?? r?.dataValues?.estado;
    if (estado === "tardanza") estado = "tarde";
    if (estado in porEstado) porEstado[estado] += 1;
  }

  return {
    totales: {
      alumnos: totalAlumnos,
      alumnosActivos,
      alumnosSinCurso,
      profesores: totalProfesores,
      cursos: totalCursos,
      comunicados: totalComunicados,
    },
    asistenciaHoy: { total: asistenciaHoy.length, ...porEstado },
    ultimosAlumnos: ultimosAlumnos.map((a) => a.toJSON()),
    comunicadosRecientes: comunicadosRecientes.map((c) => c.toJSON()),
  };
}

export async function obtenerMetricas() {
  const ahora = Date.now();
  if (cache.datos && ahora - cache.fecha < CACHE_TTL_MS) {
    return { ...cache.datos, cache: true };
  }
  try {
    const datos = await calcularMetricas();
    cache = { fecha: ahora, datos };
    return { ...datos, cache: false };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("[ERROR] obtenerMetricas:", error.message);
    throw new ErrorHandler(500, "Error interno al calcular métricas");
  }
}

// Solo para tests: permite invalidar la caché.
export function limpiarCacheMetricas() {
  cache = { fecha: 0, datos: null };
}
