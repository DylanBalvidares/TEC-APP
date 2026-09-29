// Plantillas de certificados y constancias (E8). Render puro a HTML final
// listo para imprimir con window.print (ver hoja @media print en
// admin-shared.css). Sin dependencias nuevas.

export const PLANTILLAS = Object.freeze([
  { id: "alumno-regular", nombre: "Constancia de alumno regular" },
  { id: "asistencia", nombre: "Constancia de asistencia" },
]);

function esc(valor) {
  return String(valor ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function encabezado(institucion) {
  return `<div class="cert-membrete">
    <div class="cert-inst">${esc(institucion || "Escuela Técnica N°2")}</div>
    <div class="cert-sub">Constancia institucional</div>
  </div>`;
}

function pie(fecha) {
  return `<div class="cert-pie">
    <div>Emitido el ${esc(fecha)}</div>
    <div class="cert-firma">Firma y sello de la institución</div>
  </div>`;
}

export function fechaHoy() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/**
 * @param {string} tipo - "alumno-regular" | "asistencia"
 * @param {Object} datos - { alumno: {nombre, apellido, dni, curso}, institucion, extra }
 * @returns {string} HTML final o lanza Error con el faltante
 */
export function renderizarPlantilla(tipo, datos = {}) {
  const alumno = datos.alumno || {};
  if (!alumno.apellido || !alumno.nombre) throw new Error("Falta el nombre del alumno");
  if (!alumno.dni) throw new Error("Falta el DNI del alumno");
  const nombreCompleto = `${alumno.apellido}, ${alumno.nombre}`;
  const fecha = datos.fecha || fechaHoy();

  if (tipo === "alumno-regular") {
    if (!alumno.curso) throw new Error("El alumno no tiene curso asignado");
    return `${encabezado(datos.institucion)}
    <h1 class="cert-titulo">Constancia de alumno regular</h1>
    <p class="cert-cuerpo">Se deja constancia de que <strong>${esc(nombreCompleto)}</strong>
    (DNI ${esc(alumno.dni)}) es alumno regular de
    <strong>${esc(alumno.curso)}</strong> en el ciclo lectivo vigente.</p>
    ${pie(fecha)}`;
  }

  if (tipo === "asistencia") {
    const pct = datos.extra?.asistencia_pct;
    if (pct === undefined || pct === null) throw new Error("Falta el porcentaje de asistencia");
    return `${encabezado(datos.institucion)}
    <h1 class="cert-titulo">Constancia de asistencia</h1>
    <p class="cert-cuerpo">Se deja constancia de que <strong>${esc(nombreCompleto)}</strong>
    (DNI ${esc(alumno.dni)}) registra una asistencia del
    <strong>${esc(pct)}%</strong> en el período consultado.</p>
    ${pie(fecha)}`;
  }

  throw new Error(`Plantilla desconocida: ${tipo}`);
}
