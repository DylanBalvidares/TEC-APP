import ErrorHandler from "../../utils/ErrorHandler.js";
import { Op } from "sequelize";
import {
  admiteEdicionContenido,
  esAnioValido,
  esEstadoValido,
  normalizarFiltrosVigentes,
  validarCorrelativa,
} from "../../utils/planesReglas.js";
import {
  Correlativa,
  Curso,
  Materia,
  PlanEstudio,
  PlanMateria,
} from "../../db/models/index.js";
import sequelize from "../../db/conexionDB.js";

const MATERIA_ATTRS = ["id_materia", "nombre_materia", "carga_horaria"];

const INCLUDE_DETALLE = [
  {
    model: PlanMateria,
    as: "materiasPlan",
    include: [
      { model: Materia, as: "materia", attributes: MATERIA_ATTRS },
      {
        model: Correlativa,
        as: "correlativas",
        include: [
          {
            model: PlanMateria,
            as: "requerida",
            include: [{ model: Materia, as: "materia", attributes: MATERIA_ATTRS }],
          },
        ],
      },
    ],
  },
];

async function obtenerTodosPlanes() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodosPlanes");
  try {
    const planes = await PlanEstudio.findAll({
      include: INCLUDE_DETALLE,
      order: [["orientacion", "ASC"], ["nombre", "ASC"]],
    });
    if (!planes.length) {
      throw new ErrorHandler(404, "No se encontraron planes de estudio");
    }
    return planes;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodosPlanes:", error);
    throw new ErrorHandler(500, "Error interno al obtener planes de estudio");
  }
}

async function obtenerPlan(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerPlan");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de plan inválida");
    }
    const plan = await PlanEstudio.findByPk(id, { include: INCLUDE_DETALLE });
    if (!plan) {
      throw new ErrorHandler(404, "No se encontró el plan de estudio");
    }
    return plan;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerPlan:", error);
    throw new ErrorHandler(500, "Error interno al obtener el plan de estudio");
  }
}

/**
 * Planes vigentes, opcionalmente filtrados por año y/o curso.
 * Con año: solo devuelve planes con al menos una materia en ese año
 * (y las materias/correlativas recortadas a ese año).
 */
async function obtenerVigentes({ anio, curso } = {}) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerVigentes");
  try {
    let filtros;
    try {
      filtros = normalizarFiltrosVigentes({ anio, curso });
    } catch {
      throw new ErrorHandler(400, "Parámetros anio/curso inválidos");
    }

    let anioFiltro = filtros.anio;
    if (filtros.idCurso !== null) {
      const cursoDb = await Curso.findByPk(filtros.idCurso, { attributes: ["id_curso", "anio"] });
      if (!cursoDb) {
        throw new ErrorHandler(404, "No se encontró el curso indicado");
      }
      if (anioFiltro === null) anioFiltro = cursoDb.anio;
    }

    const includeMaterias = {
      model: PlanMateria,
      as: "materiasPlan",
      ...(anioFiltro !== null ? { where: { anio: anioFiltro } } : {}),
      required: anioFiltro !== null,
      include: [
        { model: Materia, as: "materia", attributes: MATERIA_ATTRS },
        {
          model: Correlativa,
          as: "correlativas",
          include: [
            {
              model: PlanMateria,
              as: "requerida",
              include: [{ model: Materia, as: "materia", attributes: MATERIA_ATTRS }],
            },
          ],
        },
      ],
    };

    const planes = await PlanEstudio.findAll({
      where: { estado: "vigente" },
      include: [includeMaterias],
      order: [["orientacion", "ASC"], ["nombre", "ASC"]],
    });
    if (!planes.length) {
      throw new ErrorHandler(404, "No hay planes vigentes para el criterio indicado");
    }
    return planes;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerVigentes:", error);
    throw new ErrorHandler(500, "Error interno al obtener planes vigentes");
  }
}

/**
 * Al activar un plan (estado=vigente), los demás vigentes de la misma
 * orientación pasan a histórico. Debe llamarse dentro de una transacción.
 */
async function aplicarVigenciaUnica(plan, transaction) {
  await PlanEstudio.update(
    { estado: "historico" },
    {
      where: {
        orientacion: plan.orientacion,
        estado: "vigente",
        id_plan: { [Op.ne]: plan.id_plan },
      },
      transaction,
    },
  );
}

