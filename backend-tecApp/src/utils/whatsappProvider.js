import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import ErrorHandler from "./ErrorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../db/.env") });

const EJEMPLOS = "Ejemplos válidos: 2364 71-5375, 02364 15-55-5010, +54 9 2364 71-5375";

// Pasos de normalización, en orden. Cada paso es puro y testeable.
// Entrada: dígitos (ya sin separadores). Salida: dígitos o null si no aplica.
function quitarPrefijoInternacional(digitos) {
  // 0054... → 54... (prefijo de discado internacional con 00).
  if (digitos.startsWith("00")) return digitos.slice(2);
  return digitos;
}

function quitarTroncalTrasPais(digitos) {
  // 540... → 54... y 5490... → 549... (cero troncal mal ubicado tras el país).
  if (/^540\d+$/.test(digitos) && digitos.startsWith("5490") === false) {
    return `54${digitos.slice(3)}`;
  }
  if (digitos.startsWith("5490")) return `549${digitos.slice(4)}`;
  return digitos;
}

function quitarTroncalNacional(digitos) {
  // 02364... → 2364... (cero de discado nacional, solo sin código país).
  if (digitos.startsWith("54") === false && digitos.startsWith("0")) {
    return digitos.slice(1);
  }
  return digitos;
}

function quitar15Movil(digitos) {
  // 236415555010 → 2364555010 (15 de móvil local tras área de 2-4 dígitos).
  return digitos.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2");
}

// Diagnostica un teléfono sin lanzar: base del normalizador, del endpoint
// de preview y de los mensajes de error. Nunca inventa dígitos: un número
// corto sin código de área se rechaza (el admin debe completarlo).
export function diagnosticarTelefono(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return { ok: false, telefono: null, motivo: "El teléfono de destino es obligatorio" };
  }
  const original = String(raw).trim();
  if (/[a-zA-Z]/.test(original)) {
    return { ok: false, telefono: null, motivo: `Teléfono "${original}" inválido: no debe contener letras. ${EJEMPLOS}` };
  }
  let digitos = original.replace(/\D/g, "");
  if (digitos === "") {
    return { ok: false, telefono: null, motivo: `Teléfono "${original}" inválido: no contiene dígitos. ${EJEMPLOS}` };
  }

  digitos = quitarPrefijoInternacional(digitos);
  digitos = quitarTroncalTrasPais(digitos);
  digitos = quitarTroncalNacional(digitos);
  digitos = quitar15Movil(digitos);

  // País explícito distinto de Argentina: no soportado (no se reescribe).
  if (digitos.startsWith("54") === false && digitos.length > 10) {
    return { ok: false, telefono: null, motivo: `Teléfono "${original}" inválido: solo se soportan números argentinos. ${EJEMPLOS}` };
  }

  // Formato nacional con área: 10 dígitos (área 2-4 + abonado 6-8).
  if (digitos.startsWith("54") === false) {
    if (/^\d{10}$/.test(digitos) === false) {
      return { ok: false, telefono: null, motivo: `Teléfono "${original}" inválido: se espera código de área + número (10 dígitos, ej. 2364 71-5375). No se completan dígitos automáticamente.` };
    }
    digitos = `54${digitos}`;
  }

  // Forzar 9 de móvil AR: 54 + 10 dígitos → 549 + 10 dígitos.
  if (/^54\d{10}$/.test(digitos)) digitos = `549${digitos.slice(2)}`;

  if (/^549\d{10}$/.test(digitos) === false) {
    return { ok: false, telefono: null, motivo: `Teléfono "${original}" inválido: formato de celular argentino no reconocido. ${EJEMPLOS}` };
  }
  return { ok: true, telefono: digitos, motivo: null };
}

// Normaliza un teléfono argentino a formato E.164 sin "+".
// Acepta "2364 71-5375", "02364 15...", "54 0 2364...", "+549...".
// Devuelve "549XXXXXXXXXX" o lanza ErrorHandler 400 si es inválido.
export function normalizarTelefonoAR(raw) {
  const r = diagnosticarTelefono(raw);
  if (r.ok === false) throw new ErrorHandler(400, r.motivo);
  return r.telefono;
}

// Validación liviana para el ingreso (crear/editar): acepta lo mismo que el
// envío sin normalizar. Retorna mensaje de error o "" si es válido.
export function validarTelefonoAR(valor, requerido = true) {
  if (!valor || !String(valor).trim()) {
    return requerido ? "El teléfono es obligatorio" : "";
  }
  const r = diagnosticarTelefono(valor);
  return r.ok ? "" : r.motivo;
}

export function whatsappConfigurado() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

// Capa abstracta de envío. Hoy: Meta WhatsApp Cloud API.
// Si WHATSAPP_TOKEN/PHONE_ID no están, opera en modo stub (desarrollo):
// devuelve ok:true con wabaId "stub-..." para no bloquear el flujo ni los tests.
export async function enviarWhatsapp(telefonoNormalizado, cuerpo) {
  if (!cuerpo || !String(cuerpo).trim()) {
    throw new ErrorHandler(400, "El mensaje es obligatorio");
  }
  if (String(cuerpo).length > 1000) {
    throw new ErrorHandler(400, "El mensaje no puede superar los 1000 caracteres");
  }

  if (whatsappConfigurado() === false) {
    console.log("[INFO] WHATSAPP stub (sin WHATSAPP_TOKEN): mensaje no enviado a proveedor");
    return { ok: true, wabaId: `stub-${Date.now()}`, modo: "stub" };
  }

  try {
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const { data } = await axios.post(
      `https://graph.facebook.com/v20.0/${phoneId}/messages`,
      {
        messaging_product: "whatsapp",
        to: telefonoNormalizado,
        type: "text",
        text: { body: String(cuerpo).slice(0, 1000) },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      },
    );
    const wabaId = data?.messages?.[0]?.id || null;
    console.log("[INFO] WHATSAPP ENVIADO:", wabaId);
    return { ok: true, wabaId };
  } catch (error) {
    const detalle =
      error.response?.data?.error?.message || error.message || "Error del proveedor WhatsApp";
    console.error("[ERROR] WHATSAPP:", detalle);
    throw new ErrorHandler(502, `No se pudo enviar el WhatsApp: ${detalle}`);
  }
}
