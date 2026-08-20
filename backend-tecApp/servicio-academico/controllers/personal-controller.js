import ErrorHandler from "../ErrorHandler.js";
import { Cargo, Personal } from "../models/index.js";

async function obtenerTodoPersonal() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodoPersonal");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodoPersonal:", error);
    throw new ErrorHandler(500, "Error interno al obtener personal");
  }
}

async function obtenerPersonal(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerPersonal");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerPersonal:", error);
    throw new ErrorHandler(500, "Error interno al obtener personal");
  }
}

async function crearPersonal(datosPersonal) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearPersonal");
  try {
    const data = await Personal.create(datosPersonal);
    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearPersonal:", error);

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
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarPersonal");
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

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        409,
        "No se puede eliminar el personal porque tiene registros vinculados. " +
        "Usá 'Dar de baja' para marcarlo como inactivo."
      );
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarPersonal:", error);
    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function darDeBajaPersonal(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: darDeBajaPersonal");
  try {
    const [filasAfectadas] = await Personal.update(
      { estado: "baja" },
      { where: { id_personal: id } },
    );

    if (filasAfectadas === 0) {
      throw new ErrorHandler(404, "No se encontró el personal especificado");
    }

    return { mensaje: "Personal dado de baja correctamente", id_personal: id };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en darDeBajaPersonal:", error);
    throw new ErrorHandler(500, "Error interno al dar de baja al personal");
  }
}

async function modificarPersonal(personalData) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarPersonal");
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
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarPersonal:", error);
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
  darDeBajaPersonal,
};
