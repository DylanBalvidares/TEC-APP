import Rol from "../models/roles-model.js";
import ErrorHandler from "../ErrorHandler.js";

async function obtenerTodosRoles() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodosRoles");
  try {
    const roles = await Rol.findAll();

    if (!roles) {
      throw new ErrorHandler(404, "No se encontraron roles!");
    }

    return roles;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.log("\x1b[1m\x1b[33m[DEBUG]\x1b[0m CATCH ERROR:", error.name);
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m obtenerTodosRoles:", error.message); // ← ver qué pasó

    throw new ErrorHandler(500, "Error interno del servidor");
  }
}
export default obtenerTodosRoles;
