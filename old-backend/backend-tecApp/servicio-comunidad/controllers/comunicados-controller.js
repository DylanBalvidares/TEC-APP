import { ErrorHandler } from "../ErrorHandler.js";
import Comunicado from "../models/comunicados-model.js";

import { Op } from "sequelize";

export async function obtenerTodosComunicados(filtros = {}) {
  try {
    let whereClause = {};

    const rol = filtros.rol ? filtros.rol.toLowerCase() : null;

    if (rol === "alumno") {
      whereClause = {
        [Op.or]: [
          { destino: "todos" },
          { destino: "alumnos" },
          {
            destino: "curso",
            curso_destino: filtros.curso || null,
          },
        ],
      };
    } else if (rol === "profesor") {
      const cursosProfesor = filtros.cursos
        ? filtros.cursos.split(",").map((c) => c.trim()).filter(Boolean)
        : [];

      whereClause = {
        [Op.or]: [
          { destino: "todos" },
          { destino: "profesores" },
          ...(cursosProfesor.length > 0
            ? [
                {
                  destino: "curso",
                  curso_destino: {
                    [Op.in]: cursosProfesor,
                  },
                },
              ]
            : [{ destino: "curso" }]),
        ],
      };
    } else if (rol === "autoridades") {
      whereClause = {
        [Op.or]: [
          { destino: "todos" },
          { destino: "autoridades" },
        ],
      };
    } else if (rol === "root" || rol === "administrador") {
      // Administradores/root ven todos los comunicados
      whereClause = {};
    }
    // Si no hay rol o es otro, se aplica el filtro por defecto (todos)

    // Usamos Reflect.ownKeys para detectar TANTO keys string COMO Symbol (como Op.or)
    const tieneFiltros = Reflect.ownKeys(whereClause).length > 0;

    const comunicados = await Comunicado.findAll({
      where: tieneFiltros ? whereClause : undefined,
      order: [["fecha_publicacion", "DESC"]],
    });

    return comunicados;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerTodosComunicados:", error);
    throw new ErrorHandler(500, "Error interno al obtener comunicados");
  }
}

export async function obtenerComunicado(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de comunicado inválido");
    }

    const comunicado = await Comunicado.findByPk(id);

    if (!comunicado) {
      throw new ErrorHandler(404, "Comunicado no encontrado");
    }

    return comunicado;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en obtenerComunicado:", error);
    throw new ErrorHandler(500, "Error interno al obtener comunicado");
  }
}

export async function crearComunicado(datos) {
  try {
    const { titulo, mensaje, importancia, destino, curso_destino, autor_id } = datos;

    if (!titulo || !mensaje) {
      throw new ErrorHandler(400, "Título y mensaje son requeridos");
    }

    const comunicado = await Comunicado.create({
      titulo,
      mensaje,
      importancia: importancia || "media",
      destino: destino || "todos",
      curso_destino: destino === "curso" ? curso_destino : null,
      autor_id,
      fecha_publicacion: new Date(),
    });

    return comunicado;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en crearComunicado:", error);
    throw new ErrorHandler(500, "Error interno al crear comunicado");
  }
}

export async function eliminarComunicado(id) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de comunicado inválido");
    }

    const filasEliminadas = await Comunicado.destroy({
      where: { id_comunicado: id },
    });

    if (filasEliminadas === 0) {
      throw new ErrorHandler(404, "Comunicado no encontrado");
    }

    return filasEliminadas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en eliminarComunicado:", error);
    throw new ErrorHandler(500, "Error interno al eliminar comunicado");
  }
}

export async function actualizarComunicado(id, datos) {
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de comunicado inválido");
    }

    const { titulo, mensaje, importancia, destino, curso_destino } = datos;

    if (!titulo && !mensaje && !importancia && !destino && !curso_destino) {
      throw new ErrorHandler(400, "Al menos un campo debe ser actualizado");
    }

    const [filasActualizadas] = await Comunicado.update(
      {
        ...(titulo && { titulo }),
        ...(mensaje && { mensaje }),
        ...(importancia && { importancia }),
        ...(destino && { destino }),
        ...(destino === "curso" && curso_destino && { curso_destino }),
        ...(destino !== "curso" && destino && { curso_destino: null }),
      },
      { where: { id_comunicado: id } },
    );

    if (filasActualizadas === 0) {
      throw new ErrorHandler(404, "Comunicado no encontrado");
    }

    return filasActualizadas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en actualizarComunicado:", error);
    throw new ErrorHandler(500, "Error interno al actualizar comunicado");
  }
}
