import ErrorHandler from "../../utils/ErrorHandler.js";
import { Alumno, Personal, Curso, Correo } from "../../db/models/index.js";
import sequelize from "../../db/conexionDB.js";
import { enviarEmailAlumno } from "../../utils/sendMail.js";

async function verificarAccesoPreceptorAlumno(idUsuarioPreceptor, alumno) {
  if (!idUsuarioPreceptor) {
    throw new ErrorHandler(
      403,
      "Acceso denegado: No se identificó al preceptor",
    );
  }

  const personal = await Personal.findOne({
    where: { id_usuario: idUsuarioPreceptor },
  });

  if (!personal) {
    throw new ErrorHandler(403, "No se encontró registro de personal para este usuario");
  }

  const cursosAsignados = await Curso.findAll({
    where: { id_preceptor: personal.id_personal },
    attributes: ["id_curso"],
  });

  const idsCursosAsignados = cursosAsignados.map((c) => c.id_curso);

  if (!idsCursosAsignados.includes(alumno.id_curso)) {
    throw new ErrorHandler(
      403,
      "Acceso denegado: No tenés permiso sobre el curso de este alumno",
    );
  }
}

async function persistirCorreo(datos) {
  try {
    await Correo.create(datos);
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m No se pudo persistir el correo:", error.message);
  }
}

async function enviarEmailAAlumno(idAlumno, datosEmail, idUsuarioPreceptor) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: enviarEmailAAlumno");

  const { asunto, mensaje } = datosEmail;

  if (!asunto || !mensaje) {
    throw new ErrorHandler(400, "El asunto y el mensaje son obligatorios");
  }

  if (!idAlumno || idAlumno < 0) {
    throw new ErrorHandler(400, "ID de alumno inválido");
  }

  try {
    const alumno = await Alumno.findByPk(idAlumno);

    if (!alumno) {
      throw new ErrorHandler(404, "No se encontró el alumno especificado");
    }

    await verificarAccesoPreceptorAlumno(idUsuarioPreceptor, alumno);

    if (!alumno.id_usuario) {
      throw new ErrorHandler(404, "El alumno no tiene una cuenta de usuario asociada");
    }

    const [resultadoEmail] = await sequelize.query(
      "SELECT email FROM usuarios WHERE id_usuario = :id_usuario",
      {
        replacements: { id_usuario: alumno.id_usuario },
        type: sequelize.QueryTypes.SELECT,
      },
    );

    if (!resultadoEmail || !resultadoEmail.email) {
      throw new ErrorHandler(404, "No se encontró el email del alumno");
    }

    const emailAlumno = resultadoEmail.email;

    let resultadoEmailEnvio;
    try {
      resultadoEmailEnvio = await enviarEmailAlumno(asunto, mensaje, emailAlumno);
    } catch (error) {
      await persistirCorreo({
        id_remitente: idUsuarioPreceptor,
        id_destinatario: idAlumno,
        email_destino: emailAlumno,
        asunto,
        cuerpo: mensaje,
        estado: "fallido",
      });
      throw error;
    }

    await persistirCorreo({
      id_remitente: idUsuarioPreceptor,
      id_destinatario: idAlumno,
      email_destino: emailAlumno,
      asunto,
      cuerpo: mensaje,
      estado: "enviado",
      message_id: resultadoEmailEnvio?.messageId || null,
    });

    return {
      mensaje: `Email enviado correctamente a ${alumno.nombre} ${alumno.apellido} (${emailAlumno})`,
    };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en enviarEmailAAlumno:", error);
    throw new ErrorHandler(500, "Error interno al enviar el email");
  }
}

async function obtenerCorreosDeAlumno(idAlumno, idUsuarioPreceptor) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerCorreosDeAlumno");

  if (!idAlumno || idAlumno < 0) {
    throw new ErrorHandler(400, "ID de alumno inválido");
  }

  try {
    const alumno = await Alumno.findByPk(idAlumno);

    if (!alumno) {
      throw new ErrorHandler(404, "No se encontró el alumno especificado");
    }

    if (idUsuarioPreceptor) {
      await verificarAccesoPreceptorAlumno(idUsuarioPreceptor, alumno);
    }

    const correos = await Correo.findAll({
      where: { id_destinatario: Number(idAlumno) },
      order: [["fecha_envio", "DESC"]],
    });

    return correos;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerCorreosDeAlumno:", error);
    throw new ErrorHandler(500, "Error interno al obtener los correos");
  }
}

async function marcarCorreoLeido(idCorreo) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: marcarCorreoLeido");

  if (!idCorreo || idCorreo < 0) {
    throw new ErrorHandler(400, "ID de correo inválido");
  }

  try {
    const correo = await Correo.findByPk(idCorreo);

    if (!correo) {
      throw new ErrorHandler(404, "No se encontró el correo especificado");
    }

    if (!correo.leido) {
      await correo.update({ leido: true, fecha_lectura: new Date() });
    }

    return correo;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en marcarCorreoLeido:", error);
    throw new ErrorHandler(500, "Error interno al actualizar el correo");
  }
}

export { enviarEmailAAlumno, obtenerCorreosDeAlumno, marcarCorreoLeido };