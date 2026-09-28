import ErrorHandler from "../../utils/ErrorHandler.js";
import Configuracion from "../../db/models/configuracion-model.js";

function validarValor(clave, valor) {
  const texto = valor === undefined || valor === null ? "" : String(valor);
  switch (clave) {
    case "institucion_nombre":
      if (!texto.trim()) throw new ErrorHandler(400, "institucion_nombre es obligatorio");
      if (texto.length > 200) throw new ErrorHandler(400, "institucion_nombre muy largo");
      return texto.trim();
    case "institucion_direccion":
    case "institucion_telefono":
      if (texto.length > 200) throw new ErrorHandler(400, `${clave} muy largo`);
      return texto.trim();
    case "institucion_email":
      if (texto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto)) {
        throw new ErrorHandler(400, "institucion_email inválido");
      }
      return texto.trim();
    case "ciclo_lectivo_anio": {
      const anio = Number(texto);
      if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
        throw new ErrorHandler(400, "ciclo_lectivo_anio debe ser un año entre 2000 y 2100");
      }
      return String(anio);
    }
    case "ciclo_lectivo_inicio":
    case "ciclo_lectivo_fin":
      if (texto && !/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        throw new ErrorHandler(400, `${clave} debe tener formato AAAA-MM-DD`);
      }
      return texto;
    default:
      throw new ErrorHandler(400, `Clave de configuración desconocida: ${clave}`);
  }
}

export const CLAVES_CONFIG = [
  "institucion_nombre",
  "institucion_direccion",
  "institucion_telefono",
  "institucion_email",
  "ciclo_lectivo_anio",
  "ciclo_lectivo_inicio",
  "ciclo_lectivo_fin",
];

export async function obtenerConfiguracion() {
  try {
    const filas = await Configuracion.findAll();
    const config = {};
    for (const f of filas) {
      const plano = typeof f.toJSON === "function" ? f.toJSON() : f;
      config[plano.clave] = plano.valor;
    }
    return config;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("[ERROR] obtenerConfiguracion:", error.message);
    throw new ErrorHandler(500, "Error interno al leer la configuración");
  }
}

export async function actualizarConfiguracion(cambios = {}) {
  try {
    const resultado = {};
    for (const [clave, valor] of Object.entries(cambios)) {
      const normalizado = validarValor(clave, valor);
      const [fila] = await Configuracion.findOrCreate({
        where: { clave },
        defaults: { clave, valor: normalizado },
      });
      if (fila.valor !== normalizado) {
        await fila.update({ valor: normalizado, fecha_actualizacion: new Date() });
      }
      resultado[clave] = normalizado;
    }
    return resultado;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("[ERROR] actualizarConfiguracion:", error.message);
    throw new ErrorHandler(500, "Error interno al guardar la configuración");
  }
}

export { validarValor };
