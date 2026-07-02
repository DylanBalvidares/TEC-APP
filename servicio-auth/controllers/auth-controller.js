import ErrorHandler from "../ErrorHandler.js";
import axios from "axios";
import jwt from "jsonwebtoken";

import {
  crearCodigoVerificacion,
  guardarCodigoVerificacion,
  eliminarCodigoVerificacion,
} from "../controllers/codigoDeVerificacion-controller.js";

import { enviarEmailVerificacion } from "../utils/sendMail.js";

// Configuración de variables de entorno
import dotenv from "dotenv";
dotenv.config();

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://servicio-usuarios:3310";
const JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_super_segura";
const JWT_EXPIRES_IN = "2h";

/**
 * Genera un token JWT estandarizado basado en la información del usuario y sus permisos
 */
function generarToken(usuario, permisos = null) {
  const payload = {
    id: usuario.id || usuario.id_usuario,
    nombre: usuario.nombre,
    email: usuario.email,
    id_rol: usuario.id_rol || usuario.rol,
    nombre_rol: usuario.nombre_rol,
    ...(permisos && { permisos }), // Agrega los permisos solo si se proporcionan
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Obtiene los permisos asociados a un rol específico desde el microservicio
 */
async function obtenerPermisosDeRol(idRol) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerPermisosDeRol");
  try {
    const respuesta = await axios.get(`${USER_SERVICE_URL}/permisos/${idRol}`);

    if (!respuesta.data) {
      throw new ErrorHandler(404, "Rol no encontrado");
    }

    return respuesta.data;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m [ERROR] Error en obtenerPermisosDeRol:", error.message);
    throw new ErrorHandler(
      500,
      "Error interno al obtener los permisos del rol",
    );
  }
}

/**
 * Lógica de inicio de sesión comunicándose con el microservicio de usuarios
 */
async function login(infoLogin) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: login");
  const { email, contrasena } = infoLogin;

  try {
    // Se elimina la petición 'buscar' redundante. El endpoint 'login' debe resolver ambos casos.
    const respuestaLogin = await axios.post(
      `${USER_SERVICE_URL}/usuarios/login`,
      {
        email,
        contrasena,
      },
    );

    const datosUsuario = respuestaLogin.data;
    if (!datosUsuario) {
      throw new ErrorHandler(401, "Credenciales inválidas");
    }

    // Obtención de permisos desde el servicio correspondiente
    const permisosRol = await obtenerPermisosDeRol(datosUsuario.id_rol);

    // Reutilización de la función unificada para generar el token
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
    // Interceptación estructurada de errores de Axios enviados por el microservicio
    if (error.response) {
      const status = error.response.status;
      const msg =
        error.response.data?.message || "Error en el servicio de usuarios";

      if (status === 400)
        throw new ErrorHandler(400, "Faltan datos para el inicio de sesión");
      if (status === 404) throw new ErrorHandler(404, "Usuario no encontrado");
      if (status === 401)
        throw new ErrorHandler(401, "La contraseña es incorrecta");

      throw new ErrorHandler(status, msg);
    }

    if (error instanceof ErrorHandler) throw error;

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en login:", error);
    throw new ErrorHandler(500, "Error interno al logear usuario");
  }
}

/**
 * REGISTRO: Delega la creación del usuario al microservicio correspondiente
 */

async function buscarEnPadron(infoPadron) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: buscarEnPadron");
  try {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m BUSCAR EN PADRON:", infoPadron);

    const respuestaValidacion = await axios.post(
      `http://servicio-academico:3307/alumnos/validar-identidad`,
      infoPadron,
    );

    if (!respuestaValidacion.data) {
      throw new ErrorHandler(
        400,
        "No se pudieron validar los datos de tu registro",
      );
    }

    return respuestaValidacion.data;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en buscarEnPadron:", error);
    throw new ErrorHandler(
      500,
      "Error interno en el servicio de autenticación al buscarEnPadron",
    );
  }
}

