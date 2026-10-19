import nodemailer from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import ErrorHandler from "./ErrorHandler.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// .env central de la raíz del repo (antes backend-tecApp/db/.env, movido a la
// raíz). dotenv no pisa variables ya definidas; se conserva la ruta vieja por
// compatibilidad con setups que la tengan.
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../db/.env") });

let transporter = null;

// Gancho de testabilidad: permite inyectar un transporter falso sin red.
// No altera el flujo productivo (obtenerTransporter lo crea una sola vez).
export function fijarTransporter(transportadorFalso) {
  transporter = transportadorFalso;
}

export function reiniciarTransporter() {
  transporter = null;
}

function obtenerTransporter() {
  if (transporter) return transporter;

  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new ErrorHandler(
      500,
      "Las credenciales de email (EMAIL_USER/EMAIL_PASS) no están configuradas",
    );
  }

  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return transporter;
}

export async function enviarEmailVerificacion(codigo, email) {
  try {
    const info = await obtenerTransporter().sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Código de verificación",
      html: `
            <h2>Gestión Escolar</h2>

            <p>Tu código de verificación es:</p>

            <h1>${codigo}</h1>

            <p>
                Este código vence en 15 minutos.
            </p>
        `,
    });

    if (!info) {
      throw new ErrorHandler(500, "Error al intentar enviarEmail");
    }

    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ENVIAR EMAIL:", info);
    return info;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m NODEMAILER:", error.message);
    if (error instanceof ErrorHandler) {
      throw error;
    }
    throw new ErrorHandler(500, "Error al intentar enviarEmail");
  }
}

// Email de credenciales de la cuenta de acceso (alta/reset desde la ficha del
// alumno). OJO: el cuerpo incluye la contraseña en texto plano, así que este
// mail jamás se persiste en correos_enviados y nunca se loguea su contenido.
export async function enviarCredencialesAcceso(nombre, emailCuenta, contrasena) {
  try {
    // Escape HTML: la contraseña/nombre pueden traer & < > y van al cuerpo.
    const escapar = (texto) =>
      String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const info = await obtenerTransporter().sendMail({
      from: process.env.EMAIL_USER,
      to: emailCuenta,
      subject: "Tu cuenta de acceso al sistema institucional",
      html: `
        <h2>Gestión Escolar — E.E.S.T. N.º 2</h2>
        ${nombre ? `<p>¡Hola ${escapar(nombre)}!</p>` : "<p>¡Hola!</p>"}
        <p>Se creó tu cuenta de acceso al sistema de la escuela.</p>
        <p><strong>Tu correo de acceso:</strong> ${emailCuenta}</p>
        <p><strong>Tu contraseña:</strong> <code>${escapar(contrasena)}</code></p>
        <p>Te recomendamos cambiarla apenas ingreses al sistema.</p>
      `,
    });

    if (!info) {
      throw new ErrorHandler(500, "Error al enviar el email");
    }

    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m EMAIL DE CREDENCIALES ENVIADO:", info.messageId);
    return info;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m NODEMAILER:", error.message);
    // No se relanza el mensaje original (puede tener detalles de SMTP); la
    // cuenta ya quedó creada/editada y el endpoint responde con aviso.
    return null;
  }
}

export async function enviarEmailAlumno(asunto, mensaje, emailDestino) {
  try {
    const info = await obtenerTransporter().sendMail({
      from: process.env.EMAIL_USER,
      to: emailDestino,
      subject: asunto,
      html: `
        <h2>Gestión Escolar</h2>
        <p>${mensaje.replace(/\n/g, "<br>")}</p>
      `,
    });

    if (!info) {
      throw new ErrorHandler(500, "Error al enviar el email");
    }

    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m EMAIL ENVIADO:", info.messageId);
    return info;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m NODEMAILER:", error.message);
    if (error instanceof ErrorHandler) {
      throw error;
    }
    throw new ErrorHandler(500, "Error al enviar el email");
  }
}
