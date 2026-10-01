/**
 * Helpers compartidos por las vistas de comunicados (profesor y alumno).
 *
 * El endpoint `GET /api/comunidad/comunicados` devuelve los campos planos de la
 * tabla: `titulo`, `mensaje`, `importancia`, `destino`, `curso_destino`,
 * `fecha_publicacion`, `autor_id` y el include `autor`
 * (`{ id_usuario, nombre, apellido, id_rol }`).
 *
 * Antes estas vistas adivinaban nombres de campos (`contenido`, `fecha`,
 * `profesor`) que no existen en la respuesta, por eso vive todo acá.
 */

export const DESTINOS = {
  todos: "Toda la comunidad",
  profesores: "Profesores",
  alumnos: "Alumnos",
  autoridades: "Autoridades",
  curso: "Curso específico",
};

export const IMPORTANCIAS = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

/** Clase CSS del badge de importancia. */
export function claseImportancia(importancia) {
  if (importancia === "alta") return "badge-alta";
  if (importancia === "baja") return "badge-baja";
  return "badge-media";
}

/** Texto legible de la importancia. */
export function textoImportancia(importancia) {
  return IMPORTANCIAS[importancia] || "Media";
}

/**
 * Texto legible del destino. Para `curso` el backend guarda el *nombre* del
 * curso en `curso_destino` (columna varchar, no hay `id_curso` en la tabla).
 */
export function textoDestino(comunicado) {
  if (!comunicado) return "";
  if (comunicado.destino === "curso") {
    return comunicado.curso_destino
      ? `Curso: ${comunicado.curso_destino}`
      : "Curso específico";
  }
  return DESTINOS[comunicado.destino] || comunicado.destino || "General";
}

/**
 * Nombre de quien publicó. El backend ya incluye `autor`; si el comunicado es
 * viejo o el autor fue borrado (`ON DELETE SET NULL`) cae a un texto neutro.
 */
export function nombreAutor(comunicado) {
  const autor = comunicado?.autor;
  if (!autor) return "Comunicado de la institución";
  const nombre = [autor.nombre, autor.apellido].filter(Boolean).join(" ").trim();
  return nombre || "Comunicado de la institución";
}

/** Fecha de publicación ya formateada en es-AR. */
export function formatearFechaComunicado(fecha) {
  if (!fecha) return "Sin fecha";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "Sin fecha";
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Normaliza la respuesta de `obtenerTodosComunicados` a un array.
 * Acepta `{ success, data }`, un array directo o `undefined` en error.
 */
export function extraerComunicados(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  return [];
}