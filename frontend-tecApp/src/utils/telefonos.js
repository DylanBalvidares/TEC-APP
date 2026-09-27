/**
 * Regla de teléfonos argentinos para WhatsApp — espejo frontend de
 * `diagnosticarTelefono` (backend: src/utils/whatsappProvider.js).
 * Solo para display y validación en vivo; el servidor es autoritativo.
 * Mantener sincronizado con el backend (misma matriz en tests).
 */

const EJEMPLOS = "Ejemplos válidos: 2364 71-5375, 02364 15-55-5010, +54 9 2364 71-5375";

export function analizarTelefono(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { estado: "vacio", normalizado: null, mensaje: "" };
  }
  const original = String(raw).trim();
  if (/[a-zA-Z]/.test(original)) {
    return { estado: "error", normalizado: null, mensaje: `No debe contener letras. ${EJEMPLOS}` };
  }
  let digitos = original.replace(/\D/g, "");
  if (digitos === "") {
    return { estado: "error", normalizado: null, mensaje: `No contiene dígitos. ${EJEMPLOS}` };
  }

  if (digitos.startsWith("00")) digitos = digitos.slice(2);
  if (/^540\d+$/.test(digitos) && digitos.startsWith("5490") === false) {
    digitos = `54${digitos.slice(3)}`;
  } else if (digitos.startsWith("5490")) {
    digitos = `549${digitos.slice(4)}`;
  }
  if (digitos.startsWith("54") === false && digitos.startsWith("0")) {
    digitos = digitos.slice(1);
  }
  digitos = digitos.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2");

  if (digitos.startsWith("54") === false && digitos.length > 10) {
    return { estado: "error", normalizado: null, mensaje: `Solo se soportan números argentinos. ${EJEMPLOS}` };
  }
  if (digitos.startsWith("54") === false) {
    if (/^\d{10}$/.test(digitos) === false) {
      return { estado: "error", normalizado: null, mensaje: "Se espera código de área + número (10 dígitos, ej. 2364 71-5375)." };
    }
    digitos = `54${digitos}`;
  }
  if (/^54\d{10}$/.test(digitos)) digitos = `549${digitos.slice(2)}`;
  if (/^549\d{10}$/.test(digitos) === false) {
    return { estado: "error", normalizado: null, mensaje: `Formato de celular argentino no reconocido. ${EJEMPLOS}` };
  }
  return { estado: "ok", normalizado: digitos, mensaje: "" };
}

// "5492364715375" → "+54 9 2364 71-5375" (display). Null si inválido.
export function formatearTelefonoAR(normalizado) {
  const m = String(normalizado || "").match(/^549(\d{10})$/);
  if (!m) return null;
  const resto = m[1];
  // Área: se toma por descarte (abonado 6-8 dígitos) → área 4, 3 o 2.
  let area, abonado;
  if (resto.length === 10 && /^\d{4}\d{6}$/.test(resto)) {
    area = resto.slice(0, 4);
    abonado = resto.slice(4);
  } else {
    area = resto.slice(0, resto.length - 8);
    abonado = resto.slice(-8);
    if (area.length < 2 || area.length > 4) {
      area = resto.slice(0, resto.length - 7);
      abonado = resto.slice(-7);
    }
  }
  let tel = abonado;
  if (abonado.length === 8) tel = `${abonado.slice(0, 4)}-${abonado.slice(4)}`;
  else if (abonado.length === 7) tel = `${abonado.slice(0, 3)}-${abonado.slice(3)}`;
  else if (abonado.length === 6) tel = `${abonado.slice(0, 2)}-${abonado.slice(2)}`;
  return `+54 9 ${area} ${tel}`;
}

// Limpieza en vivo para inputs: conserva dígitos, +, espacios y separadores.
export function filtrarEntradaTelefono(valor) {
  return String(valor ?? "").replace(/[^\d+\s\-().]/g, "").slice(0, 25);
}
