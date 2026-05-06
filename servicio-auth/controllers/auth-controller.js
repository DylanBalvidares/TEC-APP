import ErrorHandler from "../ErrorHandler.js";
import Usuario from "../models/index.js";

async function obtenerTodosUsuarios() {
  try {
    const usuarios = await Usuario.findAll({
      attributes: {
        exclude: ["password"], //excluye password por motivos obvios
      },
    });

    if (!usuarios.length) {
      throw new ErrorHandler(404, "No se encontraron usuarios");
    }

    return usuarios;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerTodosUsuarios:", error);
    throw new ErrorHandler(500, "Error interno al obtener usuarios");
  }
}

async function obtenerUsuario(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de usuario invalida");
    }

    const usuario = await Usuario.findByPk(id, {
      attributes: {
        exclude: ["password"],
      },
    });

    if (!usuario) {
      throw new ErrorHandler(404, "Usuario no encontrado");
    }

    return usuario;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerUsuario:", error);
    throw new ErrorHandler(500, "Error interno al obtener usuario");
  }
}

async function crearUsuario(usuario) {
  try {
    //================= HASHEAR PWD ANTES DE CREAR EL USUARIO(SIN IMPLEMENTAR) =================
    const nuevoUsuario = await Usuario.create(usuario);

    const { id_usuario, nombre, email, password, id_rol } =
      nuevoUsuario.toJSON();

    //retornamos objeto sin pwd, por obvias razones
    return (usuarioSinPassword = {
      id_usuario: id_usuario,
      nombre: nombre,
      email: email,
      id_rol: id_rol,
    });
  } catch (error) {
    console.error("Error en crearUsuario:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El email ya existen");
    }

    throw new ErrorHandler(500, "Error al registrar el usuario");
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
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en eliminarUsuario:", error);
    throw new ErrorHandler(500, "Error interno al eliminar usuario");
  }
}

async function modificarUsuario(usuario) {
  const { id_usuario, nombre, email, password, id_rol } = usuario;

  try {
    if (!id_usuario) {
      throw new ErrorHandler(400, "ID invalida");
    }

    const resultado = await Usuario.update(
      {
        nombre: nombre,
        email: email,
        password: password,
        id_rol: id_rol,
      },
      {
        where: {
          id_usuario: id_usuario,
        },
      },
    );

    if (resultado === 0) {
      throw new ErrorHandler(404, "No se encontro el usuario especificado");
    }

    return resultado;
  } catch (error) {
    console.error("Error en modificarUsuario:", error);
    if (error instanceof ErrorHandler) {
      throw error;
    }

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El email ya esta en uso");
    }

    throw new ErrorHandler(500, "Error interno al modificar usuario");
  }
}

export {
  obtenerTodosUsuarios,
  obtenerUsuario,
  crearUsuario,
  eliminarUsuario,
  modificarUsuario,
};
