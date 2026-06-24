import Rol from "../models/roles-model.js";
import ErrorHandler from "../ErrorHandler.js";

async function obtenerTodosRoles() {
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

    console.log("CATCH ERROR->", error.name);
    console.error("obtenerTodosRoles:", error.message); // ← ver qué pasó

    throw new ErrorHandler(500, "Error interno del servidor");
  }
}
export default obtenerTodosRoles;
