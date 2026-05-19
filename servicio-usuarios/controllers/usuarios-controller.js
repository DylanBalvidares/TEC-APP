import { where } from "sequelize";
import ErrorHandler from "../ErrorHandler.js";
import { Usuario } from "../models/index.js";
import bcrypt from "bcryptjs"; // ¡Esencial para el hashing seguro de contraseñas!

/**
 * Busca un usuario en la base de datos utilizando su dirección de correo electrónico
 */
async function buscarUsuarioPorEmail(email) {
  if (!email) {
    throw new ErrorHandler(400, "Email inválido");
  }

  try {
    const usuario = await Usuario.findOne({
      where: { email: email },
    });

    if (!usuario) {
      throw new ErrorHandler(404, "Usuario no encontrado");
    }

    return usuario;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en buscarUsuarioPorEmail:", error);
    throw new ErrorHandler(500, "Error interno al buscar el usuario");
  }
}

/**
 * Comprueba las credenciales del usuario comparando la contraseña ingresada con el hash de la DB
 */
async function comprobarContrasenaUsuario(email, contrasena) {
  if (!contrasena || !email) {
    throw new ErrorHandler(400, "Email o contraseña inválidos");
  }

  try {
    // BUG FIX: Primero buscamos al usuario únicamente por su email
    const usuario = await Usuario.findOne({
      where: { email: email },
    });

    // BUG FIX: Validar si el usuario realmente existe antes de evaluar la contraseña
    if (!usuario) {
      throw new ErrorHandler(404, "Usuario no encontrado");
    }

    // BUG FIX: Comparamos la contraseña en texto plano con la encriptada en la base de datos
    const esValida = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!esValida) {
      throw new ErrorHandler(401, "La contraseña es incorrecta");
    }

    return usuario;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en comprobarContrasenaUsuario:", error);
    throw new ErrorHandler(500, "Error interno al comprobar la contraseña");
  }
}

/**
 * Obtiene el listado completo de usuarios registrados (Excluye contraseñas)
 */
async function obtenerTodosUsuarios() {
  try {
    const usuarios = await Usuario.findAll({
      attributes: {
        exclude: ["contrasena"], // Excluye el password por motivos obvios de seguridad
      },
    });

    if (!usuarios || usuarios.length === 0) {
      throw new ErrorHandler(404, "No se encontraron usuarios");
    }

    return usuarios;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerTodosUsuarios:", error);
    throw new ErrorHandler(500, "Error interno al obtener usuarios");
  }
}

/**
 * Obtiene un único usuario a través de su Clave Primaria (PK)
 */
async function obtenerUsuario(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de usuario inválida");
    }

    const usuario = await Usuario.findByPk(id, {
      attributes: {
        exclude: ["contrasena"],
      },
    });

    if (!usuario) {
      throw new ErrorHandler(404, "Usuario no encontrado");
    }

    return usuario;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerUsuario:", error);
    throw new ErrorHandler(500, "Error interno al obtener usuario");
  }
}

/**
 * Registra un nuevo usuario aplicando Hashing automático a la credencial de acceso
 */
async function crearUsuario(datosUsuario) {
  try {
    // BUG FIX: Implementación del Hashing antes de impactar la Base de Datos
    if (datosUsuario.contrasena) {
      const salt = await bcrypt.genSalt(10);
      datosUsuario.contrasena = await bcrypt.hash(datosUsuario.contrasena, salt);
    } else {
      throw new ErrorHandler(400, "La contraseña es obligatoria para el registro");
    }

    const nuevoUsuario = await Usuario.create(datosUsuario);
    const datosFinales = nuevoUsuario.toJSON();

    // Estructuramos la respuesta omitiendo información sensible
    const usuarioSinContrasena = {
      id_usuario: datosFinales.id_usuario,
      nombre: datosFinales.nombre,
      apellido: datosFinales.apellido,
      email: datosFinales.email,
      id_rol: datosFinales.id_rol,
    };

    return usuarioSinContrasena;
  } catch (error) {
    console.error("Error en crearUsuario:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El correo electrónico ya se encuentra registrado");
    }

    if (error instanceof ErrorHandler) throw error;
    throw new ErrorHandler(500, "Error al registrar el usuario en el sistema");
  }
}

/**
 * Elimina un usuario del sistema por su ID
 */
async function eliminarUsuario(id) {
  try {
    const filasBorradas = await Usuario.destroy({
      where: { id_usuario: id },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontró el usuario especificado");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en eliminarUsuario:", error);
    throw new ErrorHandler(500, "Error interno al eliminar usuario");
  }
}

/**
 * Modifica los datos de un usuario existente (Hashea la contraseña si es modificada)
 */
async function modificarUsuario(usuario) {
  const { id_usuario, nombre, apellido, email, contrasena, id_rol } = usuario;

  try {
    if (!id_usuario) {
      throw new ErrorHandler(400, "ID inválida");
    }

    const datosAActualizar = {
      nombre,
      apellido,
      email,
      id_rol,
    };

    // BUG FIX: Si el usuario decide actualizar su contraseña, se debe volver a encriptar
    if (contrasena) {
      const salt = await bcrypt.genSalt(10);
      datosAActualizar.contrasena = await bcrypt.hash(contrasena, salt);
    }

    const [filasActualizadas] = await Usuario.update(datosAActualizar, {
      where: { id_usuario: id_usuario },
    });

    if (filasActualizadas === 0) {
      throw new ErrorHandler(404, "No se encontró el usuario especificado o los datos son idénticos");
    }

    return { ok: true, message: "Usuario modificado exitosamente" };
  } catch (error) {
    console.error("Error en modificarUsuario:", error);
    if (error instanceof ErrorHandler) throw error;

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El email ya está en uso por otro usuario");
    }

    throw new ErrorHandler(500, "Error interno al modificar usuario");
  }
}

export {
  buscarUsuarioPorEmail,
  comprobarContrasenaUsuario,
  obtenerTodosUsuarios,
  obtenerUsuario,
  crearUsuario,
  eliminarUsuario,
  modificarUsuario,
};