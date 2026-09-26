import ErrorHandler from "../../utils/ErrorHandler.js";
import {
  Nota,
  HistorialNota,
  Alumno,
  Asignacion,
  Curso,
  Materia,
  Profesor,
  Personal,
  Usuario,
} from "../../db/models/index.js";

// Helper para formatear calificacion numérica
const parseCalificacion = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const num = parseFloat(val);
  if (isNaN(num) || num < 0.0 || num > 10.0) return null;
  return Math.round(num * 10) / 10;
};

/**
 * Profesor: Obtiene las asignaciones y calificaciones de sus cursos.
 */
async function obtenerNotasProfesor(idUsuario) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerNotasProfesor para id_usuario:", idUsuario);
  try {
    const profesor = await Profesor.findOne({ where: { id_usuario: idUsuario } });
    if (!profesor) {
      throw new ErrorHandler(404, "No se encontró el perfil docente para este usuario");
    }

    const asignaciones = await Asignacion.findAll({
      where: { id_profesor: profesor.id_profesor },
      include: [
        { model: Curso, as: "cursoAsignacion" },
        { model: Materia, as: "materiaAsignacion" },
      ],
    });

    const idsAsignacion = asignaciones.map((a) => a.id_asignacion);
    if (!idsAsignacion.length) {
      return { asignaciones: [], notas: [], alumnos: [] };
    }

    // Obtener cursos únicos para traer sus alumnos
    const idsCursos = [...new Set(asignaciones.map((a) => a.id_curso))];
    const alumnos = await Alumno.findAll({
      where: { id_curso: idsCursos, estado: "activo" },
      attributes: ["id_alumno", "nombre", "apellido", "dni", "id_curso"],
      order: [["apellido", "ASC"], ["nombre", "ASC"]],
    });

    const notas = await Nota.findAll({
      where: { id_asignacion: idsAsignacion },
      include: [
        { model: Alumno, attributes: ["id_alumno", "nombre", "apellido", "dni", "id_curso"] },
        {
          model: Asignacion,
          include: [
            { model: Curso, as: "cursoAsignacion" },
            { model: Materia, as: "materiaAsignacion" },
          ],
        },
      ],
    });

    return { asignaciones, alumnos, notas };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerNotasProfesor:", error);
    throw new ErrorHandler(500, "Error interno al obtener calificaciones del docente");
  }
}

/**
 * Preceptor: Obtiene planilla de notas de un curso a su cargo.
 */
async function obtenerNotasPreceptorCurso(idCurso, idUsuario, idRol) {
  console.log(`\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerNotasPreceptorCurso curso ${idCurso}`);
  try {
    const curso = await Curso.findByPk(idCurso, {
      include: [{ model: Personal, as: "preceptorAsignado" }],
    });

    if (!curso) {
      throw new ErrorHandler(404, "El curso especificado no existe");
    }

    // Si es preceptor (rol 4), verificar que esté a su cargo
    if (parseInt(idRol) === 4) {
      const personal = await Personal.findOne({ where: { id_usuario: idUsuario } });
      if (!personal || curso.id_preceptor !== personal.id_personal) {
        throw new ErrorHandler(403, "Acceso denegado: No tenés asignado este curso");
      }
    }

    const alumnos = await Alumno.findAll({
      where: { id_curso: idCurso, estado: "activo" },
      attributes: ["id_alumno", "nombre", "apellido", "dni"],
      order: [["apellido", "ASC"], ["nombre", "ASC"]],
    });

    const asignaciones = await Asignacion.findAll({
      where: { id_curso: idCurso },
      include: [
        { model: Materia, as: "materiaAsignacion" },
        { model: Profesor, as: "profesorAsignacion", attributes: ["id_profesor", "nombre", "apellido"] },
      ],
    });

    const idsAsignacion = asignaciones.map((a) => a.id_asignacion);
    const notas = idsAsignacion.length
      ? await Nota.findAll({
          where: { id_asignacion: idsAsignacion },
        })
      : [];

    return { curso, alumnos, asignaciones, notas };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerNotasPreceptorCurso:", error);
    throw new ErrorHandler(500, "Error interno al obtener boletín del curso");
  }
}

