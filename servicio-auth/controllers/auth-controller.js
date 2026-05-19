import ErrorHandler from "../ErrorHandler.js";
import axios from "axios";
import jwt from "jsonwebtoken";

function generarToken(usuario) {
  const payload = {
    id_usuario: usuario.id_usuario,
    email: usuario.email,
    id_rol: usuario.id_rol,
  };

  const secretKey = process.env.JWT_SECRET || "clave_secreta_super_segura";
  console.log(`=== JWT_SECRET ${secretKey} ===`);

  const opciones = {
    expiresIn: "2h",
  };

  //aca se genera el JWT, obviamente utiliza el payload,
  //  la secretKey y opciones para generar el token
  return jwt.sign(payload, secretKey, opciones);
}

async function login(infoLogin) {
  const { email, contrasena } = infoLogin;

  console.log("===== EMAIL ", email);
  console.log("===== CONTRASENA ", contrasena);

  try {
    // REQ BUSCAR USUARIO POR EMAIL
    const usuario = await axios.get(
      `http://servicio-usuarios:3310/apiUsuarios/usuarios/buscar`,
      {
        params: { email },
      },
    );

    if (!usuario.data) {
      throw new ErrorHandler(404, "Usuario no encontrado");
    }

    //SI EL USUARIO EXISTE, INTENTA LOGIN(email,contrasena)
    const login = await axios.post(
      `http://servicio-usuarios:3310/apiUsuarios/usuarios/login`,
      {
        email,
        contrasena,
      },
    );

    //LA REQUEST DEVUELVE 404, EN EL CASO DE QUE
    if (!login.data) {
      throw new ErrorHandler(401, "La contraseña es incorrecta");
    }

    const datosUsuario = login.data;

    const payload = {
      id: datosUsuario.id,
      email: datosUsuario.email,
      rol: datosUsuario.id_rol,
    };

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
    if (error.response) {
      if (error.response.status === 400) {
        throw new ErrorHandler(400, "Faltan datos para el inicio de sesión");
      }

      if (error.response.status === 404) {
        throw new ErrorHandler(404, "Usuario no encontrado");
      }

      if (error.response.status === 401) {
        throw new ErrorHandler(401, "La contraseña es incorrecta");
      }
    }

    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("Error en login:", error);
    throw new ErrorHandler(500, "Error interno al logear usuario");
  }
}

// ============== SIN IMPLEMENTAR ==============
async function registrar(usuario) {
  const { email, contrasena } = usuario;
  try {
    // PETICION PARA CREAR EL USUARIO ESPECIFICADO A SERVICIO USUARIOS?
    const registrado = await axios.post(
      "http://servicio-usuarios:3310/apiUsuarios/usuarios/buscar",
    );

    if (!registrado.data) {
      throw new ErrorHandler(401, "Credenciales invalidas");
    }

    return registrado.data;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("Error en login:", error);
    throw new ErrorHandler(500, "Error interno al logear usuario");
  }
}
// ============== SIN IMPLEMENTAR ==============

export { generarToken, login };