async function sincronizarUsuarioAlumno(idAlumno, idUsuario) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: sincronizarUsuarioAlumno");
  try {
    const payload = {
      idAlumno,
      idUsuario,
    };
    const response = await axios.patch(
      `http://servicio-academico:3307/alumnos/sincronizar-usuario-alumno`,
      payload,
    );

    if (!response.data) {
      throw new ErrorHandler(
        400,
        "No se pudo sincronizar tu usuario con tu respectivo alumno",
      );
    }

    return response.data;
  } catch (error) {
    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ERROR EN sincronizarUsuarioAlumno->", error, "===");
    throw new ErrorHandler(500, "Error en sincronizarUsuarioAlumno");
  }
}

async function crearUsuario(datosUsuario) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearUsuario");
  try {
    const { nombre, apellido, email, contrasena, id_rol } = datosUsuario;

    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m DATOS NUEVO USUARIO:", datosUsuario);

    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ENVIANDO REGISTRO A SERVICIO-USUARIOS");

    const respuestaRegistro = await axios.post(
      `${USER_SERVICE_URL}/usuarios/registro`,
      datosUsuario,
    );

    if (!respuestaRegistro.data) {
      throw new ErrorHandler(
        400,
        "No se pudieron procesar los datos de registro",
      );
    }

    // Retorna el usuario creado enviado por la Base de Datos
    return respuestaRegistro.data;
  } catch (error) {
    console.error("STATUS:", error.response?.status); //DEBUG
    console.error("DATA:", error.response?.data); //DEBUG
    if (error.response) {
      const status = error.response.status;
      const mensajeApi =
        error.response.data?.message ||
        "Error al registrar en la base de datos";
      throw new ErrorHandler(status, mensajeApi);
    }

    if (error instanceof ErrorHandler) throw error;

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearUsuario:", error);
    throw new ErrorHandler(
      500,
      "Error interno en el servicio de autenticación al registrar",
    );
  }
}

async function iniciarRegistro(datosUsuario) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: iniciarRegistro");
  try {
    const { nacimiento, dni, email } = datosUsuario;

    if (!dni || !nacimiento || !email) {
      throw new ErrorHandler(400, "Datos mal formados");
    }

    const infoPadron = { dni, nacimiento };

    const existe = await buscarEnPadron(infoPadron);

    const id_alumno = existe.alumno.id_alumno;

    if (!existe) {
      throw new ErrorHandler(401, "Credenciales inválidas");
    }

    const codigo = crearCodigoVerificacion();

    if (!codigo) {
      throw new ErrorHandler(500, "Error al generar codigo de verificacion");
    }

    const infoCodigo = {
      email,
      codigo,
      tipo: "registro",
      id_alumno,
      expiracion: new Date(Date.now() + 15 * 60 * 1000),
    };

    await guardarCodigoVerificacion(infoCodigo);

    await enviarEmailVerificacion(codigo, email);

    return {
      message:
        "El codigo de verificacion fue enviado a tu email(no olvides verificar la seccion de spam)",
    };
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en iniciarRegistro:", error);
      const mensajeApi =
        error.response.data?.message ||
        "Error al registrar en la base de datos";
      throw new ErrorHandler(status, mensajeApi);
    }

    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.log("ERROR INICIAR REGISTRO:", error);
    throw new ErrorHandler(
      500,
      "Error interno en el servicio de autenticación al iniciarRegistro",
    );
  }
}

/**
 * MODIFICAR USUARIO: Envía actualizaciones parciales del perfil mediante PATCH
 */
async function modificarUsuario(datosNuevos) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarUsuario");
  try {
    const respuestaModificar = await axios.patch(
      `${USER_SERVICE_URL}/usuarios`,
      datosNuevos,
    );

    if (!respuestaModificar.data) {
      throw new ErrorHandler(
        400,
        "No se pudo actualizar la información del usuario",
      );
    }

    return respuestaModificar.data;
  } catch (error) {
    if (error.response) {
      throw new ErrorHandler(
        error.response.status,
        error.response.data?.message || "Error al modificar",
      );
    }
    if (error instanceof ErrorHandler) throw error;

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarUsuario:", error);
    throw new ErrorHandler(
      500,
      "Error interno al intentar modificar el usuario",
    );
  }
}

export {
  generarToken,
  login,
  crearUsuario,
  sincronizarUsuarioAlumno,
  modificarUsuario,
  buscarEnPadron,
  iniciarRegistro,
};
