import { Op, fn, col } from "sequelize";
import ErrorHandler from "../../utils/ErrorHandler.js";
import {
  Alumno,
  Curso,
  Asistencia,
  Nota,
  Asignacion,
  Materia,
} from "../../db/models/index.js";

// Alias SQL que Sequelize genera para un include anidado
// Nota -> Asignacion -> Materia. MySQL no resuelve rutas de asociación en el
// GROUP BY, así que el promedio por materia se agrupa por ese alias real.
const ALIAS_MATERIA_DE_ASIGNACION = "asignacione->materiaAsignacion";

function hace30Dias() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export async function obtenerResumenReportes() {
  try {
    const [cursos, asistencias, promedios, estados] = await Promise.all([
      Curso.findAll({
        attributes: ["id_curso", "nombre_curso"],
        include: [
          {
            model: Alumno,
            attributes: ["id_alumno", "estado"],
          },
        ],
      }),
      Asistencia.findAll({
        where: { fecha: { [Op.gte]: hace30Dias() } },
        attributes: ["id_curso", "estado", [fn("COUNT", col("id_asistencia")), "cantidad"]],
        group: ["id_curso", "estado"],
        raw: true,
      }),
      Nota.findAll({
        attributes: [
          [col(`${ALIAS_MATERIA_DE_ASIGNACION}.id_materia`), "id_materia"],
          [col(`${ALIAS_MATERIA_DE_ASIGNACION}.nombre_materia`), "nombre_materia"],
          [fn("AVG", col("notas.calificacion")), "promedio"],
        ],
        include: [
          {
            model: Asignacion,
            as: "asignacione",
            attributes: [],
            include: [
              {
                model: Materia,
                as: "materiaAsignacion",
                attributes: [],
              },
            ],
          },
        ],
        group: [
          col(`${ALIAS_MATERIA_DE_ASIGNACION}.id_materia`),
          col(`${ALIAS_MATERIA_DE_ASIGNACION}.nombre_materia`),
        ],
        raw: true,
      }),
      Alumno.findAll({
        attributes: ["estado", [fn("COUNT", col("id_alumno")), "cantidad"]],
        group: ["estado"],
        raw: true,
      }),
    ]);

    const retencion = cursos.map((c) => {
      const lista = c.Alumnos || c.alumnos || [];
      const activos = lista.filter((a) => (a.estado ?? a.dataValues?.estado) !== "baja").length;
      const total = lista.length;
      return {
        id_curso: c.id_curso,
        nombre: c.nombre_curso,
        activos,
        bajas: total - activos,
        total,
        retencion_pct: total > 0 ? Math.round((activos / total) * 100) : 100,
      };
    });

    const promediosPorMateria = [];
    for (const n of promedios) {
      const plano = typeof n.toJSON === "function" ? n.toJSON() : n;
      const mat =
        plano.id_materia !== undefined && plano.id_materia !== null
          ? plano
          : plano.Asignacion?.materiaAsignacion || plano.asignacion?.materia;
      if (!mat) continue;
      promediosPorMateria.push({
        id_materia: mat.id_materia,
        nombre: mat.nombre_materia,
        promedio: plano.promedio === null ? null : Number(Number(plano.promedio).toFixed(2)),
      });
    }

    const altasBajas = {};
    for (const e of estados) {
      altasBajas[e.estado || "sin_estado"] = Number(e.cantidad);
    }

    return { retencion, asistenciaPorCurso: asistencias, promediosPorMateria, altasBajas };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("[ERROR] obtenerResumenReportes:", error.message);
    throw new ErrorHandler(500, "Error interno al generar reportes");
  }
}

