/**
 * Validadores reutilizables para formularios.
 * Cada función retorna un string con el mensaje de error, o string vacío si es válido.
 */

export function validarRequerido(valor, campo = "Este campo") {
  if (!valor || (typeof valor === "string" && !valor.trim())) {
    return `${campo} es obligatorio`;
  }
  return "";
}

export function validarLongitudMinima(valor, min, campo = "Este campo") {
  if (valor && valor.trim().length < min) {
    return `${campo} debe tener al menos ${min} caracteres`;
  }
  return "";
}

export function validarLongitudMaxima(valor, max, campo = "Este campo") {
  if (valor && valor.length > max) {
    return `${campo} no puede superar los ${max} caracteres`;
  }
  return "";
}

export function validarDNI(valor) {
  if (!valor || !valor.trim()) return "El DNI es obligatorio";
  const limpio = valor.trim();
  if (!/^\d+$/.test(limpio)) return "El DNI debe contener solo números";
  if (limpio.length < 7 || limpio.length > 8) return "El DNI debe tener entre 7 y 8 dígitos";
  return "";
}

export function validarEmail(valor) {
  if (!valor || !valor.trim()) return "El email es obligatorio";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(valor.trim())) return "El email no tiene un formato válido";
  return "";
}

export function validarTelefono(valor, requerido = true) {
  if (!valor || !valor.trim()) {
    return requerido ? "El teléfono es obligatorio" : "";
  }
  const limpio = valor.trim().replace(/[\s\-()]/g, "");
  if (!/^\+?\d{7,15}$/.test(limpio)) return "El teléfono no tiene un formato válido";
  return "";
}

export function validarSoloNumeros(valor, campo = "Este campo") {
  if (valor && !/^\d+$/.test(String(valor))) {
    return `${campo} debe contener solo números`;
  }
  return "";
}

export function validarNumeroPositivo(valor, campo = "Este campo") {
  if (valor !== null && valor !== undefined && valor !== "") {
    const num = Number(valor);
    if (isNaN(num) || num < 0) return `${campo} debe ser un número positivo`;
  }
  return "";
}

export function validarAnioLectivo(valor) {
  if (!valor) return "El ciclo lectivo es obligatorio";
  const anio = Number(valor);
  const anioActual = new Date().getFullYear();
  if (isNaN(anio) || anio < 2000 || anio > anioActual + 5) {
    return `El año debe estar entre 2000 y ${anioActual + 5}`;
  }
  return "";
}

export function validarContrasena(valor, requerido = true) {
  if (!valor || !valor.trim()) {
    return requerido ? "La contraseña es obligatoria" : "";
  }
  if (valor.length < 6) return "La contraseña debe tener al menos 6 caracteres";
  return "";
}

const REGEX_FECHA_DMA = /^\d{2}\/\d{2}\/\d{4}$/;

/**
 * Valida que una fecha en formato DD/MM/YYYY sea válida.
 * @param {string} valor
 * @returns {string} Mensaje de error o vacío si es válida
 */
export function validarFechaFormato(valor) {
  if (!valor || !valor.trim()) return "";
  if (!REGEX_FECHA_DMA.test(valor.trim())) {
    return "Formato inválido. Usá DD/MM/AAAA";
  }
  const [d, m, y] = valor.trim().split("/").map(Number);
  const fecha = new Date(y, m - 1, d);
  if (
    fecha.getFullYear() !== y ||
    fecha.getMonth() !== m - 1 ||
    fecha.getDate() !== d
  ) {
    return "La fecha no es válida";
  }
  return "";
}

/**
 * Valida un objeto completo contra un conjunto de reglas.
 * @param {Object} valores - Los valores del formulario
 * @param {Object} reglas - Objeto con funciones validadoras: { campo: (valor) => string }
 * @returns {Object} errores - Objeto con mensajes de error { campo: "mensaje" }
 */
export function validarFormulario(valores, reglas) {
  const errores = {};
  for (const [campo, validador] of Object.entries(reglas)) {
    const error = validador(valores[campo]);
    if (error) errores[campo] = error;
  }
  return errores;
}
