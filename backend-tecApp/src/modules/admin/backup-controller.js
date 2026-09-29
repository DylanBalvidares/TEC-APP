import ErrorHandler from "../../utils/ErrorHandler.js";
import {
  serializarBackup,
  verificarBackup,
} from "../../utils/backup.js";
import {
  Rol,
  Permiso,
  RolPermiso,
  Alumno,
  Curso,
  Usuario,
} from "../../db/models/index.js";
import Configuracion from "../../db/models/configuracion-model.js";

const plano = (filas) => filas.map((f) => (typeof f.toJSON === "function" ? f.toJSON() : f));

export async function exportarBackup() {
  try {
    const [roles, permisos, rolPermisos, configuracion] = await Promise.all([
      Rol.findAll(),
      Permiso.findAll(),
      RolPermiso.findAll(),
      Configuracion.findAll(),
    ]);
    // Tablas grandes: solo conteos para no saturar la respuesta.
    const [alumnos, cursos, usuarios] = await Promise.all([
      Alumno.count(),
      Curso.count(),
      Usuario.count(),
    ]);
    return serializarBackup({
      roles: plano(roles),
      permisos: plano(permisos),
      rol_permisos: plano(rolPermisos),
      configuracion: plano(configuracion),
      conteos: [{ alumnos, cursos, usuarios }],
    });
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("[ERROR] exportarBackup:", error.message);
    throw new ErrorHandler(500, "Error interno al generar el backup");
  }
}

export function validarBackup(documento) {
  const resultado = verificarBackup(documento);
  if (!resultado.ok) throw new ErrorHandler(400, resultado.error);
  return resultado;
}