/**
 * Alumno: Obtiene sus propias calificaciones mediante el token JWT.
 */
async function obtenerMisNotasAlumno(idUsuario) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerMisNotasAlumno idUsuario:", idUsuario);
  try {
    const alumno = await Alumno.findOne({
      where: { id_usuario: idUsuario },
      include: [{ model: Curso }],
    });

    if (!alumno) {
      throw new ErrorHandler(404, "No se encontró el registro de alumno asociado a este usuario");
    }

    let asignaciones = [];
    if (alumno.id_curso) {
      asignaciones = await Asignacion.findAll({
        where: { id_curso: alumno.id_curso },
        include: [
          { model: Materia, as: "materiaAsignacion" },
          { model: Profesor, as: "profesorAsignacion", attributes: ["id_profesor", "nombre", "apellido"] },
        ],
      });
    }

    const notas = await Nota.findAll({
      where: { id_alumno: alumno.id_alumno },
      include: [
        {
          model: Asignacion,
          include: [
            { model: Materia, as: "materiaAsignacion" },
            { model: Profesor, as: "profesorAsignacion", attributes: ["nombre", "apellido"] },
          ],
        },
      ],
    });

    // Calcular promedios por materia y general
    const notasPorMateria = {};
    notas.forEach((n) => {
      const idAsig = n.id_asignacion;
      if (!notasPorMateria[idAsig]) notasPorMateria[idAsig] = [];
      notasPorMateria[idAsig].push(parseFloat(n.calificacion));
    });

    const promediosMaterias = {};
    let sumaPromedios = 0;
    let materiasConNotaCount = 0;

    asignaciones.forEach((asig) => {
      const arrNotas = notasPorMateria[asig.id_asignacion] || [];
      if (arrNotas.length > 0) {
        const prom = arrNotas.reduce((a, b) => a + b, 0) / arrNotas.length;
        const promRedondeado = Math.round(prom * 10) / 10;
        promediosMaterias[asig.id_asignacion] = promRedondeado;
        sumaPromedios += promRedondeado;
        materiasConNotaCount++;
      } else {
        promediosMaterias[asig.id_asignacion] = null;
      }
    });

    const promedioGeneral = materiasConNotaCount > 0 ? Math.round((sumaPromedios / materiasConNotaCount) * 10) / 10 : null;

    return {
      alumno: {
        id_alumno: alumno.id_alumno,
        nombre: alumno.nombre,
        apellido: alumno.apellido,
        dni: alumno.dni,
        curso: alumno.curso ? alumno.curso.nombre_curso : "Sin curso",
      },
      asignaciones,
      notas,
      promedios: {
        por_materia: promediosMaterias,
        general: promedioGeneral,
      },
    };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerMisNotasAlumno:", error);
    throw new ErrorHandler(500, "Error interno al obtener tus calificaciones");
  }
}

/**
 * Carga o actualiza una calificación.
 */