async function crearPlan(data) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearPlan");
  const t = await sequelize.transaction();
  try {
    const { nombre, codigo, orientacion, descripcion, duracion_anios, estado, fecha_vigencia_desde, fecha_vigencia_hasta } = data || {};
    if (!nombre?.trim() || !codigo?.trim() || !orientacion?.trim()) {
      throw new ErrorHandler(400, "nombre, codigo y orientacion son obligatorios");
    }
    const estadoFinal = estado || "borrador";
    if (!esEstadoValido(estadoFinal)) {
      throw new ErrorHandler(400, "Estado de plan inválido");
    }
    const plan = await PlanEstudio.create(
      {
        nombre: nombre.trim(),
        codigo: codigo.trim(),
        orientacion: orientacion.trim(),
        descripcion: descripcion?.trim() || null,
        duracion_anios: duracion_anios ?? null,
        estado: estadoFinal,
        fecha_vigencia_desde: fecha_vigencia_desde || null,
        fecha_vigencia_hasta: fecha_vigencia_hasta || null,
      },
      { transaction: t },
    );
    if (estadoFinal === "vigente") {
      await aplicarVigenciaUnica(plan, t);
    }
    await t.commit();
    return plan;
  } catch (error) {
    await t.rollback();
    if (error instanceof ErrorHandler) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(409, "Ya existe un plan con ese nombre o código");
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearPlan:", error);
    throw new ErrorHandler(500, "Error interno al crear el plan de estudio");
  }
}

async function modificarPlan(data) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarPlan");
  const t = await sequelize.transaction();
  try {
    const { id_plan, nombre, codigo, orientacion, descripcion, duracion_anios, estado, fecha_vigencia_desde, fecha_vigencia_hasta } = data || {};
    if (!id_plan || id_plan < 0) {
      throw new ErrorHandler(400, "ID de plan inválida");
    }
    const plan = await PlanEstudio.findByPk(id_plan, { transaction: t });
    if (!plan) {
      throw new ErrorHandler(404, "No se encontró el plan de estudio");
    }
    if (estado !== undefined && !esEstadoValido(estado)) {
      throw new ErrorHandler(400, "Estado de plan inválido");
    }
    const cambios = {};
    if (nombre !== undefined) {
      if (!nombre?.trim()) throw new ErrorHandler(400, "El nombre no puede estar vacío");
      cambios.nombre = nombre.trim();
    }
    if (codigo !== undefined) {
      if (!codigo?.trim()) throw new ErrorHandler(400, "El código no puede estar vacío");
      cambios.codigo = codigo.trim();
    }
    if (orientacion !== undefined) {
      if (!orientacion?.trim()) throw new ErrorHandler(400, "La orientación no puede estar vacía");
      cambios.orientacion = orientacion.trim();
    }
    if (descripcion !== undefined) cambios.descripcion = descripcion?.trim() || null;
    if (duracion_anios !== undefined) cambios.duracion_anios = duracion_anios ?? null;
    if (estado !== undefined) cambios.estado = estado;
    if (fecha_vigencia_desde !== undefined) cambios.fecha_vigencia_desde = fecha_vigencia_desde || null;
    if (fecha_vigencia_hasta !== undefined) cambios.fecha_vigencia_hasta = fecha_vigencia_hasta || null;

    await plan.update(cambios, { transaction: t });
    if (cambios.estado === "vigente") {
      await aplicarVigenciaUnica(plan, t);
    }
    await t.commit();
    return plan;
  } catch (error) {
    await t.rollback();
    if (error instanceof ErrorHandler) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(409, "Ya existe un plan con ese nombre o código");
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarPlan:", error);
    throw new ErrorHandler(500, "Error interno al modificar el plan de estudio");
  }
}

async function eliminarPlan(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarPlan");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de plan inválida");
    }
    const plan = await PlanEstudio.findByPk(id);
    if (!plan) {
      throw new ErrorHandler(404, "No se encontró el plan de estudio");
    }
    if (plan.estado === "vigente") {
      throw new ErrorHandler(409, "No se puede eliminar un plan vigente: pasalo a histórico primero");
    }
    await plan.destroy();
    return { message: "Plan de estudio eliminado" };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarPlan:", error);
    throw new ErrorHandler(500, "Error interno al eliminar el plan de estudio");
  }
}

async function agregarMateriaAPlan(id_plan, data) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: agregarMateriaAPlan");
  try {
    if (!id_plan || id_plan < 0) {
      throw new ErrorHandler(400, "ID de plan inválida");
    }
    const plan = await PlanEstudio.findByPk(id_plan);
    if (!plan) {
      throw new ErrorHandler(404, "No se encontró el plan de estudio");
    }
    if (!admiteEdicionContenido(plan.estado)) {
      throw new ErrorHandler(409, "No se puede editar el contenido de un plan histórico");
    }
    const { id_materia, anio, cuatrimestre } = data || {};
    if (!id_materia || id_materia < 0) {
      throw new ErrorHandler(400, "ID de materia inválida");
    }
    if (!esAnioValido(anio)) {
      throw new ErrorHandler(400, "Año inválido (1-7)");
    }
    const materia = await Materia.findByPk(id_materia);
    if (!materia) {
      throw new ErrorHandler(404, "No se encontró la materia indicada");
    }
    const vinculo = await PlanMateria.create({
      id_plan,
      id_materia,
      anio: Number(anio),
      cuatrimestre: cuatrimestre || "anual",
    });
    return vinculo;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(409, "Esa materia ya está en ese año del plan");
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en agregarMateriaAPlan:", error);
    throw new ErrorHandler(500, "Error interno al agregar la materia al plan");
  }
}

