// carga.js — limpieza y carga del dataset de prueba.
//
// Reglas del dataset:
//   * Todo registro demo lleva IDs explicitos >= 9000 (limpiables sin tocar
//     datos reales). Re-ejecutar la carga no duplica nada.
//   * Los 4 logins base de prueba.sql (root/profesor/preceptor/alumno
//     @tecnica2.edu.ar) no se recrean; si existen, se integran al dataset
//     (el preceptor base toma cursos demo y el profesor base, asignaciones).
//   * Fechas relativas a "hoy": ciclo lectivo del anio en curso con 1er
//     cuatrimestre cerrado (mar-jul) y 2do abierto (ago-dic).
import {
  ID_MIN,
  TABLA_PK,
  crearRng,
  rango,
  eleccion,
  slug,
  fmtFecha,
  fmtFechaHora,
  sumarDias,
  diasHabilesPrevios,
} from "./comunes.js";
import {
  MATERIAS,
  PLANES,
  CORRELATIVAS_BASICO,
  CORRELATIVAS_SUPERIOR,
  CURSOS,
  DEMO_PERSONAL,
  DEMO_PROFESORES,
  DEMO_TUTORES,
  ALUMNOS_CON_CUENTA,
  NOMBRES_M,
  NOMBRES_F,
  APELLIDOS,
  CALLES,
  FRANJAS,
  MOTIVOS_SANCION,
  TEXTOS_OBSERVACION,
  ASUNTOS_CORREO,
  CUERPOS_WHATSAPP,
  TITULOS_NOTIFICACION,
  RECURSOS_BIBLIOTECA,
  OBJETOS_PERDIDOS,
} from "./datos.js";

const CLAVE_DEMO = "admin123";
const ALUMNOS_POR_CURSO = 6;

const pad = (n) => String(n).padStart(2, "0");

// Inserta filas en lotes (evita paquetes gigantes). Devuelve las filas
// afectadas totales.
async function insertarLote(conn, tabla, columnas, filas, tamanioLote = 400) {
  let afectadas = 0;
  for (let i = 0; i < filas.length; i += tamanioLote) {
    const lote = filas.slice(i, i + tamanioLote);
    const sql = `INSERT INTO \`${tabla}\` (\`${columnas.join("`, `")}\`) VALUES ${lote
      .map(() => `(${columnas.map(() => "?").join(", ")})`)
      .join(", ")}`;
    const [res] = await conn.query(sql, lote.flat());
    afectadas += res.affectedRows;
  }
  return afectadas;
}

function valorDecimal(rng, min, max) {
  return Number((rango(rng, min * 10, max * 10) / 10).toFixed(1));
}

function fechaEntre(rng, inicioISO, finISO) {
  const base = Date.parse(inicioISO);
  const tope = Date.parse(finISO);
  return fmtFecha(new Date(base + rng() * Math.max(tope - base, DIA_MS)));
}

const DIA_MS = 24 * 60 * 60 * 1000;

// ============================================================
// LIMPIEZA: borra solo filas demo (PK >= ID_MIN).
// ============================================================
export async function limpiarDataset(conn) {
  const limpiados = {};
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");
  try {
    for (const [tabla, pk] of TABLA_PK) {
      const [res] = await conn.query(
        `DELETE FROM \`${tabla}\` WHERE \`${pk}\` >= ?`,
        [ID_MIN]
      );
      if (res.affectedRows > 0) limpiados[tabla] = res.affectedRows;
    }
  } finally {
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  }
  return limpiados;
}