async function crearNota(notaData, idUsuarioAuth, idRolAuth) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearNota", notaData);
  const { id_alumno, id_asignacion, calificacion, observaciones, fecha_carga } = notaData;

  try {
    if (!id_alumno || !id_asignacion) {
      throw new ErrorHandler(400, "El alumno y la asignación son obligatorios");
    }

    const valorCalificacion = parseCalificacion(calificacion);
    if (valorCalificacion === null) {
      throw new ErrorHandler(400, "La calificación ingresada no es válida (debe ser un número entre 0.0 y 10.0)");
    }

    // Validar asignación y permisos si es profesor
    const asignacion = await Asignacion.findByPk(id_asignacion, {
      include: [{ model: Curso, as: "cursoAsignacion" }],
    });

    if (!asignacion) {
      throw new ErrorHandler(404, "La asignatura/curso especificada no existe");
    }

    if (parseInt(idRolAuth) === 3) {
      const profesor = await Profesor.findOne({ where: { id_usuario: idUsuarioAuth } });
      if (!profesor || asignacion.id_profesor !== profesor.id_profesor) {
        throw new ErrorHandler(403, "Acceso denegado: No podés calificar en un curso/materia que no tenés asignado");
      }
    }

    // Validar que el alumno pertenezca al curso de la asignación
    const alumno = await Alumno.findByPk(id_alumno);
    if (!alumno) {
      throw new ErrorHandler(404, "El alumno especificado no existe");
    }

    if (alumno.id_curso !== asignacion.id_curso) {
      throw new ErrorHandler(400, "El alumno no pertenece al curso de esta materia");
    }

    const fechaFinal = fecha_carga || new Date().toISOString().split("T")[0];

    // Buscar si ya existe una nota para esta asignación y alumno
    let notaExistente = await Nota.findOne({
      where: { id_alumno, id_asignacion },
    });

    let result;
    if (notaExistente) {
      // Actualizar nota existente
      const califAnterior = notaExistente.calificacion;
      notaExistente.calificacion = valorCalificacion;
      notaExistente.fecha_carga = fechaFinal;
      if (observaciones !== undefined) notaExistente.observaciones = observaciones;
      await notaExistente.save();
      result = notaExistente;

      // Registrar historial
      await HistorialNota.create({
        id_nota: notaExistente.id_nota,
        id_alumno,
        id_asignacion,
        calificacion_anterior: califAnterior,
        calificacion_nueva: valorCalificacion,
        modificado_por: idUsuarioAuth,
        motivo: "Actualización de calificación",
      });
    } else {
      // Crear nueva nota
      result = await Nota.create({
        id_alumno,
        id_asignacion,
        calificacion: valorCalificacion,
        fecha_carga: fechaFinal,
        observaciones: observaciones || null,
      });

      // Registrar historial de creación inicial
      await HistorialNota.create({
        id_nota: result.id_nota,
        id_alumno,
        id_asignacion,
        calificacion_anterior: null,
        calificacion_nueva: valorCalificacion,
        modificado_por: idUsuarioAuth,
        motivo: "Carga inicial de calificación",
      });
    }

    return result;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearNota:", error);

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El alumno o la asignación especificada no existe");
    }

    throw new ErrorHandler(500, "Error interno al guardar la calificación");
  }
}

/**
 * Modifica una calificación existente.
 */
async function modificarNota(notaData, idUsuarioAuth, idRolAuth) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarNota", notaData);
  const { id_nota, calificacion, observaciones, fecha_carga } = notaData;

  try {
    if (!id_nota || id_nota < 0) {
      throw new ErrorHandler(400, "ID de nota inválida");
    }

    const notaExistente = await Nota.findByPk(id_nota, {
      include: [{ model: Asignacion }],
    });

    if (!notaExistente) {
      throw new ErrorHandler(404, "No se encontró la calificación especificada");
    }

    const valorCalificacion = parseCalificacion(calificacion);
    if (valorCalificacion === null) {
      throw new ErrorHandler(400, "La calificación ingresada no es válida (debe ser entre 0.0 y 10.0)");
    }

    // Si es profesor, verificar que posea esa asignación
    if (parseInt(idRolAuth) === 3) {
      const profesor = await Profesor.findOne({ where: { id_usuario: idUsuarioAuth } });
      if (!profesor || notaExistente.asignacione.id_profesor !== profesor.id_profesor) {
        throw new ErrorHandler(403, "Acceso denegado: No tenés permiso para modificar esta calificación");
      }
    }

    const califAnterior = notaExistente.calificacion;
    notaExistente.calificacion = valorCalificacion;
    if (fecha_carga) notaExistente.fecha_carga = fecha_carga;
    if (observaciones !== undefined) notaExistente.observaciones = observaciones;
    await notaExistente.save();

    // Historial
    await HistorialNota.create({
      id_nota: notaExistente.id_nota,
      id_alumno: notaExistente.id_alumno,
      id_asignacion: notaExistente.id_asignacion,
      calificacion_anterior: califAnterior,
      calificacion_nueva: valorCalificacion,
      modificado_por: idUsuarioAuth,
      motivo: "Modificación de calificación",
    });

    return notaExistente;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarNota:", error);
    throw new ErrorHandler(500, "Error interno al modificar la calificación");
  }
}

