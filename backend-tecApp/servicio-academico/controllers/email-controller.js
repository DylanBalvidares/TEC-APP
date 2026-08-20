import ErrorHandler from "../ErrorHandler.js";
import { Alumno, Personal, Curso } from "../models/index.js";
import sequelize from "../db/conexionDB.js";
import { enviarEmailAlumno } from "../utils/sendMail.js";

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

    await enviarEmailAlumno(asunto, mensaje, emailAlumno);

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

export { enviarEmailAAlumno };
