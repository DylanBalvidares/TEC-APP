/**
 * Formato de fecha/hora único para las vistas de WhatsApp (es-AR).
 * Uso:
 *   import { formatoFechaHora } from "@/composables/useFechaHora.js";
 */
export function formatoFechaHora(f) {
  if (!f) return "—";
  const d = new Date(f);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatoFechaCorta(f) {
  if (!f) return "—";
  const d = new Date(f);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-AR");
}
