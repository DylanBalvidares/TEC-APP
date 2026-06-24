import { where } from "sequelize";
import ErrorHandler from "../ErrorHandler.js";
import { Usuario, Rol } from "../models/index.js";
import obtenerPermisosDeRol from "./rol-permisos-controller.js";

async function buscarUsuarioPorEmail(email) {
  if (!email) {
    throw new ErrorHandler(400, "Email inválido");
  }

  try {
    const usuario = await Usuario.findOne({
      where: { email },
    });

    if (!usuario) {
      throw new ErrorHandler(404, "Usuario no encontrado");
    }

    return usuario;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en buscarUsuarioPorEmail:", error);
    throw new ErrorHandler(500, "Error interno al buscar el usuario");
  }
}

async function buscarUsuarioPorDni(dni) {
  if (!dni) throw new ErrorHandler(400, "DNI inválido");

  try {
    const usuario = await Usuario.findOne({
      where: { dni },
    });
    if (!usuario) {
      throw new ErrorHandler(404, "Usuario no encontrado");
    }
    return usuario;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en buscarUsuarioPorDni:", error);
    throw new ErrorHandler(500, "Error interno al buscar el usuario por DNI");
  }
}

async function comprobarContrasenaUsuario(email, contrasena) {
  if (!contrasena || !email) {
    throw new ErrorHandler(400, "Email o contraseña inválidos");
  }

  try {
    const usuario = await Usuario.findOne({
      where: { email },
      include: [{ model: Rol, as: "rol", attributes: ["nombre_rol"] }],
    });

    if (!usuario) throw new ErrorHandler(404, "Usuario no encontrado");

    // Comparación directa en texto plano
    if (usuario.contrasena !== contrasena) {
      throw new ErrorHandler(401, "La contraseña es incorrecta");
    }

    const permisos = await obtenerPermisosDeRol(usuario.id_rol);
    const datosBD = usuario.toJSON();

    return {
      id_usuario: datosBD.id_usuario,
      nombre: datosBD.nombre,
      apellido: datosBD.apellido,
      email: datosBD.email,
      nombre_rol: datosBD.rol?.nombre_rol,
      id_rol: datosBD.id_rol,
      permisos: permisos,
    };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en comprobarContrasenaUsuario:", error);
    throw new ErrorHandler(500, "Error interno al comprobar la contraseña");
  }
}

async function obtenerTodosUsuarios() {
  try {
    const usuarios = await Usuario.findAll({
      include: [{ model: Rol, as: "rol", attributes: ["nombre_rol"] }],
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

async function obtenerUsuario(id) {
  try {
    if (!id || id < 0) throw new ErrorHandler(400, "ID de usuario inválida");

    const usuario = await Usuario.findByPk(id);

    if (!usuario) throw new ErrorHandler(404, "Usuario no encontrado");
    return usuario;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerUsuario:", error);
    throw new ErrorHandler(500, "Error interno al obtener usuario");
  }
}

async function crearUsuario(datosUsuario) {
  try {
    if (!datosUsuario.contrasena) {
      throw new ErrorHandler(
        400,
        "La contraseña es obligatoria para el registro",
      );
    }

    const [permisos, rolAsociado] = await Promise.all([
      obtenerPermisosDeRol(datosUsuario.id_rol),
      Rol.findByPk(datosUsuario.id_rol, { attributes: ["nombre_rol"] }),
    ]);

    const nuevoUsuario = await Usuario.create(datosUsuario);
    const datosFinales = nuevoUsuario.toJSON();

    return {
      id_usuario: datosFinales.id_usuario,
      nombre: datosFinales.nombre,
      apellido: datosFinales.apellido,
      email: datosFinales.email,
      nombre_rol: rolAsociado?.nombre_rol || null,
      id_rol: datosFinales.id_rol,
      permisos: permisos,
    };
  } catch (error) {
    console.error("Error en crearUsuario:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(
        400,
        "El correo electrónico ya se encuentra registrado",
      );
    }
    if (error instanceof ErrorHandler) throw error;
    throw new ErrorHandler(500, "Error al registrar el usuario en el sistema");
  }
}

async function eliminarUsuario(id) {
  try {
    const filasBorradas = await Usuario.destroy({
      where: {
        id_usuario: id,
      },
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

async function modificarUsuario(usuario) {
  const { id_usuario, nombre, apellido, email, contrasena, id_rol } = usuario;

  try {
    if (!id_usuario) throw new ErrorHandler(400, "ID inválida");

    const datosAActualizar = { nombre, apellido, email, id_rol };

    // Si se envía una contraseña, se actualiza directamente sin encriptar
    if (contrasena) {
      datosAActualizar.contrasena = contrasena;
    }

    const [filasActualizadas] = await Usuario.update(datosAActualizar, {
      where: { id_usuario },
    });

    if (filasActualizadas === 0) {
      throw new ErrorHandler(
        404,
        "No se encontró el usuario especificado o los datos son idénticos",
      );
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
  buscarUsuarioPorDni,
  comprobarContrasenaUsuario,
  obtenerTodosUsuarios,
  obtenerUsuario,
  crearUsuario,
  eliminarUsuario,
  modificarUsuario,
};
