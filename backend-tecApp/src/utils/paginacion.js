import ErrorHandler from "./ErrorHandler.js";

// Límites del contrato uniforme de listados (C2).
const LIMITE_MAXIMO = 100;
const LIMITE_POR_DEFECTO = 20;
const Q_MAXIMO = 100;

/**
 * Indica si el request pide paginación (solo entonces la respuesta usa el
 * contrato { data, total, page, limit }; sin page/limit se devuelve el
 * listado completo como antes).
 */
export function pidePaginacion(query = {}) {
  return query.page !== undefined || query.limit !== undefined;
}

/**
 * Parsea y valida los parámetros de paginación/búsqueda/orden.
 * @param {Object} query - req.query
 * @param {Object} opciones
 * @param {string[]} opciones.columnas - allowlist para `sort`
 * @param {Object} [opciones.alias] - mapa alias -> columna real (ej. { curso: "id_curso" })
 * @param {number} [opciones.limiteMax] - tope de `limit`
 * @throws {ErrorHandler} 400 si page/limit/sort/order son inválidos
 * @returns {{ page, limit, offset, q, sort, order }}
 */
export function parsearPaginacion(query = {}, opciones = {}) {
  const { columnas = [], alias = {}, limiteMax = LIMITE_MAXIMO } = opciones;

  const page = query.page === undefined ? 1 : Number(query.page);
  if (!Number.isInteger(page) || page < 1) {
    throw new ErrorHandler(400, "Parámetro page inválido: debe ser un entero mayor a 0");
  }

  const limit =
    query.limit === undefined ? LIMITE_POR_DEFECTO : Number(query.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > limiteMax) {
    throw new ErrorHandler(400, `Parámetro limit inválido: debe ser un entero entre 1 y ${limiteMax}`);
  }

  const q = typeof query.q === "string" ? query.q.trim().slice(0, Q_MAXIMO) : "";

  let sort = null;
  if (query.sort !== undefined && query.sort !== "") {
    const pedido = String(query.sort);
    const real = alias[pedido] || pedido;
    if (!columnas.includes(real)) {
      throw new ErrorHandler(
        400,
        `Parámetro sort inválido: debe ser una de [${columnas.join(", ")}]`,
      );
    }
    sort = real;
  }

  const order = query.order === undefined || query.order === "" ? "asc" : String(query.order).toLowerCase();
  if (order !== "asc" && order !== "desc") {
    throw new ErrorHandler(400, "Parámetro order inválido: debe ser asc o desc");
  }

  return { page, limit, offset: (page - 1) * limit, q, sort, order: order.toUpperCase() };
}

/**
 * Arma la respuesta uniforme de listados paginados.
 */
export function respuestaPaginada({ filas, total, page, limit }) {
  return { data: filas, total, page, limit };
}
