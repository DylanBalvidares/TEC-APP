import ErrorHandler from "../ErrorHandler.js";
import { Cargo } from "../models/index.js";

async function obtenerTodosCargos() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodosCargos");
  try {
    const cargos = await Cargo.findAll();
    if (!cargos.length) {
      throw new ErrorHandler(404, "No se encontraron cargos");
    }
    return cargos;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodosCargos:", error);
    throw new ErrorHandler(500, "Error interno al obtener cargos");
  }
}

async function obtenerCargo(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerCargo");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de cargo inválido");
    }
    const cargo = await Cargo.findByPk(id);
    if (!cargo) {
      throw new ErrorHandler(404, "El cargo especificado no existe");
    }
    return cargo;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerCargo:", error);
    throw new ErrorHandler(500, "Error interno al buscar el cargo");
  }
}

async function crearCargo(datos) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearCargo");
  try {
    return await Cargo.create(datos);
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearCargo:", error);
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El nombre del cargo ya existe");
    }
    throw new ErrorHandler(500, "Error interno al crear cargo");
  }
}

async function eliminarCargo(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarCargo");
  try {
    const filasBorradas = await Cargo.destroy({ where: { id_cargo: id } });
    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontró el cargo especificado");
    }
    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarCargo:", error);
    throw new ErrorHandler(500, "Error interno al eliminar el cargo");
  }
}

async function modificarCargo(cargoData) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarCargo");
  const { id_cargo, nombre_cargo, descripcion } = cargoData;
  try {
    if (!id_cargo || id_cargo < 0) {
      throw new ErrorHandler(400, "ID inválido");
    }

    const [filasAfectadas] = await Cargo.update(
      { nombre_cargo, descripcion },
      { where: { id_cargo } },
    );

    if (filasAfectadas === 0) {
      throw new ErrorHandler(404, "No se encontró el cargo especificado");
    }
    return filasAfectadas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarCargo:", error);
    throw new ErrorHandler(500, "Error interno al modificar el cargo");
  }
}

export {
  obtenerTodosCargos,
  obtenerCargo,
  crearCargo,
  eliminarCargo,
  modificarCargo,
};