async function quitarMateriaDePlan(id_plan_materia) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: quitarMateriaDePlan");
  try {
    if (!id_plan_materia || id_plan_materia < 0) {
      throw new ErrorHandler(400, "ID de vínculo inválida");
    }
    const vinculo = await PlanMateria.findByPk(id_plan_materia, {
      include: [{ model: PlanEstudio, as: "plan", attributes: ["estado"] }],
    });
    if (!vinculo) {
      throw new ErrorHandler(404, "No se encontró el vínculo materia-plan");
    }
    if (!admiteEdicionContenido(vinculo.plan?.estado)) {
      throw new ErrorHandler(409, "No se puede editar el contenido de un plan histórico");
    }
    await vinculo.destroy();
    return { message: "Materia quitada del plan" };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en quitarMateriaDePlan:", error);
    throw new ErrorHandler(500, "Error interno al quitar la materia del plan");
  }
}

async function agregarCorrelativa(id_plan_materia, data) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: agregarCorrelativa");
  try {
    if (!id_plan_materia || id_plan_materia < 0) {
      throw new ErrorHandler(400, "ID de vínculo inválida");
    }
    const { id_plan_materia_req } = data || {};
    if (!id_plan_materia_req || id_plan_materia_req < 0) {
      throw new ErrorHandler(400, "ID de materia requerida inválida");
    }
    const vinculo = await PlanMateria.findByPk(id_plan_materia, {
      include: [{ model: PlanEstudio, as: "plan", attributes: ["estado"] }],
    });
    if (!vinculo) {
      throw new ErrorHandler(404, "No se encontró el vínculo materia-plan");
    }
    if (!admiteEdicionContenido(vinculo.plan?.estado)) {
      throw new ErrorHandler(409, "No se puede editar el contenido de un plan histórico");
    }
    const requerida = await PlanMateria.findByPk(id_plan_materia_req);
    if (!requerida) {
      throw new ErrorHandler(404, "No se encontró la materia requerida indicada");
    }
    const motivo = validarCorrelativa({
      mismoPlan: Number(requerida.id_plan) === Number(vinculo.id_plan),
      esDistinta: Number(requerida.id_plan_materia) !== Number(vinculo.id_plan_materia),
      anioMateria: vinculo.anio,
      anioReq: requerida.anio,
    });
    if (motivo) {
      throw new ErrorHandler(409, motivo);
    }
    const correlativa = await Correlativa.create({
      id_plan_materia,
      id_plan_materia_req,
    });
    return correlativa;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(409, "Esa correlativa ya existe");
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en agregarCorrelativa:", error);
    throw new ErrorHandler(500, "Error interno al agregar la correlativa");
  }
}

async function quitarCorrelativa(id_plan_materia, id_req) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: quitarCorrelativa");
  try {
    if (!id_plan_materia || id_plan_materia < 0 || !id_req || id_req < 0) {
      throw new ErrorHandler(400, "IDs de correlativa inválidos");
    }
    const filas = await Correlativa.destroy({
      where: { id_plan_materia, id_plan_materia_req: id_req },
    });
    if (!filas) {
      throw new ErrorHandler(404, "No se encontró la correlativa indicada");
    }
    return { message: "Correlativa eliminada" };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en quitarCorrelativa:", error);
    throw new ErrorHandler(500, "Error interno al eliminar la correlativa");
  }
}

/**
 * Anota asignaciones (instancias Sequelize con include cursoAsignacion) con
 * `en_plan`: true si (materia, año del curso) figura en algún plan vigente,
 * false si no, null si el curso no tiene año cargado. Solo informativa.
 */
async function anotarEnPlan(asignaciones) {
  try {
    const vigentes = await PlanEstudio.findAll({
      where: { estado: "vigente" },
      include: [{ model: PlanMateria, as: "materiasPlan", attributes: ["id_materia", "anio"] }],
    });
    const pares = new Set();
    for (const p of vigentes) {
      for (const m of p.materiasPlan || []) {
        pares.add(`${m.id_materia}:${m.anio}`);
      }
    }
    for (const a of asignaciones || []) {
      const anio = a.cursoAsignacion?.anio ?? a.cursoAsignacion?.dataValues?.anio ?? null;
      const enPlan = anio == null ? null : pares.has(`${a.id_materia}:${Number(anio)}`);
      if (typeof a.setDataValue === "function") a.setDataValue("en_plan", enPlan);
      else a.en_plan = enPlan;
    }
    return asignaciones;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en anotarEnPlan:", error);
    return asignaciones;
  }
}

export {
  obtenerTodosPlanes,
  obtenerPlan,
  obtenerVigentes,
  crearPlan,
  modificarPlan,
  eliminarPlan,
  agregarMateriaAPlan,
  quitarMateriaDePlan,
  agregarCorrelativa,
  quitarCorrelativa,
  anotarEnPlan,
};
