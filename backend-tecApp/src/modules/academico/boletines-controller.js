import ErrorHandler from "../../utils/ErrorHandler.js";
import {
  PeriodoBoletin,
  BoletinMateria,
  BoletinCalificacion,
  BoletinFinalizacion,
  BoletinReapertura,
  BoletinHistorial,
  Alumno,
  Asignacion,
  Curso,
  Materia,
  Profesor,
  Personal,
  Usuario,
  PlanEstudio,
  PlanMateria,
} from "../../db/models/index.js";

const TIPOS_CALIFICACION = ["numerica", "TED", "TEP", "TEA", "sin_calificar"];
const ESTADOS_PERIODO = ["programado", "abierto", "cerrado"];

// Fecha local YYYY-MM-DD (mismo criterio que la libreta: DATEONLY).
const hoyISO = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${dia}`;
};

// El período rige si no está cerrado manualmente y hoy cae entre inicio/cierre.
// El cierre es lazy (se evalúa en cada escritura): no hay cron.
function periodoEscribible(periodo) {
  if (!periodo || periodo.estado !== "abierto") return false;
  const hoy = hoyISO();
  return periodo.fecha_inicio <= hoy && hoy <= periodo.fecha_cierre;
}

const mostrarCalificacion = (fila) => {
  if (!fila) return null;
  if (fila.tipo === "numerica") return String(Number(fila.valor));
  return fila.tipo;
};

async function obtenerPeriodoExigido(idPeriodo) {
  const periodo = idPeriodo
    ? await PeriodoBoletin.findByPk(idPeriodo)
    : await PeriodoBoletin.findOne({
        order: [
          ["ciclo_lectivo", "DESC"],
          ["cuatrimestre", "DESC"],
        ],
      });
  if (!periodo) {
    throw new ErrorHandler(404, "No hay período de boletín para esa consulta");
  }
  return periodo;
}

// ¿Puede escribirse una calificación en esta materia?
// - Materia finalizada → solo con reapertura aprobada posterior al cierre.
// - En curso → solo si el período rige (fechas + no cerrado).
async function puedeEscribir(periodo, idAsignacion) {
  const finalizacion = await BoletinFinalizacion.findOne({
    where: { id_periodo: periodo.id_periodo, id_asignacion: idAsignacion },
  });
  if (!finalizacion) {
    return { ok: false, motivo: "La materia no fue preparada para este período" };
  }
  const reapertura = await BoletinReapertura.findOne({
    where: {
      id_periodo: periodo.id_periodo,
      id_asignacion: idAsignacion,
      estado: "aprobada",
    },
    order: [["fecha_decision", "DESC"]],
  });
  const reaperturaVigente = Boolean(
    reapertura?.fecha_decision &&
    finalizacion.fecha_finalizacion &&
    new Date(reapertura.fecha_decision) > new Date(finalizacion.fecha_finalizacion),
  );
  if (finalizacion.estado === "finalizada") {
    if (reaperturaVigente) {
      return { ok: true, finalizacion };
    }
    return { ok: false, motivo: "La materia está finalizada: requiere reapertura aprobada" };
  }
  // Una reapertura aprobada autoriza la corrección incluso después del cierre.
  // Al volver a finalizar, fecha_finalizacion avanza y esa autorización deja de regir.
  if (finalizacion.estado === "en_progreso" && reaperturaVigente) {
    return { ok: true, finalizacion };
  }
  if (!periodoEscribible(periodo)) {
    return { ok: false, motivo: "El período de carga no está vigente" };
  }
  return { ok: true, finalizacion };
}

async function exigirProfesorDuenio(idAsignacion, idUsuarioAuth, idPeriodo) {
  const profesor = await Profesor.findOne({ where: { id_usuario: idUsuarioAuth } });
  const asignacion = await Asignacion.findByPk(idAsignacion);
  if (!asignacion) {
    throw new ErrorHandler(404, "La asignación especificada no existe");
  }
  let idProfesorResponsable = asignacion.id_profesor;
  if (idPeriodo) {
    const snapshot = await BoletinMateria.findOne({
      where: {
        id_periodo: idPeriodo,
        id_asignacion: idAsignacion,
      },
    });
    if (!snapshot) {
      throw new ErrorHandler(403, "La materia no pertenece al boletín preparado para este período");
    }
    idProfesorResponsable = snapshot.id_profesor;
  }
  if (!profesor || Number(idProfesorResponsable) !== Number(profesor.id_profesor)) {
    throw new ErrorHandler(
      403,
      "Acceso denegado: No podés cargar en una materia que no tenés asignada",
    );
  }
  return { profesor, asignacion };
}

// ==========================================
// Períodos (administración)
// ==========================================
async function listarPeriodos() {
  const periodos = await PeriodoBoletin.findAll({
    order: [
      ["ciclo_lectivo", "DESC"],
      ["cuatrimestre", "DESC"],
    ],
  });
  return periodos.map((p) => ({
    ...p.toJSON(),
    vigente: periodoEscribible(p),
  }));
}

async function crearPeriodo(datos) {
  const { ciclo_lectivo, cuatrimestre, fecha_inicio, fecha_cierre, estado } = datos;
  try {
    const faltantes = [];
    if (!ciclo_lectivo) faltantes.push("ciclo_lectivo");
    if (!cuatrimestre) faltantes.push("cuatrimestre");
    if (!fecha_inicio) faltantes.push("fecha_inicio");
    if (!fecha_cierre) faltantes.push("fecha_cierre");
    if (faltantes.length) {
      throw new ErrorHandler(
        400,
        `Faltan campos obligatorios del período: ${faltantes.join(", ")}`,
      );
    }
    if (!["1", "2"].includes(String(cuatrimestre))) {
      throw new ErrorHandler(400, "El cuatrimestre debe ser 1 o 2");
    }
    if (fecha_inicio > fecha_cierre) {
      throw new ErrorHandler(400, "La fecha de inicio no puede ser posterior al cierre");
    }
    if (estado && !ESTADOS_PERIODO.includes(estado)) {
      throw new ErrorHandler(400, "Estado de período inválido");
    }
    return await PeriodoBoletin.create({
      ciclo_lectivo,
      cuatrimestre: String(cuatrimestre),
      fecha_inicio,
      fecha_cierre,
      estado: estado || "programado",
    });
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(409, "Ya existe un período para ese ciclo y cuatrimestre");
    }
    throw new ErrorHandler(500, "Error interno al crear el período");
  }
}

async function actualizarPeriodo(idPeriodo, datos) {
  const periodo = await PeriodoBoletin.findByPk(idPeriodo);
  if (!periodo) {
    throw new ErrorHandler(404, "El período especificado no existe");
  }
  const { fecha_inicio, fecha_cierre, estado } = datos;
  const inicio = fecha_inicio || periodo.fecha_inicio;
  const cierre = fecha_cierre || periodo.fecha_cierre;
  if (inicio > cierre) {
    throw new ErrorHandler(400, "La fecha de inicio no puede ser posterior al cierre");
  }
  if (estado && !ESTADOS_PERIODO.includes(estado)) {
    throw new ErrorHandler(400, "Estado de período inválido");
  }
  if (fecha_inicio) periodo.fecha_inicio = fecha_inicio;
  if (fecha_cierre) periodo.fecha_cierre = fecha_cierre;
  if (estado) periodo.estado = estado;
  await periodo.save();
  return { ...periodo.toJSON(), vigente: periodoEscribible(periodo) };
}

// Fija el snapshot de materias aplicables de un curso para un período.
// Idempotente: las materias ya fijadas se conservan.
async function prepararCurso(idPeriodo, idCurso, idPlan) {
  const periodo = await PeriodoBoletin.findByPk(idPeriodo);
  if (!periodo) {
    throw new ErrorHandler(404, "El período especificado no existe");
  }
  const curso = await Curso.findByPk(idCurso);
  if (!curso) {
    throw new ErrorHandler(404, "El curso especificado no existe");
  }
  if (Number(curso.ciclo_lectivo) !== Number(periodo.ciclo_lectivo)) {
    throw new ErrorHandler(
      400,
      "El curso pertenece a otro ciclo lectivo y no puede prepararse en este período",
    );
  }
  if (!curso.anio) {
    throw new ErrorHandler(400, "El curso debe tener un año asignado para preparar el boletín");
  }
  if (!idPlan) {
    throw new ErrorHandler(400, "Seleccioná el plan de estudios aplicable al curso");
  }
  const plan = await PlanEstudio.findByPk(idPlan, {
    include: [{ model: PlanMateria, as: "materiasPlan" }],
  });
  if (!plan || plan.estado === "borrador") {
    throw new ErrorHandler(400, "El plan de estudios no existe o todavía está en borrador");
  }
  const inicioCiclo = `${periodo.ciclo_lectivo}-01-01`;
  const cierreCiclo = `${periodo.ciclo_lectivo}-12-31`;
  if (
    (plan.fecha_vigencia_desde && plan.fecha_vigencia_desde > cierreCiclo) ||
    (plan.fecha_vigencia_hasta && plan.fecha_vigencia_hasta < inicioCiclo)
  ) {
    throw new ErrorHandler(400, "El plan seleccionado no estaba vigente durante ese ciclo lectivo");
  }
  const materiasPlan = (plan.materiasPlan || []).filter((m) =>
    Number(m.anio) === Number(curso.anio) &&
    ["anual", String(periodo.cuatrimestre)].includes(String(m.cuatrimestre)),
  );
  if (!materiasPlan.length) {
    throw new ErrorHandler(400, "El plan seleccionado no tiene materias para el año y cuatrimestre del curso");
  }
  const materiasIds = materiasPlan.map((m) => m.id_materia);
  const asignacionesCurso = await Asignacion.findAll({
    where: { id_curso: idCurso },
    include: [{ model: Materia, as: "materiaAsignacion" }],
  });
  const asignacionPorMateria = new Map(asignacionesCurso.map((a) => [Number(a.id_materia), a]));
  const faltantes = materiasIds.filter((idMateria) => !asignacionPorMateria.has(Number(idMateria)));
  if (faltantes.length) {
    throw new ErrorHandler(400, `Falta asignar profesor/materia para ${faltantes.length} materia(s) del plan`);
  }
  const asignaciones = materiasIds.map((idMateria) => asignacionPorMateria.get(Number(idMateria)));
  const sinResponsable = asignaciones.filter((a) => !a.id_profesor);
  if (sinResponsable.length) {
    const nombres = sinResponsable.map(
      (a) => a.materiaAsignacion?.nombre_materia || `asignación ${a.id_asignacion}`,
    );
    throw new ErrorHandler(
      400,
      `No se puede preparar: hay materias sin profesor responsable (${nombres.join(", ")})`,
    );
  }
  const snapshotExistente = await BoletinMateria.findAll({
    where: { id_periodo: idPeriodo, id_curso: idCurso },
    attributes: ["id_asignacion", "id_plan"],
  });
  const asignacionesDelPlan = new Set(asignaciones.map((a) => Number(a.id_asignacion)));
  const fueraDelPlan = snapshotExistente.filter((m) => !asignacionesDelPlan.has(Number(m.id_asignacion)));
  if (fueraDelPlan.length) {
    throw new ErrorHandler(
      409,
      "El curso ya tiene un snapshot con materias ajenas al plan seleccionado. Administración debe revisarlo antes de volver a prepararlo.",
    );
  }
  if (snapshotExistente.some((m) => m.id_plan && Number(m.id_plan) !== Number(idPlan))) {
    throw new ErrorHandler(409, "El curso ya fue preparado con otro plan de estudios para este período");
  }
  for (const materiaExistente of snapshotExistente) {
    if (!materiaExistente.id_plan) {
      materiaExistente.id_plan = Number(idPlan);
      await materiaExistente.save();
    }
  }
  let fijadas = 0;
  let existentes = 0;
  for (const a of asignaciones) {
    const [, creadaMateria] = await BoletinMateria.findOrCreate({
      where: { id_periodo: idPeriodo, id_asignacion: a.id_asignacion },
      defaults: {
        id_periodo: idPeriodo,
        id_curso: idCurso,
        id_asignacion: a.id_asignacion,
        id_materia: a.id_materia,
        id_profesor: a.id_profesor,
        id_plan: Number(idPlan),
      },
    });
    if (creadaMateria) fijadas++;
    else existentes++;
    await BoletinFinalizacion.findOrCreate({
      where: { id_periodo: idPeriodo, id_asignacion: a.id_asignacion },
      defaults: { id_periodo: idPeriodo, id_asignacion: a.id_asignacion, estado: "pendiente" },
    });
  }
  return { id_periodo: Number(idPeriodo), id_curso: Number(idCurso), fijadas, existentes };
}

// ==========================================
// Carga del profesor
// ==========================================
async function obtenerCargaProfesor(idUsuario, idPeriodo) {
  const profesor = await Profesor.findOne({ where: { id_usuario: idUsuario } });
  if (!profesor) {
    throw new ErrorHandler(404, "No se encontró el perfil docente para este usuario");
  }
  const periodo = await obtenerPeriodoExigido(idPeriodo);
  const boletinMaterias = await BoletinMateria.findAll({
    where: { id_periodo: periodo.id_periodo, id_profesor: profesor.id_profesor },
  });
  const idsAsignacion = boletinMaterias.map((m) => m.id_asignacion);
  if (!idsAsignacion.length) {
    return { periodo, asignaciones: [], alumnos: [], calificaciones: [], finalizaciones: [], porAsignacion: {} };
  }
  const asignaciones = await Asignacion.findAll({
    where: { id_asignacion: idsAsignacion },
    include: [
      { model: Curso, as: "cursoAsignacion" },
      { model: Materia, as: "materiaAsignacion" },
    ],
  });
  const idsAsignacionActuales = asignaciones.map((a) => a.id_asignacion);
  if (!idsAsignacionActuales.length) {
    return { periodo, asignaciones: [], alumnos: [], calificaciones: [], finalizaciones: [], porAsignacion: {} };
  }
  const idsCursos = [...new Set(asignaciones.map((a) => a.id_curso))];
  const alumnos = await Alumno.findAll({
    where: { id_curso: idsCursos, estado: "activo" },
    attributes: ["id_alumno", "nombre", "apellido", "dni", "id_curso"],
    order: [["apellido", "ASC"], ["nombre", "ASC"]],
  });
  const calificaciones = await BoletinCalificacion.findAll({
    where: { id_periodo: periodo.id_periodo, id_asignacion: idsAsignacionActuales },
  });
  const finalizaciones = await BoletinFinalizacion.findAll({
    where: { id_periodo: periodo.id_periodo, id_asignacion: idsAsignacionActuales },
  });
  const snapshot = await BoletinMateria.findAll({
    where: { id_periodo: periodo.id_periodo, id_asignacion: idsAsignacionActuales },
  });
  const preparadas = new Set(snapshot.map((s) => s.id_asignacion));
  const porAsignacion = {};
  for (const a of asignaciones) {
    const escritura = await puedeEscribir(periodo, a.id_asignacion);
    porAsignacion[a.id_asignacion] = {
      preparada: preparadas.has(a.id_asignacion),
      puedeEscribir: escritura.ok,
      motivoBloqueo: escritura.ok ? null : escritura.motivo,
    };
  }
  return { periodo, asignaciones, alumnos, calificaciones, finalizaciones, porAsignacion };
}

function validarTipoCalificacion(tipo, valor, motivo) {
  if (!TIPOS_CALIFICACION.includes(tipo)) {
    throw new ErrorHandler(400, "Tipo de calificación inválido (numerica, TED, TEP, TEA, sin_calificar)");
  }
  if (tipo === "numerica") {
    if (valor === null || valor === undefined || valor === "") {
      throw new ErrorHandler(400, "La calificación numérica es obligatoria");
    }
    const num = Math.round(parseFloat(valor) * 10) / 10;
    if (isNaN(num) || num < 0.0 || num > 10.0) {
      throw new ErrorHandler(400, "La calificación debe ser un número entre 0 y 10");
    }
    return { valor: num, motivo: motivo || null };
  }
  if (tipo === "sin_calificar") {
    if (!motivo || !String(motivo).trim()) {
      throw new ErrorHandler(400, "“Sin calificar” exige un motivo obligatorio");
    }
    return { valor: null, motivo: String(motivo).trim() };
  }
  return { valor: null, motivo: motivo || null };
}

async function guardarCalificacion(datos, idUsuarioAuth, idRolAuth) {
  const { id_periodo, id_asignacion, id_alumno, tipo, valor, motivo } = datos;
  try {
    if (!id_periodo || !id_asignacion || !id_alumno || !tipo) {
      throw new ErrorHandler(400, "período, asignación, alumno y tipo son obligatorios");
    }
    const { valor: valorFinal, motivo: motivoFinal } = validarTipoCalificacion(tipo, valor, motivo);

    const periodo = await PeriodoBoletin.findByPk(id_periodo);
    if (!periodo) {
      throw new ErrorHandler(404, "El período especificado no existe");
    }
    if (parseInt(idRolAuth) === 3) {
      await exigirProfesorDuenio(id_asignacion, idUsuarioAuth, id_periodo);
    }
    const asignacion = await Asignacion.findByPk(id_asignacion);
    if (!asignacion) {
      throw new ErrorHandler(404, "La asignación especificada no existe");
    }
    const alumno = await Alumno.findByPk(id_alumno);
    if (!alumno) {
      throw new ErrorHandler(404, "El alumno especificado no existe");
    }
    if (alumno.id_curso !== asignacion.id_curso) {
      throw new ErrorHandler(400, "El alumno no pertenece al curso de esta materia");
    }

    const escritura = await puedeEscribir(periodo, id_asignacion);
    if (!escritura.ok) {
      throw new ErrorHandler(403, `No se puede escribir: ${escritura.motivo}`);
    }

    const existente = await BoletinCalificacion.findOne({
      where: { id_periodo, id_asignacion, id_alumno },
    });
    let fila;
    if (existente) {
      const anterior = mostrarCalificacion(existente);
      existente.tipo = tipo;
      existente.valor = valorFinal;
      existente.motivo = motivoFinal;
      await existente.save();
      fila = existente;
      await BoletinHistorial.create({
        id_periodo,
        id_asignacion,
        id_alumno,
        accion: "modificar",
        valor_anterior: anterior,
        valor_nuevo: mostrarCalificacion(fila),
        modificado_por: idUsuarioAuth,
        motivo: motivoFinal,
      });
    } else {
      fila = await BoletinCalificacion.create({
        id_periodo,
        id_asignacion,
        id_alumno,
        tipo,
        valor: valorFinal,
        motivo: motivoFinal,
      });
      await BoletinHistorial.create({
        id_periodo,
        id_asignacion,
        id_alumno,
        accion: "alta",
        valor_anterior: null,
        valor_nuevo: mostrarCalificacion(fila),
        modificado_por: idUsuarioAuth,
        motivo: motivoFinal,
      });
    }

    // Primera carga: la materia pasa a "en progreso".
    if (escritura.finalizacion && escritura.finalizacion.estado === "pendiente") {
      escritura.finalizacion.estado = "en_progreso";
      await escritura.finalizacion.save();
    }
    return fila;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El alumno o la asignación especificada no existe");
    }
    throw new ErrorHandler(500, "Error interno al guardar la calificación de boletín");
  }
}

// ==========================================
// Finalización por materia
// ==========================================
async function finalizarMateria(datos, idUsuarioAuth, idRolAuth) {
  const { id_periodo, id_asignacion } = datos;
  try {
    if (!id_periodo || !id_asignacion) {
      throw new ErrorHandler(400, "período y asignación son obligatorios");
    }
    const periodo = await PeriodoBoletin.findByPk(id_periodo);
    if (!periodo) {
      throw new ErrorHandler(404, "El período especificado no existe");
    }
    if (parseInt(idRolAuth) === 3) {
      await exigirProfesorDuenio(id_asignacion, idUsuarioAuth, id_periodo);
    }
    const asignacion = await Asignacion.findByPk(id_asignacion);
    if (!asignacion) {
      throw new ErrorHandler(404, "La asignación especificada no existe");
    }
    const escritura = await puedeEscribir(periodo, id_asignacion);
    if (!escritura.ok) {
      throw new ErrorHandler(403, `No se puede finalizar: ${escritura.motivo}`);
    }
    const alumnos = await Alumno.findAll({
      where: { id_curso: asignacion.id_curso, estado: "activo" },
      attributes: ["id_alumno", "nombre", "apellido"],
    });
    const cargadas = await BoletinCalificacion.findAll({
      where: { id_periodo, id_asignacion },
      attributes: ["id_alumno"],
    });
    const resueltos = new Set(cargadas.map((c) => c.id_alumno));
    // "Sin calificar" con motivo cuenta como resuelto; solo la ausencia
    // de fila es pendiente (nunca se auto-completa).
    const pendientes = alumnos.filter((a) => !resueltos.has(a.id_alumno));
    if (pendientes.length) {
      const nombres = pendientes.map((a) => `${a.apellido}, ${a.nombre}`).join("; ");
      throw new ErrorHandler(
        400,
        `No se puede finalizar: quedan ${pendientes.length} alumno(s) pendientes (${nombres})`,
      );
    }
    escritura.finalizacion.estado = "finalizada";
    escritura.finalizacion.finalizado_por = idUsuarioAuth;
    escritura.finalizacion.fecha_finalizacion = new Date();
    await escritura.finalizacion.save();
    await BoletinHistorial.create({
      id_periodo,
      id_asignacion,
      id_alumno: null,
      accion: "finalizar",
      valor_anterior: null,
      valor_nuevo: "finalizada",
      modificado_por: idUsuarioAuth,
      motivo: null,
    });
    return escritura.finalizacion;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    throw new ErrorHandler(500, "Error interno al finalizar la materia");
  }
}

// ==========================================
// Lectura: preceptor y supervisión
// ==========================================
async function exigirCursoVisible(idCurso, idUsuario, idRol) {
  const curso = await Curso.findByPk(idCurso);
  if (!curso) {
    throw new ErrorHandler(404, "El curso especificado no existe");
  }
  if (parseInt(idRol) === 4) {
    const personal = await Personal.findOne({ where: { id_usuario: idUsuario } });
    if (!personal || curso.id_preceptor !== personal.id_personal) {
      throw new ErrorHandler(403, "Acceso denegado: No tenés asignado este curso");
    }
  }
  return curso;
}

async function contextoCursoPeriodo(idCurso, idPeriodo) {
  const periodo = await obtenerPeriodoExigido(idPeriodo);
  const snapshot = await BoletinMateria.findAll({
    where: { id_periodo: periodo.id_periodo, id_curso: idCurso },
    include: [
      { model: Asignacion },
      { model: Profesor, as: "profesorSnapshot", attributes: ["id_profesor", "nombre", "apellido"] },
      { model: PeriodoBoletin },
    ],
  });
  if (!snapshot.length) {
    throw new ErrorHandler(
      404,
      "El curso aún no fue preparado para este período (administración debe fijar las materias)",
    );
  }
  const idsAsignacion = snapshot.map((s) => s.id_asignacion);
  const [finalizaciones, calificaciones, alumnos, asignaciones] = await Promise.all([
    BoletinFinalizacion.findAll({
      where: { id_periodo: periodo.id_periodo, id_asignacion: idsAsignacion },
    }),
    BoletinCalificacion.findAll({
      where: { id_periodo: periodo.id_periodo, id_asignacion: idsAsignacion },
    }),
    Alumno.findAll({
      where: { id_curso: idCurso, estado: "activo" },
      attributes: ["id_alumno", "nombre", "apellido", "dni"],
      order: [["apellido", "ASC"], ["nombre", "ASC"]],
    }),
    Asignacion.findAll({
      where: { id_asignacion: idsAsignacion },
      include: [
        { model: Materia, as: "materiaAsignacion" },
        { model: Profesor, as: "profesorAsignacion", attributes: ["id_profesor", "nombre", "apellido"] },
      ],
    }),
  ]);
  return { periodo, snapshot, finalizaciones, calificaciones, alumnos, asignaciones };
}

// Planillas de solo lectura: solo materias finalizadas.
async function obtenerPlanilla(idCurso, idUsuario, idRol, idPeriodo) {
  const curso = await exigirCursoVisible(idCurso, idUsuario, idRol);
  const ctx = await contextoCursoPeriodo(idCurso, idPeriodo);
  const finalizadas = new Set(
    ctx.finalizaciones.filter((f) => f.estado === "finalizada").map((f) => f.id_asignacion),
  );
  const materias = ctx.asignaciones.map((a) => {
    const estado =
      ctx.finalizaciones.find((f) => f.id_asignacion === a.id_asignacion)?.estado || "pendiente";
    const snapshotMateria = ctx.snapshot.find((m) => Number(m.id_asignacion) === Number(a.id_asignacion));
    return {
      asignacion: a,
      responsable: snapshotMateria?.profesorSnapshot || null,
      estado,
      finalizada: estado === "finalizada",
      calificacionesCargadas: [7, 8].includes(Number(idRol))
        ? ctx.calificaciones.filter((c) => c.id_asignacion === a.id_asignacion).length
        : null,
      calificaciones: estado === "finalizada"
        ? ctx.calificaciones.filter((c) => c.id_asignacion === a.id_asignacion)
        : [],
    };
  });
  return {
    curso,
    periodo: ctx.periodo,
    alumnos: ctx.alumnos,
    materias,
    materiasPendientes: materias.filter((m) => !m.finalizada).map((m) => m.asignacion.id_asignacion),
  };
}

// Consolidado del curso: solo cuando TODAS las materias aplicables finalizaron.
async function obtenerConsolidado(idCurso, idUsuario, idRol, idPeriodo) {
  const curso = await exigirCursoVisible(idCurso, idUsuario, idRol);
  const ctx = await contextoCursoPeriodo(idCurso, idPeriodo);
  const estadoPorAsignacion = new Map(
    ctx.finalizaciones.map((f) => [f.id_asignacion, f.estado]),
  );
  const pendientes = ctx.asignaciones.filter(
    (a) => estadoPorAsignacion.get(a.id_asignacion) !== "finalizada",
  );
  if (pendientes.length) {
    const nombres = pendientes.map(
      (a) => a.materiaAsignacion?.nombre_materia || `asignación ${a.id_asignacion}`,
    );
    throw new ErrorHandler(
      409,
      `El boletín consolidado aún no está disponible: faltan ${pendientes.length} materia(s) por finalizar (${nombres.join(", ")})`,
    );
  }
  const porAlumno = {};
  for (const c of ctx.calificaciones) {
    if (!porAlumno[c.id_alumno]) porAlumno[c.id_alumno] = {};
    porAlumno[c.id_alumno][c.id_asignacion] = {
      tipo: c.tipo,
      valor: c.valor === null ? null : Number(c.valor),
      motivo: c.motivo,
      muestra: mostrarCalificacion(c),
    };
  }
  return {
    curso,
    periodo: ctx.periodo,
    alumnos: ctx.alumnos,
    asignaciones: ctx.asignaciones,
    calificaciones: porAlumno,
  };
}

// ==========================================
// Reaperturas
// ==========================================
async function solicitarReapertura(datos, idUsuarioAuth, idRolAuth) {
  const { id_periodo, id_asignacion, motivo } = datos;
  if (!id_periodo || !id_asignacion || !motivo || !String(motivo).trim()) {
    throw new ErrorHandler(400, "período, asignación y motivo son obligatorios");
  }
  const periodo = await PeriodoBoletin.findByPk(id_periodo);
  if (!periodo) {
    throw new ErrorHandler(404, "El período especificado no existe");
  }
  if (parseInt(idRolAuth) === 3) {
    await exigirProfesorDuenio(id_asignacion, idUsuarioAuth, id_periodo);
  }
  const finalizacion = await BoletinFinalizacion.findOne({
    where: { id_periodo, id_asignacion },
  });
  if (!finalizacion || finalizacion.estado !== "finalizada") {
    throw new ErrorHandler(400, "Solo se puede solicitar reapertura de una materia finalizada");
  }
  const pendiente = await BoletinReapertura.findOne({
    where: { id_periodo, id_asignacion, estado: "pendiente" },
  });
  if (pendiente) {
    throw new ErrorHandler(409, "Ya existe una solicitud de reapertura pendiente para esta materia");
  }
  const solicitud = await BoletinReapertura.create({
    id_periodo,
    id_asignacion,
    motivo_solicitud: String(motivo).trim(),
    estado: "pendiente",
    solicitado_por: idUsuarioAuth,
  });
  await BoletinHistorial.create({
    id_periodo,
    id_asignacion,
    id_alumno: null,
    accion: "solicitud_reapertura",
    valor_anterior: "finalizada",
    valor_nuevo: "pendiente",
    modificado_por: idUsuarioAuth,
    motivo: String(motivo).trim().slice(0, 255),
  });
  return solicitud;
}

async function decidirReapertura(idReapertura, datos, idUsuarioAuth) {
  const { estado, motivo_decision } = datos;
  if (!["aprobada", "rechazada"].includes(estado)) {
    throw new ErrorHandler(400, "La decisión debe ser aprobada o rechazada");
  }
  const solicitud = await BoletinReapertura.findByPk(idReapertura);
  if (!solicitud) {
    throw new ErrorHandler(404, "La solicitud especificada no existe");
  }
  if (solicitud.estado !== "pendiente") {
    throw new ErrorHandler(409, "La solicitud ya fue decidida");
  }
  solicitud.estado = estado;
  solicitud.decidido_por = idUsuarioAuth;
  solicitud.motivo_decision = motivo_decision || null;
  solicitud.fecha_decision = new Date();
  await solicitud.save();
  if (estado === "aprobada") {
    const finalizacion = await BoletinFinalizacion.findOne({
      where: { id_periodo: solicitud.id_periodo, id_asignacion: solicitud.id_asignacion },
    });
    if (finalizacion) {
      finalizacion.estado = "en_progreso";
      await finalizacion.save();
    }
  }
  await BoletinHistorial.create({
    id_periodo: solicitud.id_periodo,
    id_asignacion: solicitud.id_asignacion,
    id_alumno: null,
    accion: estado === "aprobada" ? "reapertura_aprobada" : "reapertura_rechazada",
    valor_anterior: "pendiente",
    valor_nuevo: estado,
    modificado_por: idUsuarioAuth,
    motivo: (motivo_decision || "").slice(0, 255) || null,
  });
  return solicitud;
}

async function listarReaperturas(idUsuario, idRol, filtros = {}) {
  const where = {};
  if (parseInt(idRol) === 3) {
    where.solicitado_por = idUsuario;
  }
  if (filtros.estado && ["pendiente", "aprobada", "rechazada"].includes(filtros.estado)) {
    where.estado = filtros.estado;
  }
  if (filtros.id_periodo) {
    where.id_periodo = filtros.id_periodo;
  }
  return BoletinReapertura.findAll({
    where,
    include: [
      {
        model: Asignacion,
        include: [
          { model: Materia, as: "materiaAsignacion" },
          { model: Curso, as: "cursoAsignacion" },
        ],
      },
      { model: PeriodoBoletin },
    ],
    order: [["fecha_solicitud", "DESC"]],
  });
}

// Historial de boletín por alumno (misma matriz de acceso que la libreta,
// más supervisión administrativa).
async function obtenerHistorialBoletin(idAlumno, idUsuarioAuth, idRolAuth, idPeriodo) {
  const alumno = await Alumno.findByPk(idAlumno);
  if (!alumno) {
    throw new ErrorHandler(404, "Alumno no encontrado");
  }
  const rol = parseInt(idRolAuth);
  const where = { id_alumno: idAlumno };
  if (rol === 1) {
    if (alumno.id_usuario !== parseInt(idUsuarioAuth)) {
      throw new ErrorHandler(403, "Acceso denegado: No podés ver el historial de otro alumno");
    }
  } else if (rol === 3) {
    const profesor = await Profesor.findOne({ where: { id_usuario: idUsuarioAuth } });
    if (!profesor) throw new ErrorHandler(403, "Acceso denegado: No se encontró el perfil docente");
    const whereSnapshot = { id_profesor: profesor.id_profesor };
    if (idPeriodo) whereSnapshot.id_periodo = idPeriodo;
    const snapshot = await BoletinMateria.findAll({ where: whereSnapshot });
    const idsAsignacion = [...new Set(snapshot.map((m) => m.id_asignacion))];
    if (!idsAsignacion.length) {
      throw new ErrorHandler(403, "Acceso denegado: No tenés materias asignadas a este alumno");
    }
    where.id_asignacion = idsAsignacion;
  } else if (rol === 4) {
    const personal = await Personal.findOne({ where: { id_usuario: idUsuarioAuth } });
    const curso = await Curso.findByPk(alumno.id_curso);
    if (!personal || !curso || curso.id_preceptor !== personal.id_personal) {
      throw new ErrorHandler(403, "Acceso denegado: Este alumno no pertenece a tus cursos a cargo");
    }
  } else if (rol !== 7 && rol !== 8) {
    throw new ErrorHandler(403, "Acceso denegado: No tenés permiso para consultar historiales");
  }
  if (idPeriodo) where.id_periodo = idPeriodo;
  return BoletinHistorial.findAll({
    where,
    include: [
      { model: Usuario, as: "usuarioModificador", attributes: ["nombre", "apellido", "email"] },
      { model: PeriodoBoletin },
    ],
    order: [["fecha_cambio", "DESC"]],
  });
}

export {
  TIPOS_CALIFICACION,
  periodoEscribible,
  listarPeriodos,
  crearPeriodo,
  actualizarPeriodo,
  prepararCurso,
  obtenerCargaProfesor,
  guardarCalificacion,
  finalizarMateria,
  obtenerPlanilla,
  obtenerConsolidado,
  solicitarReapertura,
  decidirReapertura,
  listarReaperturas,
  obtenerHistorialBoletin,
};
