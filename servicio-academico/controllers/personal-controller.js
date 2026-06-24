import ErrorHandler from "../ErrorHandler.js";
import { Cargo, Personal } from "../models/index.js";

async function obtenerTodoPersonal() {
  try {
    const personal = await Personal.findAll({
      include: [
        {
          model: Cargo,
          as: "cargoPersonal",
          attributes: ["nombre_cargo", "descripcion"],
        },
      ],
    });

    if (!personal.length) {
      throw new ErrorHandler(404, "No se encontró personal");
    }

    return personal;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerTodoPersonal:", error);
    throw new ErrorHandler(500, "Error interno al obtener personal");
  }
}

async function obtenerPersonal(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de personal inválida");
    }

    const personal = await Personal.findByPk(id);

    if (!personal) {
      throw new ErrorHandler(404, "No se encontró el personal especificado");
    }

    return personal;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerPersonal:", error);
    throw new ErrorHandler(500, "Error interno al obtener personal");
  }
}

async function crearPersonal(datosPersonal) {
  try {
    const data = await Personal.create(datosPersonal);
    return data;
  } catch (error) {
    console.error("Error en crearPersonal:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      // Maneja tanto el email duplicado como el id_usuario duplicado
      const campo = error.errors[0].path;
      const mensaje =
        campo === "email"
          ? "El email ya existe"
          : "El usuario ya está asignado a otro registro de personal";
      throw new ErrorHandler(400, mensaje);
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      const campo = error.index;
      const mensaje =
        campo === "id_cargo"
          ? "El cargo especificado no existe"
          : "El usuario especificado no existe";
      throw new ErrorHandler(400, mensaje);
    }

    throw new ErrorHandler(500, "Error interno al crear personal");
  }
}

async function eliminarPersonal(id) {
  try {
    const filasBorradas = await Personal.destroy({
      where: {
        id_personal: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontró el personal especificado");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en eliminarPersonal:", error);
    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function modificarPersonal(personalData) {
  // Se actualizan los campos extraídos para coincidir con el modelo Sequelize
  const {
    id_personal,
    nombre,
    apellido,
    dni,
    fecha_nacimiento,
    fecha_ingreso,
    domicilio,
    telefono,
    email,
    estado,
    id_usuario,
    id_cargo,
  } = personalData;

  try {
    if (!id_personal || id_personal < 0) {
      throw new ErrorHandler(400, "ID inválida");
    }

    const filasAfectadas = await Personal.update(
      {
        nombre,
        apellido,
        dni,
        fecha_nacimiento,
        fecha_ingreso,
        domicilio,
        telefono,
        email,
        estado,
        id_usuario,
        id_cargo,
      },
      {
        where: {
          id_personal: id_personal,
        },
      },
    );

    if (filasAfectadas[0] === 0) {
      throw new ErrorHandler(
        404,
        "No se encontró el personal o no hubo cambios",
      );
    }

    return filasAfectadas;
  } catch (error) {
    console.error("Error en modificarPersonal:", error);
    if (error instanceof ErrorHandler) throw error;

    if (error.name === "SequelizeUniqueConstraintError") {
      const campo = error.errors[0].path;
      const mensaje =
        campo === "email"
          ? "El email ingresado ya está en uso"
          : "El ID de usuario ya está asignado a otra persona";
      throw new ErrorHandler(400, mensaje);
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        400,
        "El ID de cargo o usuario proporcionado no existe",
      );
    }

    throw new ErrorHandler(500, "Error interno al modificar personal");
  }
}

export {
  obtenerTodoPersonal,
  obtenerPersonal,
  crearPersonal,
  eliminarPersonal,
  modificarPersonal,
};
