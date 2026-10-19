// Helpers compartidos del dataset de prueba.
// El generador pseudoaleatorio es determinista: dos ejecuciones con la misma
// semilla producen el mismo dataset (revisable en diffs y reportes).

export const ID_MIN = 9000; // Todo registro demo lleva IDs explicitos >= 9000, limpiables sin tocar datos reales.

export function crearRng(semilla = 20260318) {
  let s = semilla >>> 0;
  return function rng() {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rango(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function eleccion(rng, lista) {
  return lista[Math.floor(rng() * lista.length)];
}

export function slug(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
}

const dos = (n) => String(n).padStart(2, "0");

export function fmtFecha(d) {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export function fmtFechaHora(d) {
  return `${fmtFecha(d)} ${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}`;
}

export function sumarDias(d, dias) {
  const copia = new Date(d);
  copia.setDate(copia.getDate() + dias);
  return copia;
}

// Ultimos N dias habiles anteriores a (o iguales a) la fecha de referencia.
// Si fechaRef es un domingo, el include anterior es viernes (de ayer+1).
export function diasHabilesPrevios(hoy, cantidad) {
  const dias = [];
  let cursor = new Date(hoy);
  if (cursor.getDay() === 0) cursor = sumarDias(cursor, -1); // domingo -> sabado(-1)
  while (dias.length < cantidad) {
    const dia = cursor.getDay();
    if (dia >= 1 && dia <= 5) dias.push(fmtFecha(cursor));
    cursor = sumarDias(cursor, -1);
  }
  return dias.reverse();
}

// Tablas que la carga toca, con su PK, para limpiar y para el resumen final.
export const TABLA_PK = [
  ["usuarios", "id_usuario"],
  ["personal", "id_personal"],
  ["profesores", "id_profesor"],
  ["alumnos", "id_alumno"],
  ["tutores_alumnos", "id_alumno"],
  ["cursos", "id_curso"],
  ["materias", "id_materia"],
  ["planes_estudio", "id_plan"],
  ["plan_materias", "id_plan_materia"],
  ["correlativas", "id_correlativa"],
  ["asignaciones", "id_asignacion"],
  ["horarios", "id_horario"],
  ["notas", "id_nota"],
  ["historial_notas", "id_historial"],
  ["periodos_boletin", "id_periodo"],
  ["boletin_materias", "id_boletin_materia"],
  ["boletin_calificaciones", "id_boletin_nota"],
  ["boletin_finalizaciones", "id_finalizacion"],
  ["boletin_reaperturas", "id_reapertura"],
  ["boletin_historial", "id_boletin_historial"],
  ["asistencias", "id_asistencia"],
  ["sanciones", "id_sancion"],
  ["observaciones", "id_observacion"],
  ["comunicados", "id_comunicado"],
  ["noticias", "id_noticia"],
  ["notificaciones", "id_notificacion"],
  ["notificacion_preferencias", "id_usuario"],
  ["biblioteca", "id_biblioteca"],
  ["recursos", "id_recurso"],
  ["prestamos", "id_prestamo"],
  ["objetos_perdidos", "id_objeto"],
  ["correos_enviados", "id_correo"],
  ["mensajes_whatsapp", "id_mensaje"],
  ["auditoria", "id_auditoria"],
];
