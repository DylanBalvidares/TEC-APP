import ErrorHandler from "../../utils/ErrorHandler.js";
import jwt from "jsonwebtoken";

import {
  crearCodigoVerificacion,
  guardarCodigoVerificacion,
} from "./codigoDeVerificacion-controller.js";

import { enviarEmailVerificacion } from "../../utils/sendMail.js";
import { comprobarContrasenaUsuario, crearUsuario as crearUsuarioDB, modificarUsuario as modificarUsuarioDB } from "../usuarios/usuarios-controller.js";
import { obtenerPermisosDeRol } from "../../middlewares/comprobarPermisos.js";
import { Alumno, Profesor } from "../../db/models/index.js";

const JWT_SECRET = process.env.JWT_SECRET || "e40bfee55a03ffe69a2a3ecb930df395";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "8h";

function generarToken(usuario, permisos = null) {
  const payload = {
    id: usuario.id || usuario.id_usuario,
    nombre: usuario.nombre,
    email: usuario.email,
    id_rol: usuario.id_rol || usuario.rol,
    nombre_rol: usuario.nombre_rol,
    ...(permisos && { permisos }),
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function login(infoLogin) {
  const { email, contrasena } = infoLogin;

  try {
    const datosUsuario = await comprobarContrasenaUsuario(email, contrasena);

    if (!datosUsuario) {
      throw new ErrorHandler(401, "Credenciales inválidas");
    }

    const permisosRol = await obtenerPermisosDeRol(datosUsuario.id_rol);
    const token = generarToken(datosUsuario, permisosRol);

    return {
      mensaje: "Login exitoso",
      token,
      usuario: {
        id: datosUsuario.id || datosUsuario.id_usuario,
        nombre: datosUsuario.nombre,
        email: datosUsuario.email,
        id_rol: datosUsuario.id_rol,
        nombre_rol: datosUsuario.nombre_rol,
        permisos: permisosRol,
      },
    };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("[ERROR] Error en login:", error);
    throw new ErrorHandler(500, "Error interno al logear usuario");
  }
}

async function buscarEnPadron(infoPadron) {
  const { dni, nacimiento } = infoPadron;

  try {
    if (dni && nacimiento) {
      const alumno = await Alumno.findOne({ where: { dni, fecha_nacimiento: nacimiento } });
      if (alumno) {
        return { valido: true, info: alumno.toJSON(), rol: "alumno" };
      }

      const profesor = await Profesor.findOne({ where: { dni, fecha_nacimiento: nacimiento } });
      if (profesor) {
        return { valido: true, info: profesor.toJSON(), rol: "profesor" };
      }
    }

    throw new ErrorHandler(404, "Usuario no encontrado en ninguno de los padrones institucionales");
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    throw new ErrorHandler(500, "Error al buscar en padrón");
  }
}

async function sincronizarUsuarioAlumno(idAlumno, idUsuario) {
  try {
    const alumno = await Alumno.findByPk(idAlumno);
    if (!alumno) throw new ErrorHandler(404, "Alumno no encontrado");
    await alumno.update({ id_usuario: idUsuario });
    return alumno.toJSON();
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    throw new ErrorHandler(500, "Error en sincronizarUsuarioAlumno");
  }
}

async function sincronizarUsuarioProfesor(idProfesor, idUsuario) {
  try {
    const profesor = await Profesor.findByPk(idProfesor);
    if (!profesor) throw new ErrorHandler(404, "Profesor no encontrado");
    await profesor.update({ id_usuario: idUsuario });
    return profesor.toJSON();
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    throw new ErrorHandler(500, "Error en sincronizarUsuarioProfesor");
  }
}

async function crearUsuario(datosUsuario) {
  return await crearUsuarioDB(datosUsuario);
}

async function iniciarRegistro(datosUsuario) {
  try {
    const { nacimiento, dni, email } = datosUsuario;

    if (!dni || !nacimiento || !email) {
      throw new ErrorHandler(400, "Datos mal formados");
    }

    const existe = await buscarEnPadron({ dni, nacimiento });

    if (!existe || !existe.info) {
      throw new ErrorHandler(401, "Credenciales inválidas o no encontrado en el padrón");
    }

    const id_asociado = existe.info.id_alumno || existe.info.id_profesor || existe.info.id;
    const codigo = crearCodigoVerificacion();

    const infoCodigo = {
      email,
      codigo,
      tipo: "registro",
      id_entidad: id_asociado,
      rol_asociado: existe.rol,
      expiracion: new Date(Date.now() + 15 * 60 * 1000),
    };

    await guardarCodigoVerificacion(infoCodigo);
    await enviarEmailVerificacion(codigo, email);

    return {
      message: "El codigo de verificacion fue enviado a tu email (no olvides verificar la seccion de spam)",
    };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("ERROR INICIAR REGISTRO:", error);
    throw new ErrorHandler(500, "Error interno al iniciar registro");
  }
}

async function modificarUsuario(datosNuevos) {
  return await modificarUsuarioDB(datosNuevos);
}

export {
  generarToken,
  login,
  crearUsuario,
  sincronizarUsuarioAlumno,
  sincronizarUsuarioProfesor,
  modificarUsuario,
  buscarEnPadron,
  iniciarRegistro,
};