// ============================================================
// CARGA COMPLETA.
// ============================================================
export async function cargarDataset(conn) {
  const hoy = new Date();
  const anio = hoy.getFullYear();
  const rng = crearRng(7752141);

  // Fechas utilitarias (hora local).
  const fechaPasada = (dias, hora = 10, minutos = 0) => {
    const d = sumarDias(hoy, -dias);
    d.setHours(hora, minutos, 0, 0);
    return fmtFechaHora(d);
  };

  // ---- Mapas de roles y cargos ----
  const [filasRoles] = await conn.query("SELECT id_rol, nombre_rol FROM roles");
  const rolId = Object.fromEntries(filasRoles.map((r) => [r.nombre_rol, r.id_rol]));
  const [filasCargos] = await conn.query(
    "SELECT id_cargo, nombre_cargo FROM cargos"
  );
  const cargoId = Object.fromEntries(
    filasCargos.map((c) => [c.nombre_cargo, c.id_cargo])
  );

  // El dataset asume los roles de base; si faltan, mejor fallar con mensaje claro
  // que insertar filas rotas.
  for (const nombre of ["alumno", "delegado", "profesor", "preceptor", "bibliotecario", "tutor", "administrativo"]) {
    if (rolId[nombre] == null) {
      throw new Error(
        `El dataset requiere el rol '${nombre}' en la tabla roles y no existe.`
      );
    }
  }

  // ---- Logins base opcionales (prueba.sql) ----
  const [filasBase] = await conn.query(
    "SELECT email, id_usuario FROM usuarios WHERE email IN (?, ?, ?, ?)",
    [
      "root@tecnica2.edu.ar",
      "profesor@tecnica2.edu.ar",
      "preceptor@tecnica2.edu.ar",
      "alumno@tecnica2.edu.ar",
    ]
  );
  const baseUsuarioId = Object.fromEntries(
    filasBase.map((r) => [r.email, r.id_usuario])
  );

  let preceptorBase = null; // { id_personal, id_usuario }
  {
    const [f] = await conn.query(
      "SELECT p.id_personal, p.id_usuario FROM personal p JOIN usuarios u ON u.id_usuario = p.id_usuario WHERE u.email = ? LIMIT 1",
      ["preceptor@tecnica2.edu.ar"]
    );
    preceptorBase = f[0] || null;
  }

  let profesorBaseId = null;
  let profesorBaseUsuarioId = null;
  if (baseUsuarioId["profesor@tecnica2.edu.ar"]) {
    const [f] = await conn.query(
      "SELECT id_profesor FROM profesores WHERE id_usuario = ? LIMIT 1",
      [baseUsuarioId["profesor@tecnica2.edu.ar"]]
    );
    profesorBaseId = f[0]?.id_profesor || null;
    profesorBaseUsuarioId = baseUsuarioId["profesor@tecnica2.edu.ar"];
  }

  // ============================================================
  // 0) Construcción puro-JS del roster de alumnos (referenciado
  //    por usuarios, cursos y legajos despues).
  // ============================================================
  const nombresForzados = {
    9001: ["Nicolás", "Vega"],
    9019: ["Brenda", "Paz"],
    9055: ["Tadeo", "Martinez"],
  };
  const tutorDeAlumno = {
    9002: DEMO_TUTORES[0],
    9020: DEMO_TUTORES[1],
    9037: DEMO_TUTORES[2],
    9056: DEMO_TUTORES[2],
  };
  const cuentaPorAlumno = Object.fromEntries(
    ALUMNOS_CON_CUENTA.map((c) => [c.alumnoId, c.usuarioId])
  );

  const alumnos = []; // filas: id, nombre, apellido, dni, nacimiento, tutor, tel, domicilio, email, estado, curso, usuario
  const alumnosPorCurso = {};
  let proximoAlumnoId = 9001;

  const construyeAlumno = (id, curso, estado) => {
    const forzado = nombresForzados[id] || null;
    const esChico = id % 2 === 0;
    const nombre =
      forzado?.[0] ??
      (esChico ? NOMBRES_M[id % NOMBRES_M.length] : NOMBRES_F[id % NOMBRES_F.length]);
    const apellido =
      forzado?.[1] ?? APELLIDOS[(id * 3 + 7) % APELLIDOS.length];
    const dni = String(46100001 + (id - 9001));
    // En curso: 1º = 14 anios, 2º = 15... 6º = 19. Sin curso (egresados/bajas): 19.
    const edad = curso ? curso.anio + 13 : 19;
    const nacimiento = `${anio - edad}-${pad((id % 12) + 1)}-${pad(
      ((id * 7) % 27) + 1
    )}`;
    const tutor = tutorDeAlumno[id] || null;
    const tutorNombre = tutor
      ? `${tutor.nombre} ${tutor.apellido}`
      : `${eleccion(rng, NOMBRES_M.concat(NOMBRES_F))} ${eleccion(rng, APELLIDOS)}`;
    const telefono = tutor?.telefono ?? `11-4${rango(rng, 1000, 8999)}`;
    const domicilio = `${eleccion(rng, CALLES)} ${rango(rng, 100, 1999)}`;
    const emailLegajo =
      id % 9 === 4 && !forzado
        ? null
        : `${slug(nombre)}.${slug(apellido)}${dni.slice(-4)}@gmail.com`;
    return [
      id,
      nombre,
      apellido,
      dni,
      nacimiento,
      tutorNombre,
      telefono,
      domicilio,
      emailLegajo,
      estado ?? "activo",
      curso?.id ?? null,
      cuentaPorAlumno[id] ?? null,
    ];
  };

  for (const curso of CURSOS) {
    alumnosPorCurso[curso.id] = [];
    for (let j = 0; j < ALUMNOS_POR_CURSO; j++) {
      const id = proximoAlumnoId++;
      const fila = construyeAlumno(id, curso, "activo");
      alumnos.push(fila);
      alumnosPorCurso[curso.id].push(id);
    }
  }
  // 4 egresados + 2 de baja (sin curso).
  for (let k = 0; k < 4; k++) alumnos.push(construyeAlumno(proximoAlumnoId++, null, "egresado"));
  for (let k = 0; k < 2; k++) alumnos.push(construyeAlumno(proximoAlumnoId++, null, "baja"));

  const alumnoPorId = Object.fromEntries(alumnos.map((a) => [a[0], a]));

  // ============================================================
  // 1) usuarios
  // ============================================================
  const usuariosFilas = [];
  for (const p of DEMO_PERSONAL) {
    const rol =
      p.cargo === "Preceptor"
        ? "preceptor"
        : p.cargo === "Bibliotecario"
          ? "bibliotecario"
          : "administrativo";
    usuariosFilas.push([p.id, p.nombre, p.apellido, p.email, CLAVE_DEMO, rolId[rol]]);
  }
  for (const prof of DEMO_PROFESORES) {
    usuariosFilas.push([
      prof.id + 4, // usuarioId: 9005..9015
      prof.nombre,
      prof.apellido,
      prof.email,
      CLAVE_DEMO,
      rolId["profesor"],
    ]);
  }
  for (const t of DEMO_TUTORES) {
    usuariosFilas.push([t.usuarioId, t.nombre, t.apellido, t.email, CLAVE_DEMO, rolId["tutor"]]);
  }
  for (const c of ALUMNOS_CON_CUENTA) {
    const a = alumnoPorId[c.alumnoId];
    usuariosFilas.push([c.usuarioId, a[1], a[2], c.email, CLAVE_DEMO, rolId[c.rol === 2 ? "delegado" : "alumno"]]);
  }
  const usuariosCargados = await insertarLote(conn, "usuarios", [
    "id_usuario", "nombre", "apellido", "email", "contrasena", "id_rol",
  ], usuariosFilas);

  // ============================================================
  // 2) personal (4) y profesores (11)
  // ============================================================
  const personalFilas = DEMO_PERSONAL.map((p, i) => [
    p.id, p.nombre, p.apellido, p.dni, p.nacimiento,
    "Av. Técnicos 1250", `11-4300-100${i + 1}`, p.email, p.ingreso,
    "activo", p.id, cargoId[p.cargo] ?? Object.values(cargoId)[0],
  ]);
  const personalCargados = await insertarLote(conn, "personal", [
    "id_personal", "nombre", "apellido", "dni", "fecha_nacimiento",
    "domicilio", "telefono", "email", "fecha_ingreso", "estado",
    "id_usuario", "id_cargo",
  ], personalFilas);

  const profesoresFilas = DEMO_PROFESORES.map((p, i) => [
    p.id, p.nombre, p.apellido, p.dni, p.email,
    `11-4400-200${i + 1}`, p.nacimiento, "Calle Oficios 87",
    p.ingreso, "activo", `Prof. en ${p.especialidad}`, p.especialidad,
    p.id + 4, // usuarioId: 9005..9015
  ]);
  const profesoresCargados = await insertarLote(conn, "profesores", [
    "id_profesor", "nombre", "apellido", "dni", "email", "telefono",
    "fecha_nacimiento", "domicilio", "fecha_contratacion", "estado",
    "titulo_habilitante", "especialidad", "id_usuario",
  ], profesoresFilas);

  // ============================================================
  // 3) cursos (12): reparto entre los preceptores disponibles
  // ============================================================
  const preceptoresParaCursos = [];
  if (preceptorBase) preceptoresParaCursos.push(preceptorBase.id_personal);
  preceptoresParaCursos.push(9002, 9003);

  const cursosFilas = CURSOS.map((c, i) => [
    c.id, c.nombre, c.nivel, anio, c.anio, 30, c.aula, c.turno,
    DEMO_PROFESORES[i % DEMO_PROFESORES.length].id,
    preceptoresParaCursos[i % preceptoresParaCursos.length],
    "activo",
  ]);
  const cursosCargados = await insertarLote(conn, "cursos", [
    "id_curso", "nombre_curso", "nivel", "ciclo_lectivo", "anio",
    "capacidad_maxima", "aula", "turno", "id_profesor_titular",
    "id_preceptor", "estado",
  ], cursosFilas);

  // mapa curso -> { preceptorIdPersonal, preceptorUsuarioId }
  const preceptorUsuarioDeCurso = {};
  const usuarioDePersonal = Object.fromEntries(
    DEMO_PERSONAL.map((p) => [p.id, p.id])
  );
  for (const curso of CURSOS) {
    const personalId = cursosFilas.find((f) => f[0] === curso.id)[9];
    preceptorUsuarioDeCurso[curso.id] = personalId === preceptorBase?.id_personal
      ? preceptorBase.id_usuario
      : usuarioDePersonal[personalId];
  }

  // ============================================================
  // 4) alumnos (72 en curso + 4 egresados + 2 de baja) y vínculos
  // ============================================================
  const alumnosCargados = await insertarLote(conn, "alumnos", [
    "id_alumno", "nombre", "apellido", "dni", "fecha_nacimiento",
    "nombre_tutor", "telefono_tutor", "domicilio", "email", "estado",
    "id_curso", "id_usuario",
  ], alumnos);

  const vinculosTutores = DEMO_TUTORES.flatMap((t) =>
    t.links.map((l) => [t.usuarioId, l.idAlumno, l.parentesco])
  );
  const vinculosCargados = await insertarLote(conn, "tutores_alumnos", [
    "id_usuario", "id_alumno", "parentesco",
  ], vinculosTutores);

  // ============================================================
  // 5) materias y planes (con materias del plan y correlativas)
  // ============================================================
  const materiasCargadas = await insertarLote(conn, "materias", [
    "id_materia", "nombre_materia", "carga_horaria", "descripcion",
  ], MATERIAS.map((m) => [m.id, m.nombre, m.carga, m.descripcion]));

  const planesFilas = PLANES.map((p) => [
    p.id, p.nombre, p.codigo, p.orientacion, p.descripcion,
    p.duracion, "vigente", `${anio}-03-01`, null,
  ]);
  const planesCargados = await insertarLote(conn, "planes_estudio", [
    "id_plan", "nombre", "codigo", "orientacion", "descripcion",
    "duracion_anios", "estado", "fecha_vigencia_desde", "fecha_vigencia_hasta",
  ], planesFilas);

  const pmId = {}; // "plan|materia|anio" -> id_plan_materia
  const materiasPorPlanAnio = {}; // "plan|anio" -> [id_materia...]
  let proximoPM = 9001;
  const planMateriasFilas = [];
  for (const plan of PLANES) {
    for (const [anioTexto, lista] of Object.entries(plan.anios)) {
      const anioPlan = Number(anioTexto);
      const idMaterias = lista.map((m) => (m === 0 ? plan.taller : m));
      materiasPorPlanAnio[`${plan.id}|${anioPlan}`] = idMaterias;
      for (const idMateria of idMaterias) {
        pmId[`${plan.id}|${idMateria}|${anioPlan}`] = proximoPM;
        planMateriasFilas.push([proximoPM++, plan.id, idMateria, anioPlan, "anual"]);
      }
    }
  }
  const planMateriasCargadas = await insertarLote(conn, "plan_materias", [
    "id_plan_materia", "id_plan", "id_materia", "anio", "cuatrimestre",
  ], planMateriasFilas);

  const materiaPorNombre = Object.fromEntries(
    MATERIAS.map((m) => [m.nombre, m.id])
  );
  const pmDe = (planId, nombreOId, anio) => {
    const idMateria =
      nombreOId === "TALLER"
        ? PLANES.find((p) => p.id === planId).taller
        : typeof nombreOId === "number"
          ? nombreOId
          : materiaPorNombre[nombreOId];
    return pmId[`${planId}|${idMateria}|${anio}`] ?? null;
  };

  let proximoCorr = 9001;
  const filasCorrelativas = [];
  for (const c of CORRELATIVAS_BASICO) {
    const materia = pmDe(9001, c.materia, c.anio);
    const requerida = pmDe(9001, c.materiaReq, c.anioReq);
    if (materia && requerida) filasCorrelativas.push([proximoCorr++, materia, requerida]);
  }
  for (const plan of PLANES.filter((p) => p.id !== 9001)) {
    for (const c of CORRELATIVAS_SUPERIOR) {
      const materia = pmDe(plan.id, c.materia, c.anio);
      const requerida = pmDe(plan.id, c.materiaReq, c.anioReq);
      if (materia && requerida) filasCorrelativas.push([proximoCorr++, materia, requerida]);
    }
  }
  const correlativasCargadas = await insertarLote(conn, "correlativas", [
    "id_correlativa", "id_plan_materia", "id_plan_materia_req",
  ], filasCorrelativas);

  // ============================================================
  // 6) asignaciones (materia x curso x profesor) y horarios
  // ============================================================
  const asignacionesDelCurso = {}; // cursoId -> [{ id, materia, profesor }]
  let proximoAsig = 9001;
  const asignacionesFilas = [];

  // Asignaciones "de regalo" para el profesor base (si existe).
  const paraProfesorBase = new Set([
    "9001|9001", // 1º Año A — Matemática
    "9005|9006", // 2º Año B — Física
    "9010|9015", // 5º Informática — Proyecto Integrador
  ]);

  for (const curso of CURSOS) {
    asignacionesDelCurso[curso.id] = [];
    for (const idMateria of materiasPorPlanAnio[`${curso.planId}|${curso.anio}`]) {
      let idProfesor;
      if (profesorBaseId && paraProfesorBase.has(`${curso.id}|${idMateria}`)) {
        idProfesor = profesorBaseId;
      } else {
        const materia = MATERIAS.find((m) => m.id === idMateria);
        let idx = materia.prof;
        if (idMateria === 9012) idx = (CURSOS.indexOf(curso) % 2) ? 9 : 8;
        idProfesor = DEMO_PROFESORES[idx].id;
      }
      asignacionesDelCurso[curso.id].push({
        id: proximoAsig,
        materia: idMateria,
        profesor: idProfesor,
      });
      asignacionesFilas.push([proximoAsig++, curso.id, idMateria, idProfesor, curso.planId]);
    }
  }
  const asignacionesCargadas = await insertarLote(conn, "asignaciones", [
    "id_asignacion", "id_curso", "id_materia", "id_profesor", "id_plan",
  ], asignacionesFilas);

  // Horarios: 5 dias x 6 franjas = 30 franjas por curso. Cada asignación
  // ocupa franjas libres sin superponerse ni al profesor (dos cursos a la
  // misma hora) ni al aula del curso. Si el profesor tiene tantas asignaciones
  // que 3 franjas por materia agotan la grilla semanal, baja a 2 franjas.
  const franjasTotales = FRANJAS.length * 5;
  const conteoPorProfesor = {};
  for (const [, , , idProfesor] of asignacionesFilas) {
    conteoPorProfesor[idProfesor] = (conteoPorProfesor[idProfesor] || 0) + 1;
  }

  const slotsPorProfesor = {};
  const slotsPorCurso = new Map();
  const horariosFilas = [];
  let proximoHorario = 9001;
  for (const curso of CURSOS) {
    slotsPorCurso.set(curso.id, new Set());
    for (const a of asignacionesDelCurso[curso.id]) {
      const franjasAsig =
        conteoPorProfesor[a.profesor] * 3 > franjasTotales ? 2 : 3;
      for (let j = 0; j < franjasAsig; j++) {
        let slot = null;
        for (let intento = 0; intento < franjasTotales * 2; intento++) {
          const candidato = (j * 10 + a.id + intento) % franjasTotales;
          if (
            !slotsPorProfesor[a.profesor]?.has(candidato) &&
            !slotsPorCurso.get(curso.id).has(candidato)
          ) {
            slot = candidato;
            break;
          }
        }
        if (slot === null) continue;
        (slotsPorProfesor[a.profesor] ??= new Set()).add(slot);
        slotsPorCurso.get(curso.id).add(slot);
        horariosFilas.push([
          proximoHorario++,
          a.id,
          Math.floor(slot / FRANJAS.length) + 1,
          FRANJAS[slot % FRANJAS.length].inicio,
          FRANJAS[slot % FRANJAS.length].fin,
          curso.aula,
        ]);
      }
    }
  }
  const horariosCargados = await insertarLote(conn, "horarios", [
    "id_horario", "id_asignacion", "dia", "hora_inicio", "hora_fin", "aula",
  ], horariosFilas);

  // ============================================================
  // 7) períodos de boletín (se adoptan si ya existen para el ciclo)
  // ============================================================
  const [periodosExistentes] = await conn.query(
    "SELECT id_periodo, cuatrimestre FROM periodos_boletin WHERE ciclo_lectivo = ? AND cuatrimestre IN (?, ?)",
    [anio, "1", "2"]
  );
  let periodo1 = periodosExistentes.find((p) => p.cuatrimestre === "1")?.id_periodo ?? null;
  let periodo2 = periodosExistentes.find((p) => p.cuatrimestre === "2")?.id_periodo ?? null;
  const periodosNuevos = [];
  if (!periodo1) {
    periodosNuevos.push([9001, anio, "1", `${anio}-03-01`, `${anio}-07-31`, "cerrado"]);
    periodo1 = 9001;
  }
  if (!periodo2) {
    periodosNuevos.push([9002, anio, "2", `${anio}-08-01`, `${anio}-12-18`, "abierto"]);
    periodo2 = 9002;
  }
  if (periodosNuevos.length) {
    await insertarLote(conn, "periodos_boletin", [
      "id_periodo", "ciclo_lectivo", "cuatrimestre", "fecha_inicio",
      "fecha_cierre", "estado", "createdAt", "updatedAt",
    ], periodosNuevos.map((f) => [...f, fmtFecha(hoy), fmtFecha(hoy)]));
  }

  // ============================================================
  // 8) boletines: materias, calificaciones, finalizaciones,
  //    reaperturas e historial
  // ============================================================
  const usuarioDeProfesor = Object.fromEntries(
    DEMO_PROFESORES.map((p) => [p.id, p.id + 4])
  );
  if (profesorBaseId) usuarioDeProfesor[profesorBaseId] = profesorBaseUsuarioId;

  let proximoBM = 9001;
  const boletinMateriasFilas = [];
  const asigPlano = asignacionesFilas.map(([id, idCurso, idMateria, idProfesor, idPlan]) => ({
    id, idCurso, idMateria, idProfesor, idPlan, idx: id - 9001,
  }));
  for (const periodoId of [periodo1, periodo2]) {
    for (const a of asigPlano) {
      boletinMateriasFilas.push([
        proximoBM++, periodoId, a.idCurso, a.id, a.idMateria, a.idProfesor, a.idPlan,
      ]);
    }
  }
  const boletinMateriasCargadas = await insertarLote(conn, "boletin_materias", [
    "id_boletin_materia", "id_periodo", "id_curso", "id_asignacion",
    "id_materia", "id_profesor", "id_plan",
  ], boletinMateriasFilas);

  const esTaller = (idMateria) => [9012, 9013, 9014].includes(idMateria);

  let proximoBC = 9001;
  const calificacionesFilas = [];
  const cargarCuatrimestre = (periodoId, parcial) => {
    for (const a of asigPlano) {
      const alumnosDelCurso = alumnosPorCurso[a.idCurso] || [];
      for (let j = 0; j < alumnosDelCurso.length; j++) {
        const idAlumno = alumnosDelCurso[j];
        if (parcial && a.idx % 2 !== 0) continue; // 2do cuat: la mitad registrada
        const taller = esTaller(a.idMateria);
        if ((a.idx + j) % 21 === 0) {
          calificacionesFilas.push([proximoBC++, periodoId, a.id, idAlumno, "sin_calificar", null, "Entrega pendiente con justificación"]);
          continue;
        }
        if (taller && j % 3 === 2) {
          calificacionesFilas.push([proximoBC++, periodoId, a.id, idAlumno, "TED", valorDecimal(rng, 6, 10), null]);
          continue;
        }
        if (taller && j % 3 === 0) {
          calificacionesFilas.push([proximoBC++, periodoId, a.id, idAlumno, "TEP", valorDecimal(rng, 6, 10), null]);
          continue;
        }
        calificacionesFilas.push([
          proximoBC++, periodoId, a.id, idAlumno, "numerica",
          valorDecimal(rng, parcial ? 5 : 4, 10), null,
        ]);
      }
    }
  };
  cargarCuatrimestre(periodo1, false);
  cargarCuatrimestre(periodo2, true);
  const boletinCalificacionesCargadas = await insertarLote(conn, "boletin_calificaciones", [
    "id_boletin_nota", "id_periodo", "id_asignacion", "id_alumno", "tipo",
    "valor", "motivo",
  ], calificacionesFilas);

  let proximoBF = 9001;
  const finalizacionesFilas = [];
  for (const a of asigPlano) {
    const estado = a.idx % 2 === 0
      ? "finalizada"
      : a.idx % 4 === 1
        ? "en_progreso"
        : "pendiente";
    finalizacionesFilas.push([
      proximoBF++, periodo1, a.id, estado,
      estado === "finalizada" ? usuarioDeProfesor[a.idProfesor] : null,
      estado === "finalizada" ? `${anio}-08-05 10:00:00` : null,
    ]);
  }
  for (const a of asigPlano) {
    finalizacionesFilas.push([
      proximoBF++, periodo2, a.id, "pendiente", null, null,
    ]);
  }
  const boletinFinalizacionesCargadas = await insertarLote(conn, "boletin_finalizaciones", [
    "id_finalizacion", "id_periodo", "id_asignacion", "estado",
    "finalizado_por", "fecha_finalizacion",
  ], finalizacionesFilas);

  const reaperturasFilas = [];
  const asigReapertura1 = asigPlano.find((a) => a.idCurso === 9001);
  const asigReapertura2 = asigPlano.find((a) => a.idCurso === 9009);
  if (asigReapertura1) {
    reaperturasFilas.push([9001, periodo1, asigReapertura1.id,
      "Falta cargar el valor de recuperación de un alumno (justificado).",
      "pendiente", usuarioDeProfesor[asigReapertura1.idProfesor], null, null,
      `${anio}-08-10 09:00:00`, null]);
  }
  if (asigReapertura2) {
    reaperturasFilas.push([9002, periodo1, asigReapertura2.id,
      "Corrección de valor mal ingresado antes del cierre.",
      "aprobada", usuarioDeProfesor[asigReapertura2.idProfesor], 9001,
      "Aprobado por dirección.", `${anio}-08-11 11:30:00`, `${anio}-08-12 08:45:00`]);
  }
  const boletinReaperturasCargadas = await insertarLote(conn, "boletin_reaperturas", [
    "id_reapertura", "id_periodo", "id_asignacion", "motivo_solicitud",
    "estado", "solicitado_por", "decidido_por", "motivo_decision",
    "fecha_solicitud", "fecha_decision",
  ], reaperturasFilas);

  const historialFilas = [];
  let proximoBH = 9001;
  for (const a of asigPlano.slice(0, 10)) {
    const idAlumno = (alumnosPorCurso[a.idCurso] || [])[a.idx % (alumnosPorCurso[a.idCurso]?.length || 1)] ?? null;
    if (!idAlumno) continue;
    const nueva = valorDecimal(rng, 6, 10).toFixed(1);
    const anterior = valorDecimal(rng, 4, 8).toFixed(1);
    historialFilas.push([
      proximoBH++, periodo1, a.id, idAlumno, "modificacion_nota",
      anterior, nueva, usuarioDeProfesor[a.idProfesor],
      "Corrección por error de carga", `${anio}-07-28 14:3${a.idx % 10}:00`,
    ]);
  }
  const boletinHistorialCargado = await insertarLote(conn, "boletin_historial", [
    "id_boletin_historial", "id_periodo", "id_asignacion", "id_alumno",
    "accion", "valor_anterior", "valor_nuevo", "modificado_por", "motivo",
    "fecha_cambio",
  ], historialFilas);

  // ============================================================
  // 9) libreta digital: notas + historial de cambios
  // ============================================================
  const fin1C = new Date(`${anio}-07-31T23:59:59`);
  const tope2C = Math.min(hoy.getTime(), Date.parse(`${anio}-12-18T23:59:59`));

  let proximoNota = 9001;
  const notasFilas = [];
  const notasParaHistorial = [];
  const cargarNotas = (parcial) => {
    for (const a of asigPlano) {
      const alumnosDelCurso = alumnosPorCurso[a.idCurso] || [];
      for (let j = 0; j < alumnosDelCurso.length; j++) {
        if (parcial && a.idx % 3 === 0) continue;
        const idAlumno = alumnosDelCurso[j];
        const calif = valorDecimal(rng, parcial ? 5 : 4, 10);
        const fechaCarga = parcial
          ? fechaEntre(rng, `${anio}-08-01`, fmtFecha(new Date(tope2C)))
          : fechaEntre(rng, `${anio}-03-20`, `${anio}-07-30`);
        const obs = (a.idx + j) % 11 === 0
          ? "Recuperación de unidad correspondiente."
          : null;
        notasFilas.push([proximoNota, idAlumno, a.id, calif, fechaCarga, obs]);
        if (!parcial && notasParaHistorial.length < 15) {
          notasParaHistorial.push({ idNota: proximoNota, calif, idAlumno, idAsignacion: a.id, prof: a.idProfesor, fechaCarga });
        }
        proximoNota++;
      }
    }
  };
  cargarNotas(false);
  cargarNotas(true);
  const notasCargadas = await insertarLote(conn, "notas", [
    "id_nota", "id_alumno", "id_asignacion", "calificacion", "fecha_carga",
    "observaciones",
  ], notasFilas);

  const filasHistorialNotas = notasParaHistorial.map((h, i) => {
    const anterior = Math.max(4, valorDecimal(rng, 4, 9));
    return [
      9001 + i, h.idNota, h.idAlumno, h.idAsignacion, anterior, h.calif,
      usuarioDeProfesor[h.prof] ?? 9001,
      `${h.fechaCarga} 15:2${i % 10}:00`,
      "Corrección a pedido de la familia",
    ];
  });
  const historialNotasCargado = await insertarLote(conn, "historial_notas", [
    "id_historial", "id_nota", "id_alumno", "id_asignacion",
    "calificacion_anterior", "calificacion_nueva", "modificado_por",
    "fecha_cambio", "motivo",
  ], filasHistorialNotas);

  // ============================================================
  // 10) convivencia: asistencias, sanciones y observaciones
  // ============================================================
  const dias = diasHabilesPrevios(hoy, 10);
  const tiposAsistencia = ["presente", "presente", "presente", "presente", "tardanza", "ausente", "presente", "justificado", "presente", "presente"];
  const asistenciasFilas = [];
  let proximoAsistencia = 9001;
  for (const curso of CURSOS) {
    let idx = 0;
    for (const idAlumno of alumnosPorCurso[curso.id] || []) {
      for (const fecha of dias) {
        const estadoA = tiposAsistencia[idx++ % tiposAsistencia.length];
        asistenciasFilas.push([
          proximoAsistencia++, idAlumno, curso.id, fecha, estadoA,
          preceptorUsuarioDeCurso[curso.id],
        ]);
      }
    }
  }
  const asistenciasCargadas = await insertarLote(conn, "asistencias", [
    "id_asistencia", "id_alumno", "id_curso", "fecha", "estado",
    "registrado_por",
  ], asistenciasFilas);

  const alumnosActivos = alumnos.filter((a) => a[9] === "activo");
  // La primera sancion y observacion recaen en 9002 (el hijo del tutor demo)
  // para que el login maria.lopez@ vea convivencia de su hijo.
  const alumnoDeSancion = (i) =>
    i === 0 ? 9002 : alumnosActivos[(i * 7) % alumnosActivos.length][0];
  const alumnoDeObservacion = (i) =>
    i === 0 ? 9002 : alumnosActivos[(i * 11) % alumnosActivos.length][0];
  const TIPOS_SANCION = ["apercibimiento", "amonestacion", "apercibimiento", "suspension", "amonestacion", "apercibimiento", "suspension", "amonestacion", "apercibimiento", "amonestacion"];
  const sancionesFilas = TIPOS_SANCION.map((tipo, i) => {
    const a = alumnosActivos[(i * 7) % alumnosActivos.length];
    const idAlumno = alumnoDeSancion(i);
    const idCurso = i === 0 ? 9001 : a[10];
    return [
      9001 + i, idAlumno, tipo, MOTIVOS_SANCION[i % MOTIVOS_SANCION.length],
      dias[i], preceptorUsuarioDeCurso[idCurso],
    ];
  });
  const sancionesCargadas = await insertarLote(conn, "sanciones", [
    "id_sancion", "id_alumno", "tipo", "motivo", "fecha", "registrado_por",
  ], sancionesFilas);

  const observacionesFilas = Array.from({ length: 18 }, (_, i) => {
    const a = alumnosActivos[(i * 11) % alumnosActivos.length];
    const idAlumno = alumnoDeObservacion(i);
    const idCurso = i === 0 ? 9001 : a[10];
    return [
      9001 + i, idAlumno, TEXTOS_OBSERVACION[i % TEXTOS_OBSERVACION.length],
      dias[i % dias.length], i % 5 === 4 ? null : preceptorUsuarioDeCurso[idCurso],
    ];
  });
  const observacionesCargadas = await insertarLote(conn, "observaciones", [
    "id_observacion", "id_alumno", "texto", "fecha", "registrado_por",
  ], observacionesFilas);

  // ============================================================
  // 11) comunidad: comunicados, noticias, notificaciones
  // ============================================================
  const adminId = 9001;
  const COMUNICADOS_DEMO = [
    { titulo: "Acto por el aniversario de la escuela", mensaje: "El próximo viernes se realizará el acto institucional en el patio central a las 9 hs. Los alumnos concurren con uniforme completo.", importancia: "alta", destino: "todos", cursoDestino: null, autor: adminId, offsetDias: 3 },
    { titulo: "Reunión general de tutores del ciclo básico", mensaje: "Se convoca a tutores del ciclo básico el jueves a las 18 hs en el salón de actos para tratar avances del cuatrimestre.", importancia: "media", destino: "todos", cursoDestino: null, autor: 9002, offsetDias: 6 },
    { titulo: "Boletín del 1er cuatrimestre habilitado", mensaje: "Ya están disponibles los boletines del primer cuatrimestre para consulta en el panel de alumno y tutor.", importancia: "media", destino: "alumnos", cursoDestino: null, autor: 9002, offsetDias: 9 },
    { titulo: "Clase de apoyo de matemática", mensaje: "Las clases de apoyo se dictan los martes y jueves de 16 a 18 hs en el aula 103.", importancia: "baja", destino: "curso", cursoDestino: CURSOS[0].nombre, autor: 9003, offsetDias: 12 },
    { titulo: "Cambio de horario del taller de electrónica", mensaje: "El taller de electrónica se dictará de 08:00 a 12:00 durante la próxima semana por trabajos de mantenimiento.", importancia: "media", destino: "profesores", cursoDestino: null, autor: 9003, offsetDias: 15 },
    { titulo: "Reunión pedagógica de área", mensaje: "Se convoca a los profesores a la reunión pedagógica de área el miércoles a las 17 hs en sala de profesores.", importancia: "media", destino: "profesores", cursoDestino: null, autor: adminId, offsetDias: 22 },
    { titulo: "Cierre del 2do cuatrimestre", mensaje: "El segundo cuatrimestre cierra el 18/12. Los profesores deben tener cargadas las calificaciones antes del cierre.", importancia: "alta", destino: "todos", cursoDestino: null, autor: adminId, offsetDias: 34 },
    { titulo: "Nuevos préstamos en biblioteca", mensaje: "La biblioteca amplió su catálogo de la especialidad: reserves y préstamos a traves del panel correspondiente.", importancia: "baja", destino: "alumnos", cursoDestino: null, autor: 9004, offsetDias: 5 },
  ];
  const comunicadosFilas = COMUNICADOS_DEMO.map((c, i) => [
    9001 + i, c.titulo, c.mensaje, c.importancia, c.destino, c.cursoDestino,
    fechaPasada(c.offsetDias, 9 + (i % 8), (i * 13) % 60), c.autor,
  ]);
  const comunicadosCargados = await insertarLote(conn, "comunicados", [
    "id_comunicado", "titulo", "mensaje", "importancia", "destino",
    "curso_destino", "fecha_publicacion", "autor_id",
  ], comunicadosFilas);

  const NOTICIAS_DEMO = [
    { titulo: "Arrancan las prácticas profesionalizantes", contenido: "Alumnos de 6º año comienzan sus prácticas en empresas aliadas del distrito durante los siguientes meses, con seguimiento docente semanal.", offsetDias: 12 },
    { titulo: "Expo técnica 2026", contenido: "Se presenta la expo técnica institucional con proyectos integradores de 4º, 5º y 6º: robótica, automatización, redes y desarrollo web.", offsetDias: 47 },
    { titulo: "Nueva sala de laboratorio", contenido: "Habilitamos una nueva sala de laboratorio de informática con 16 equipos renovados gracias al programa de equipamiento.", offsetDias: 96 },
    { titulo: "Campeonato intercolegial", contenido: "Nuestro equipo de vóley clasificó al campeonato intercolegial de la zona. ¡Felicidades a los y las deportistas!", offsetDias: 145 },
    { titulo: "Inscripciones al nivel 2027", contenido: "Se abren inscripciones al próximo ciclo lectivo para ciclo básico y superior en la secretaría de la institución.", offsetDias: 173 },
  ];
  const noticiasFilas = NOTICIAS_DEMO.map((n, i) => [
    9001 + i, n.titulo, n.contenido,
    fmtFecha(sumarDias(hoy, -n.offsetDias)),
    baseUsuarioId["root@tecnica2.edu.ar"] ?? adminId,
    null, null,
  ]);
  const noticiasCargadas = await insertarLote(conn, "noticias", [
    "id_noticia", "titulo", "contenido", "fecha", "autor_id", "imagen",
    "imagen_path",
  ], noticiasFilas);

  const notificacionesFilas = [];
  const usuariosDestinoNotif = [9002, 9003, 9004, 9005, 9016, 9019, 9020, 9021];
  for (let i = 0; i < 12; i++) {
    const plantilla = TITULOS_NOTIFICACION[i % TITULOS_NOTIFICACION.length];
    const idUsuario = usuariosDestinoNotif[i % usuariosDestinoNotif.length];
    notificacionesFilas.push([
      9001 + i, idUsuario, plantilla.tipo, plantilla.titulo, plantilla.cuerpo,
      i % 3 === 2 ? 1 : 0, fechaPasada((i % 9) + 1, 8 + (i % 9), (i * 7) % 60),
    ]);
  }
  const notificacionesCargadas = await insertarLote(conn, "notificaciones", [
    "id_notificacion", "id_usuario", "tipo", "titulo", "cuerpo", "leida",
    "fecha",
  ], notificacionesFilas);

  const preferenciasFilas = [
    [9002, JSON.stringify({ comunicado: ["panel", "email"], inasistencia: ["whatsapp"] })],
    [9005, JSON.stringify({ nota: ["panel"], comunicado: ["panel", "email"] })],
    [9016, JSON.stringify({ inasistencia: ["whatsapp"], reunion: ["email"] })],
    [9019, JSON.stringify({ comunicado: ["panel", "email"], nota: ["panel"] })],
    [9021, JSON.stringify({ inasistencia: ["whatsapp"], sancion: ["whatsapp"], nota: ["panel"] })],
  ];
  const preferenciasCargadas = await insertarLote(conn, "notificacion_preferencias", [
    "id_usuario", "canales",
  ], preferenciasFilas);

  // ============================================================
  // 12) biblioteca: biblioteca, recursos, préstamos y objetos
  // ============================================================
  const bibliotecaFilas = [[9001, "Biblioteca Central (Demo)", "Edificio principal - 1er piso", 9004]];
  const bibliotecaCargada = await insertarLote(conn, "biblioteca", [
    "id_biblioteca", "nombre", "ubicacion", "responsable",
  ], bibliotecaFilas);

  const recursosFilas = RECURSOS_BIBLIOTECA.map(([nombre, tipo], i) => [
    9001 + i, `#${9001 + i} ${nombre}`, tipo,
    i === 5 ? "Tapa dañada por humedad (en reparación)." : `Recurso de ${tipo.toLowerCase()} de referencia.`,
    // Nota: el estado 'dañado' del enum quedó doble-codificado cuando las
    // DBs se inicializaron con cliente latin1 (docker-entrypoint), por eso
    // el dataset no lo usa: recurso 9011 queda disponible y marcado.
    i < 5 ? "prestado" : i === 6 ? "baja" : "disponible",
    9001,
  ]);
  const recursosCargados = await insertarLote(conn, "recursos", [
    "id_recurso", "nombre", "tipo", "descripcion", "estado", "id_biblioteca",
  ], recursosFilas);

  const prestamosFilas = [
    [9001, 9001, 9019, fmtFecha(sumarDias(hoy, -12)), null, "activo"],
    [9002, 9002, 9021, fmtFecha(sumarDias(hoy, -9)), null, "activo"],
    [9003, 9003, 9016, fmtFecha(sumarDias(hoy, -6)), null, "activo"],
    [9004, 9004, 9020, fmtFecha(sumarDias(hoy, -45)), null, "vencido"],
    [9005, 9005, 9002, fmtFecha(sumarDias(hoy, -45)), null, "vencido"],
    [9006, 9008, 9017, fmtFecha(sumarDias(hoy, -60)), fmtFecha(sumarDias(hoy, -48)), "devuelto"],
    [9007, 9009, 9021, fmtFecha(sumarDias(hoy, -70)), fmtFecha(sumarDias(hoy, -61)), "devuelto"],
    [9008, 9010, 9018, fmtFecha(sumarDias(hoy, -40)), fmtFecha(sumarDias(hoy, -33)), "devuelto"],
  ];
  const prestamosCargados = await insertarLote(conn, "prestamos", [
    "id_prestamo", "id_recurso", "id_usuario", "fecha_prestamo",
    "fecha_devolucion", "estado",
  ], prestamosFilas);

  const objetosFilas = OBJETOS_PERDIDOS.map((o, i) => [
    9001 + i, o.nombre, o.descripcion,
    fmtFecha(sumarDias(hoy, -o.offsetDias)),
    [9002, 9003, 9004][i % 3], o.estado,
  ]);
  const objetosCargados = await insertarLote(conn, "objetos_perdidos", [
    "id_objeto", "nombre", "descripcion", "fecha_encontrado", "encontrado_por",
    "estado",
  ], objetosFilas);

  // ============================================================
  // 13) correos, whatsapp y auditoría
  // ============================================================
  const alumnosConGmail = alumnos.filter((a) => a[10] && a[8]);
  const correosFilas = [];
  for (let i = 0; i < 8; i++) {
    const plantilla = ASUNTOS_CORREO[i % ASUNTOS_CORREO.length];
    if (i < 5) {
      const a = alumnosConGmail[i % alumnosConGmail.length];
      const enviado = i < 4;
      correosFilas.push([
        9001 + i, i % 2 ? 9002 : 9001,
        cuentaPorAlumno[a[0]] ?? null, a[8],
        plantilla.asunto, plantilla.cuerpo,
        fechaPasada((i % 20) + 2, 9 + (i % 6), (i * 11) % 60),
        enviado ? "enviado" : "fallido",
        enviado ? `<demo-${9001 + i}@tecnica2.local>` : null,
        enviado && i % 2 === 0 ? 1 : 0,
        enviado && i % 2 === 0 ? fechaPasada(3, 14, 5) : null,
      ]);
    } else {
      // Emails hacia profesores demo (uno simulado como fallido).
      const prof = DEMO_PROFESORES[i - 5];
      correosFilas.push([
        9001 + i, 9002, prof.id + 4, prof.email,
        plantilla.asunto, plantilla.cuerpo,
        fechaPasada((i % 12) + 2, 10, (i * 9) % 60),
        i === 7 ? "fallido" : "enviado",
        i === 7 ? null : `<demo-${9001 + i}@tecnica2.local>`,
        0, null,
      ]);
    }
  }
  const correosCargados = await insertarLote(conn, "correos_enviados", [
    "id_correo", "id_remitente", "id_destinatario", "email_destino", "asunto",
    "cuerpo", "fecha_envio", "estado", "message_id", "leido", "fecha_lectura",
  ], correosFilas);

  const wppFilas = [];
  for (let i = 0; i < 12; i++) {
    const cuerpo = CUERPOS_WHATSAPP[i % CUERPOS_WHATSAPP.length];
    const esDelPreceptor = i % 2 === 0;
    const tutor = DEMO_TUTORES[i % DEMO_TUTORES.length];
    const remitente = esDelPreceptor ? (i % 4 === 0 ? 9002 : 9003) : tutor.usuarioId;
    const destinatario = esDelPreceptor ? tutor.usuarioId : 9002;
    const telefono = `54911${rango(rng, 20000000, 89999999)}`;
    const nombreDestino = esDelPreceptor ? `${tutor.nombre} ${tutor.apellido}` : "Preceptoria";
    const estado = i % 6 === 5 ? "pendiente" : i === 7 ? "fallido" : i % 6 === 4 ? "leido" : "enviado";
    const errorDetalle = estado === "fallido" ? "No se pudo entregar: número inactivo." : null;
    wppFilas.push([
      9001 + i, remitente, destinatario, telefono, nombreDestino, cuerpo,
      fechaPasada((i % 14) + 1, 9 + (i % 8), (i * 17) % 60), estado,
      estado === "enviado" || estado === "leido" ? `waba-demo-${9001 + i}` : null,
      errorDetalle,
      estado === "leido" ? 1 : 0,
      estado === "leido" ? fechaPasada(i % 14, 20, 15) : null,
    ]);
  }
  const wppCargados = await insertarLote(conn, "mensajes_whatsapp", [
    "id_mensaje", "id_remitente", "id_destinatario", "telefono_destino",
    "nombre_destinatario", "cuerpo", "fecha_envio", "estado",
    "waba_message_id", "error_detalle", "leido", "fecha_lectura",
  ], wppFilas);

  const auditoriaFilas = Array.from({ length: 15 }, (_, i) => {
    const entidades = [
      { entidad: "alumnos", id: 9001 + (i % 6), antes: null, despues: JSON.stringify({ dni: 46100001 + (i % 6), estado: "activo" }) },
      { entidad: "cursos", id: 9001 + (i % 4), antes: JSON.stringify({ estado: "activo" }), despues: JSON.stringify({ estado: "activo", aula: String(101 + i) }) },
      { entidad: "prestamos", id: 9001 + (i % 3), antes: null, despues: JSON.stringify({ estado: "activo" }) },
      { entidad: "recursos", id: 9001 + (i % 5), antes: JSON.stringify({ estado: "disponible" }), despues: JSON.stringify({ estado: "prestado" }) },
      { entidad: "comunicados", id: 9001 + (i % 3), antes: null, despues: JSON.stringify({ importancia: "alta" }) },
    ];
    const e = entidades[i % entidades.length];
    return [
      9001 + i, [9001, 9002, 9003, 9004][i % 4],
      ["creo", "modifico", "elimino"][i % 3], e.entidad, e.id,
      e.antes, e.despues, `192.168.10.${2 + i}`,
      fechaPasada(i + 1, 9 + (i % 10), (i * 23) % 60),
    ];
  });
  const auditoriaCargada = await insertarLote(conn, "auditoria", [
    "id_auditoria", "id_usuario", "accion", "entidad", "id_entidad",
    "datos_antes", "datos_despues", "ip", "fecha",
  ], auditoriaFilas);

  // ============================================================
  // 14) configuracion institucional (solo completa lo vacio)
  // ============================================================
  const configFilas = [
    ["institucion_direccion", "Av. Técnicos 1250, CABA", "Dirección de la institución"],
    ["institucion_telefono", "11-4300-2020", "Teléfono de contacto"],
    ["institucion_email", "info@tecnica2.edu.ar", "Email institucional"],
    ["ciclo_lectivo_inicio", `${anio}-03-02`, "Inicio del ciclo lectivo (AAAA-MM-DD)"],
    ["ciclo_lectivo_fin", `${anio}-12-18`, "Fin del ciclo lectivo (AAAA-MM-DD)"],
  ];
  for (const fila of configFilas) {
    await conn.query(
      "INSERT INTO `configuracion` (`clave`, `valor`, `descripcion`) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE `valor` = IF(`valor` = '', VALUES(`valor`), `valor`)",
      fila
    );
  }

  // ============================================================
  // Resumen
  // ============================================================
  const conteos = {};
  for (const [tabla, pk] of TABLA_PK) {
    const [filas] = await conn.query(
      `SELECT COUNT(*) AS n FROM \`${tabla}\` WHERE \`${pk}\` >= ?`,
      [ID_MIN]
    );
    conteos[tabla] = filas[0].n;
  }
  const [logins] = await conn.query(
    "SELECT u.id_usuario, u.email, r.nombre_rol FROM usuarios u JOIN roles r ON r.id_rol = u.id_rol WHERE u.id_usuario >= ? ORDER BY u.id_usuario",
    [ID_MIN]
  );

  const detalle = {
    usuarios: usuariosCargados,
    personal: personalCargados,
    profesores: profesoresCargados,
    cursos: cursosCargados,
    alumnos: alumnosCargados,
    tutores_alumnos: vinculosCargados,
    materias: materiasCargadas,
    planes_estudio: planesCargados,
    plan_materias: planMateriasCargadas,
    correlativas: correlativasCargadas,
    asignaciones: asignacionesCargadas,
    horarios: horariosCargados,
    notas: notasCargadas,
    historial_notas: historialNotasCargado,
    boletin_materias: boletinMateriasCargadas,
    boletin_calificaciones: boletinCalificacionesCargadas,
    boletin_finalizaciones: boletinFinalizacionesCargadas,
    boletin_reaperturas: boletinReaperturasCargadas,
    boletin_historial: boletinHistorialCargado,
    asistencias: asistenciasCargadas,
    sanciones: sancionesCargadas,
    observaciones: observacionesCargadas,
    comunicados: comunicadosCargados,
    noticias: noticiasCargadas,
    notificaciones: notificacionesCargadas,
    notificacion_preferencias: preferenciasCargadas,
    biblioteca: bibliotecaCargada,
    recursos: recursosCargados,
    prestamos: prestamosCargados,
    objetos_perdidos: objetosCargados,
    correos_enviados: correosCargados,
    mensajes_whatsapp: wppCargados,
    auditoria: auditoriaCargada,
  };

  return { conteos, logins, periodo1, periodo2, detalle };
}
