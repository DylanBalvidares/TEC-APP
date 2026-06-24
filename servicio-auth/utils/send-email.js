import { Alumno } from "../../servicio-academico/models";
import nodemailer from "nodemailer";

// Configuración básica de transporte de Email (Usa Mailtrap para testing o Gmail con App Password)
const transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io", // Reemplaza por tu proveedor en producción
  port: 2525,
  auth: {
    user: "tu_usuario_smtp",
    pass: "tu_contraseña_smtp",
  },
});

async function solicitarCodigo(req, res) {
  const { dni } = req.body;

  try {
    // 1. Verificar si el alumno existe
    const alumno = await Alumno.findOne({ where: { dni } });
    if (!alumno) {
      return res
        .status(404)
        .json({
          success: false,
          message: "El DNI no corresponde a ningún alumno inscrito.",
        });
    }

    // 2. Si el alumno ya posee una cuenta activa, denegar el proceso
    if (alumno.id_usuario !== null) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Este alumno ya posee una cuenta activa.",
        });
    }

    // 3. Generar un código aleatorio de 6 dígitos numéricos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    const expiracion = new Date(Date.now() + 15 * 60 * 1000); // Válido por 15 minutos

    // 4. Guardar temporalmente el código en la fila del alumno
    await alumno.update({
      codigo_verificacion: codigo,
      codigo_expiracion: expiracion,
    });

    // 5. Enmascarar el email para devolver al frontend por privacidad (Ej: c*****s@gmail.com)
    const [user, domain] = alumno.email.split("@");
    const emailEnmascarado = `${user[0]}*****${user[user.length - 1]}@${domain}`;

    // 6. Enviar el correo electrónico
    await transporter.sendMail({
      from: '"Sistema de Gestión Escolar" <no-reply@sge.edu.ar>',
      to: alumno.email,
      subject: "Código de activación de cuenta SGE",
      text: `Tu código de activación es: ${codigo}. Expira en 15 minutos.`,
      html: `<h1>Activación de Cuenta</h1><p>Tu código de verificación es: <strong>${codigo}</strong></p><p>Expira en 15 minutos.</p>`,
    });

    return res.status(200).json({
      success: true,
      message: "Código enviado con éxito.",
      emailEnmascarado,
    });
  } catch (error) {
    console.error("Error en solicitarCodigo:", error);
    return res
      .status(500)
      .json({ success: false, message: "Error interno del servidor." });
  }
}
