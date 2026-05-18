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

async function login(usuario) {
  const { email, contrasena } = usuario;

  console.log("===== EMAIL ", email);
  try {
    // PETICION PARA BUSCAR EL USUARIO ESPECIFICADO A SERVICIO USUARIOS?
    const response = await axios.get(
      `http://servicio-usuarios:3310/apiUsuarios/usuarios/buscar`,
      {
        params: { email },
      },
    );

    if (!response.data) {
      throw new ErrorHandler(401, "Credenciales invalidas");
    }

    return response.data;
  } catch (error) {
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
