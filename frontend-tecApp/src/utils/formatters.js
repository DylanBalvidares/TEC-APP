/**
 * Formatea una fecha ISO (YYYY-MM-DD o ISO 8601) a formato DD/MM/YYYY.
 * Acepta strings ISO o instancias de Date.
 * @param {string|Date|null|undefined} input - Fecha en formato ISO o Date
 * @returns {string} Fecha formateada como DD/MM/YYYY o "—" si es nula/vacía
 */
export function formatDate(input) {
  if (!input) return "—";

  let dateStr;
  if (input instanceof Date) {
    dateStr = input.toISOString();
  } else {
    dateStr = String(input);
  }

  const [y, m, d] = dateStr.split("T")[0].split("-");
  if (!y || !m || !d) return String(input);
  return `${d}/${m}/${y}`;
}

/**
 * Convierte fecha ISO (YYYY-MM-DD) a formato display DD/MM/YYYY.
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function toDisplayDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("T")[0].split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/**
 * Convierte fecha display DD/MM/YYYY a ISO YYYY-MM-DD para la API.
 * @param {string|null|undefined} display
 * @returns {string}
 */
export function parseDisplayDate(display) {
  if (!display) return "";
  const partes = display.trim().split("/");
  if (partes.length !== 3) return display;
  const [d, m, y] = partes;
  if (d.length === 2 && m.length === 2 && y.length === 4) {
    return `${y}-${m}-${d}`;
  }
  return display;
}

/**
 * Formatea una fecha a formato legible en español (ej: "15 de julio de 2026").
 * @param {string|Date|null|undefined} input
 * @returns {string}
 */
export function formatDateLong(input) {
  if (!input) return "—";
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return String(input);
  return date.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
