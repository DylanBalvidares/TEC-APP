import ErrorHandler from "../ErrorHandler.js";
import axios from "axios";
import jwt from "jsonwebtoken";

/**
 * Genera un token JWT basado en la información del usuario
 */
function generarToken(usuario) {
  // Maneja tanto 'id_usuario' como 'id' por consistencia de respuestas
  const payload = {
    id_usuario: usuario.id_usuario || usuario.id,
    email: usuario.email,
    id_rol: usuario.id_rol || usuario.rol,
  };

  const secretKey = process.env.JWT_SECRET || "clave_secreta_super_segura";
  console.log(`=== JWT_SECRET PROCESADO ===`);

  const opciones = {
    expiresIn: "2h",
  };

  return jwt.sign(payload, secretKey, opciones);
}

async function obtenerPermisosDeRol(id) {
  try {
    const permisos = await axios.get(
      `http://servicio-usuarios:3310/apiPermisos/permisos/${id}`,
    );

    console.log("PERMISOS(AXIOS)->", permisos.data);

    if (!permisos.data) {
      throw new ErrorHandler(404, "Rol no encontrado");
    }

    return permisos.data;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("Error en obtenerPermisosDeRol:", error);
    throw new ErrorHandler(500, "Error interno al obtenerPermisosDeRol");
  }
}

/**
 * Lógica de inicio de sesión comunicándose con el microservicio de usuarios
 */
async function login(infoLogin) {
  const { email, contrasena } = infoLogin;

  console.log("===== EMAIL ", email);
  console.log("===== CONTRASENA ", contrasena);

  try {
    // 1. REQ BUSCAR USUARIO POR EMAIL
    const usuario = await axios.get(
      `http://servicio-usuarios:3310/apiUsuarios/usuarios/buscar`,
      { params: { email } },
    );

    if (!usuario.data) {
      throw new ErrorHandler(404, "Usuario no encontrado");
    }

    // 2. SI EL USUARIO EXISTE, INTENTA LOGIN (Verificación de contraseña en DB)
    const respuestaLogin = await axios.post(
      `http://servicio-usuarios:3310/apiUsuarios/usuarios/login`,
      { email, contrasena },
    );

    if (!respuestaLogin.data) {
      throw new ErrorHandler(401, "La contraseña es incorrecta");
    }

    const datosUsuario = respuestaLogin.data;

    const permisosRol = await obtenerPermisosDeRol(datosUsuario.id_rol);

    console.log("PERMISOS ROL->", permisosRol);
    const payload = {
      id: datosUsuario.id || datosUsuario.id_usuario,
      email: datosUsuario.email,
      rol: datosUsuario.id_rol,
      permisos: permisosRol,
    };

    // Generamos token de sesión
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "clave_secreta_super_segura",
      { expiresIn: "2h" },
    );

    return {
      mensaje: "Login exitoso",
      token: token,
      usuario: payload,
    };
  } catch (error) {
    // Interceptamos errores de Axios enviados por el servicio-usuarios
    if (error.response) {
      const status = error.response.status;
      const msg = error.response.data?.message || error.response.data || "";

      if (status === 400)
        throw new ErrorHandler(400, "Faltan datos para el inicio de sesión");
      if (status === 404) throw new ErrorHandler(404, "Usuario no encontrado");
      if (status === 401)
        throw new ErrorHandler(401, "La contraseña es incorrecta");

      throw new ErrorHandler(status, msg || "Error en el servicio de usuarios");
    }

    if (error instanceof ErrorHandler) throw error;

    console.error("Error en login:", error);
    throw new ErrorHandler(500, "Error interno al logear usuario");
  }
}

/**
 * REGISTRO: Petición estructurada para delegar la creación al servicio de usuarios
 */
async function crearUsuario(datosUsuario) {
  try {
    console.log("=== ENVIANDO REGISTRO A SERVICIO-USUARIOS ===");

    // BUG FIX: Se cambió la URL para apuntar a la ruta de creación de usuarios
    // y se le pasa el objeto 'datosUsuario' en el cuerpo del POST.
    const respuestaRegistro = await axios.post(
      "http://servicio-usuarios:3310/apiUsuarios/usuarios",
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
    if (error.response) {
      // BUG FIX: Si el microservicio de usuarios dice que el email ya existe (ej: 400 o 409),
      // heredamos ese código y mensaje para no enmascararlo con un 500.
      const status = error.response.status;
      const mensajeApi =
        error.response.data?.message ||
        "Error al registrar en la base de datos";
      throw new ErrorHandler(status, mensajeApi);
    }

    if (error instanceof ErrorHandler) throw error;

    console.error("Error en crearUsuario:", error);
    throw new ErrorHandler(
      500,
      "Error interno en el servicio de autenticación al registrar",
    );
  }
}

/**
 * MODIFICAR USUARIO: Actualización de datos del perfil
 */
async function modificarUsuario(datosNuevos) {
  try {
    console.log("=== ENVIANDO ACTUALIZACION A SERVICIO-USUARIOS ===");

    // Envía los cambios al servicio correspondiente mediante PATCH
    const respuestaModificar = await axios.patch(
      "http://servicio-usuarios:3310/apiUsuarios/usuarios",
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

    console.error("Error en modificarUsuario:", error);
    throw new ErrorHandler(
      500,
      "Error interno al intentar modificar el usuario",
    );
  }
}

// BUG FIX: Exportación explícita de todos los métodos requeridos por 'auth-routes.js'
export { generarToken, login, crearUsuario, modificarUsuario };
