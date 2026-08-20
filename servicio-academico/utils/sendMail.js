import nodemailer from "nodemailer";
import ErrorHandler from "../ErrorHandler.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function enviarEmailAlumno(asunto, mensaje, emailDestino) {
  try {
    const info = await transporter.sendMail({
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