/**
 * Consulta el historial de cambios de un alumno.
 */
async function obtenerHistorialAlumno(idAlumno, idUsuarioAuth, idRolAuth) {
  console.log(`\x1b[1m\x1b[36m[INFO]\x1b[0m Consultando historial del alumno ${idAlumno}`);
  try {
    const alumno = await Alumno.findByPk(idAlumno);
    if (!alumno) {
      throw new ErrorHandler(404, "Alumno no encontrado");
    }

    // Validar autorización por rol
    if (parseInt(idRolAuth) === 1) {
      // Alumno: solo puede consultar su propio ID
      if (alumno.id_usuario !== parseInt(idUsuarioAuth)) {
        throw new ErrorHandler(403, "Acceso denegado: No podés ver el historial de otro alumno");
      }
    } else if (parseInt(idRolAuth) === 4) {
      // Preceptor: solo si es de su curso
      const personal = await Personal.findOne({ where: { id_usuario: idUsuarioAuth } });
      const curso = await Curso.findByPk(alumno.id_curso);
      if (!personal || !curso || curso.id_preceptor !== personal.id_personal) {
        throw new ErrorHandler(403, "Acceso denegado: Este alumno no pertenece a tus cursos a cargo");
      }
    }

    const historial = await HistorialNota.findAll({
      where: { id_alumno: idAlumno },
      include: [
        { model: Usuario, as: "usuarioModificador", attributes: ["nombre", "apellido", "email"] },
        {
          model: Asignacion,
          include: [
            { model: Materia, as: "materiaAsignacion" },
            { model: Curso, as: "cursoAsignacion" },
          ],
        },
      ],
      order: [["fecha_cambio", "DESC"]],
    });

    return historial;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerHistorialAlumno:", error);
    throw new ErrorHandler(500, "Error interno al obtener el historial de calificaciones");
  }
}

async function obtenerTodasNotas() {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: obtenerTodasNotas");
  try {
    const notas = await Nota.findAll();
    if (!notas.length) {
      throw new ErrorHandler(404, "No se encontraron notas");
    }
    return notas;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodasNotas:", error);
    throw new ErrorHandler(500, "Error interno al obtener notas");
  }
}

async function obtenerNota(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerNota");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de nota inválida");
    }

    const nota = await Nota.findByPk(id);
    if (!nota) {
      throw new ErrorHandler(404, "No se encontró la nota especificada");
    }
    return nota;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerNota:", error);
    throw new ErrorHandler(500, "Error interno al obtener nota");
  }
}

async function eliminarNota(id, idUsuarioAuth, idRolAuth) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarNota");
  try {
    const nota = await Nota.findByPk(id, { include: [{ model: Asignacion }] });
    if (!nota) {
      throw new ErrorHandler(404, "No se encontró la nota especificada");
    }

    if (parseInt(idRolAuth) === 3) {
      const profesor = await Profesor.findOne({ where: { id_usuario: idUsuarioAuth } });
      if (!profesor || nota.asignacione.id_profesor !== profesor.id_profesor) {
        throw new ErrorHandler(403, "Acceso denegado: No tenés permiso para eliminar esta nota");
      }
    }

    await nota.destroy();
    return { success: true, message: "Nota eliminada correctamente" };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(409, "No se puede eliminar la nota porque tiene dependencias vinculadas.");
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarNota:", error);
    throw new ErrorHandler(500, "Error interno al eliminar nota");
  }
}

export {
  obtenerTodasNotas,
  obtenerNota,
  obtenerNotasProfesor,
  obtenerNotasPreceptorCurso,
  obtenerMisNotasAlumno,
  obtenerHistorialAlumno,
  crearNota,
  eliminarNota,
  modificarNota,
};
