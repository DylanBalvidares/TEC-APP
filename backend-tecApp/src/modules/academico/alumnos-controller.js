import { Op } from "sequelize";
import ErrorHandler from "../../utils/ErrorHandler.js";
import { Alumno, Curso, Asistencia } from "../../db/models/index.js";
import sequelize from "../../db/conexionDB.js";
import { validarTelefonoAR } from "../../utils/whatsappProvider.js";
import {
  pidePaginacion,
  parsearPaginacion,
  respuestaPaginada,
} from "../../utils/paginacion.js";

const COLUMNAS_ALUMNOS = ["id_alumno", "nombre", "apellido", "dni", "estado", "id_curso"];
const ALIAS_ALUMNOS = { curso: "id_curso" };

async function validarIdentidadAlumno(data) {
  console.log("\x1b[1m\x1b[34m[CTRL]\x1b[0m Ejecutando controlador: validarIdentidadAlumno");
  const { dni, nacimiento } = data;

  if (!dni || !nacimiento) {
    throw new ErrorHandler(400, "El dni o la fecha de nacimiento inválida");
  }

  try {
    const alumno = await Alumno.findOne({
      where: {
        dni: dni,
        fecha_nacimiento: nacimiento,
      },
    });

    if (!alumno) {
      throw new ErrorHandler(404, "No se encontro el alumno especificado");
    }

    return {
      valido: true,
      alumno: alumno,
    };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAlumnoPorDniYNacimiento:", error);
    throw new ErrorHandler(500, "Error interno al obtenerAlumno");
  }
}

async function obtenerTodosAlumnos(query = {}) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerTodosAlumnos");
  try {
    const incluir = [
      {
        model: Curso,
        attributes: ["nombre_curso"],
      },
    ];

    // Sin page/limit: listado completo como antes (compatibilidad).
    if (!pidePaginacion(query)) {
      const alumnos = await Alumno.findAll({ include: incluir });
      return alumnos;
    }

    const { page, limit, offset, q, sort, order } = parsearPaginacion(query, {
      columnas: COLUMNAS_ALUMNOS,
      alias: ALIAS_ALUMNOS,
    });
    const where = {};
    if (query.id_curso !== undefined && query.id_curso !== "") {
      where.id_curso = Number(query.id_curso);
    }
    if (query.estado !== undefined && query.estado !== "") {
      where.estado = String(query.estado);
    } else if (query.sinBajas === "1" || query.sinBajas === 1) {
      where.estado = { [Op.ne]: "baja" };
    }
    if (q) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${q}%` } },
        { apellido: { [Op.like]: `%${q}%` } },
        { dni: { [Op.like]: `%${q}%` } },
      ];
    }
    const { count, rows } = await Alumno.findAndCountAll({
      where,
      include: incluir,
      limit,
      offset,
      order: sort ? [[sort, order]] : [["id_alumno", "ASC"]],
    });
    return respuestaPaginada({ filas: rows, total: count, page, limit });
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerTodosAlumnos:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumnos");
  }
}

async function obtenerAlumno(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerAlumno");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de alumno inválida");
    }

    const alumno = await Alumno.findByPk(id);

    if (!alumno) {
      throw new ErrorHandler(404, "No se encontro el alumno especificado");
    }

    return alumno;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAlumno:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumno");
  }
}

async function obtenerAlumnosCurso(id, fecha = null) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerAlumnosCurso");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de curso inválida");
    }

    const alumnos = await Alumno.findAll({
      where: {
        id_curso: id,
      },
    });

    if (!alumnos.length) {
      throw new ErrorHandler(404, "No se encontraron alumnos asignados");
    }

    let asistenciasPorAlumno = new Map();
    if (fecha) {
      const asistencias = await Asistencia.findAll({
        where: { id_curso: id, fecha },
      });
      asistencias.forEach((a) => asistenciasPorAlumno.set(a.id_alumno, a));
    }

    return alumnos.map((alumno) => {
      const json = alumno.toJSON();
      const asistencia = asistenciasPorAlumno.get(alumno.id_alumno);
      if (asistencia) {
        json.estado_previo = asistencia.estado;
      }
      return json;
    });
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAlumnosCurso:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumnos");
  }
}

async function obtenerAlumnosCursoParaAlumno(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerAlumnosCursoParaAlumno");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de curso inválida");
    }

    const alumnos = await Alumno.findAll({
      where: {
        id_curso: id,
      },
      attributes: ["nombre", "apellido"],
    });

    if (!alumnos.length) {
      throw new ErrorHandler(404, "No se encontraron alumnos asignados");
    }

    return alumnos;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAlumnosCurso:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumnos");
  }
}

async function obtenerInfoParaAlumno(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: obtenerInfoParaAlumno");
  try {
    if (!id || id < 0) {
      throw new ErrorHandler(400, "ID de alumno inválida");
    }

    const alumno = await Alumno.findOne({
      where: {
        id_usuario: id,
      },

      attributes: ["id_alumno", "nombre", "apellido", "estado", "id_curso"],
      include: [
        {
          model: Curso,
          attributes: ["id_curso", "nombre_curso"],
        },
      ],
    });

    console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m OBTENER-INFO-PARA-ALUMNO:", alumno);

    if (!alumno) {
      throw new ErrorHandler(404, "No se encontró el alumno especificado");
    }

    return alumno.toJSON();
  } catch (error) {
    // Esto está excelente para propagar tus errores personalizados
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en obtenerAlumno:", error);
    throw new ErrorHandler(500, "Error interno al obtener alumno");
  }
}

async function crearAlumno(alumno) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearAlumno");
  const errorTelefono = validarTelefonoAR(alumno?.telefono_tutor, false);
  if (errorTelefono) throw new ErrorHandler(400, `Teléfono del tutor: ${errorTelefono}`);
  try {
    const data = await Alumno.create(alumno);
    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearAlumno:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El DNI o ID de Usuario ingresado ya existe");
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El curso o usuario especificado no existe");
    }

    throw new ErrorHandler(500, "Error interno al crear alumno");
  }
}

async function sincronizarUsuarioAlumno(payload) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: sincronizarUsuarioAlumno");
  try {
    const { idAlumno, idUsuario } = payload;

    if (!idAlumno || idUsuario < 0) {
      throw new ErrorHandler(400, "ID de alumno/usuario inválida");
    }

    const data = await Alumno.update(
      {
        id_usuario: idUsuario,
      },
      {
        where: {
          id_alumno: idAlumno,
        },
      },
    );

    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en sincronizarAlumno:", error);
    throw new ErrorHandler(500, "Error interno al sincronizar alumno");
  }
}

async function eliminarAlumno(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: eliminarAlumno");
  try {
    const filasBorradas = await Alumno.destroy({
      where: {
        id_alumno: id,
      },
    });

    if (filasBorradas === 0) {
      throw new ErrorHandler(404, "No se encontro el alumno especificado");
    }

    return filasBorradas;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    // Capturar error de FK: el alumno tiene asistencias/notas registradas
    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(
        409,
        "No se puede eliminar el alumno porque tiene registros de asistencias o notas vinculados. " +
        "Primero eliminá sus registros de asistencia y calificaciones."
      );
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en eliminarAlumno:", error);
    throw new ErrorHandler(500, "Error interno del servidor");
  }
}

async function modificarAlumno(alumno) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: modificarAlumno");
  // Desestructuramos todos los campos definidos en el modelo
  const {
    id_alumno,
    nombre,
    apellido,
    dni,
    fecha_nacimiento,
    nombre_tutor,
    telefono_tutor,
    domicilio,
    estado,
    id_curso,
    id_usuario,
  } = alumno;

  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m ALUMNOS-CONTROLLER:", alumno);

  const errorTelefonoMod = validarTelefonoAR(telefono_tutor, false);
  if (errorTelefonoMod) throw new ErrorHandler(400, `Teléfono del tutor: ${errorTelefonoMod}`);
  try {
    // CORRECCIÓN: Validamos el id_alumno, no el id_curso
    if (!id_alumno || id_alumno < 0) {
      throw new ErrorHandler(400, "ID de alumno inválida");
    }

    const filasAfectadas = await Alumno.update(
      {
        nombre,
        apellido,
        dni,
        fecha_nacimiento,
        nombre_tutor,
        telefono_tutor,
        domicilio,
        estado,
        id_curso,
        id_usuario,
      },
      {
        where: {
          id_alumno: id_alumno,
        },
      },
    );

    if (filasAfectadas[0] === 0) {
      throw new ErrorHandler(
        404,
        "No se encontro el alumno especificado o no hubo cambios",
      );
    }

    return filasAfectadas;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en modificarAlumno:", error);

    if (error instanceof ErrorHandler) {
      throw error;
    }

    // Agregamos manejo de errores de constraints para el update también
    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(
        400,
        "El DNI o ID de Usuario ingresado ya está registrado en otro alumno",
      );
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El curso o usuario especificado no existe");
    }

    // Por si envían un estado Enum no válido o omiten un campo allowNull: false
    if (error.name === "SequelizeValidationError") {
      throw new ErrorHandler(
        400,
        "Datos de validación incorrectos. Verifique los campos enviados.",
      );
    }

    throw new ErrorHandler(500, "Error interno al modificar alumno");
  }
}

async function darDeBajaAlumno(id) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: darDeBajaAlumno");
  try {
    // Soft delete: cambia el estado a 'baja' en vez de borrar físicamente
    // Esto preserva asistencias, notas y demás registros relacionados
    const [filasAfectadas] = await Alumno.update(
      { estado: "baja" },
      {
        where: {
          id_alumno: id,
        },
      },
    );

    if (filasAfectadas === 0) {
      throw new ErrorHandler(404, "No se encontro el alumno especificado");
    }

    return { mensaje: "Alumno dado de baja correctamente", id_alumno: id };
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en darDeBajaAlumno:", error);
    throw new ErrorHandler(500, "Error interno al dar de baja al alumno");
  }
}

// E12: validación previa estructurada del lote. Devuelve un reporte por fila
// sin insertar nada; `crearAlumnosEnLote` la reutiliza antes de guardar.
async function validarLoteAlumnos(payload) {
  const listaAlumnos = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.alumnos)
    ? payload.alumnos
    : null;

  if (!listaAlumnos || !Array.isArray(listaAlumnos) || listaAlumnos.length === 0) {
    throw new ErrorHandler(400, "Debe proporcionar una lista no vacía de alumnos para registrar");
  }

  // 1. Validar campos obligatorios por alumno
  const filas = [];
  const dnisVistos = new Set();
  const dnisDuplicadosEnLote = new Set();
  const dnisValidos = [];

  listaAlumnos.forEach((alumno, index) => {
    const pos = index + 1;
    const { nombre, apellido, dni, fecha_nacimiento, nombre_tutor, domicilio } = alumno;
    const errores = [];

    const camposFaltantes = [];
    if (!nombre || typeof nombre !== "string" || !nombre.trim()) camposFaltantes.push("nombre");
    if (!apellido || typeof apellido !== "string" || !apellido.trim()) camposFaltantes.push("apellido");
    if (!dni || (typeof dni !== "string" && typeof dni !== "number")) camposFaltantes.push("dni");
    if (!fecha_nacimiento) camposFaltantes.push("fecha_nacimiento");
    if (!nombre_tutor || typeof nombre_tutor !== "string" || !nombre_tutor.trim()) camposFaltantes.push("nombre_tutor");
    if (!domicilio || typeof domicilio !== "string" || !domicilio.trim()) camposFaltantes.push("domicilio");

    if (camposFaltantes.length > 0) {
      errores.push(`Faltan campos obligatorios: ${camposFaltantes.join(", ")}`);
    }

    if (dni) {
      const dniStr = String(dni).trim();
      if (dnisVistos.has(dniStr)) {
        dnisDuplicadosEnLote.add(dniStr);
      } else {
        dnisVistos.add(dniStr);
        dnisValidos.push(dniStr);
      }
    }

    const errorTel = validarTelefonoAR(alumno.telefono_tutor, false);
    if (errorTel) {
      errores.push(`Teléfono del tutor: ${errorTel}`);
    }

    filas.push({ fila: pos, dni: dni ?? null, ok: errores.length === 0, errores });
  });

  // 2. Verificar si existen los DNIs en la base de datos
  const alumnosExistentesBD = await Alumno.findAll({
    where: { dni: dnisValidos },
    attributes: ["dni"],
  });
  const dnisExistentes = alumnosExistentesBD.map((a) => a.dni);

  // 3. Verificar si existen los cursos especificados en la base de datos
  const idsCursos = [
    ...new Set(
      listaAlumnos
        .map((a) => a.id_curso)
        .filter((id) => id !== null && id !== undefined && id !== "")
    ),
  ];

  let cursosInexistentes = [];
  if (idsCursos.length > 0) {
    const cursosExistentes = await Curso.findAll({
      where: { id_curso: idsCursos },
      attributes: ["id_curso"],
    });
    const idsCursosExistentes = new Set(cursosExistentes.map((c) => c.id_curso));
    cursosInexistentes = idsCursos.filter((id) => !idsCursosExistentes.has(Number(id)));
  }

  const setExistentes = new Set(dnisExistentes.map((d) => String(d).trim()));
  for (const fila of filas) {
    if (fila.dni !== null && dnisDuplicadosEnLote.has(String(fila.dni).trim())) {
      fila.errores.push("DNI duplicado dentro del lote");
      fila.ok = false;
    }
    if (fila.dni !== null && setExistentes.has(String(fila.dni).trim())) {
      fila.errores.push("DNI ya registrado en el sistema");
      fila.ok = false;
    }
  }

  const validas = filas.filter((f) => f.ok).length;
  return {
    total: filas.length,
    validas,
    invalidas: filas.length - validas,
    dnisDuplicados: [...dnisDuplicadosEnLote],
    dnisExistentes,
    cursosInexistentes,
    filas,
    hayErrores:
      filas.some((f) => !f.ok) ||
      dnisDuplicadosEnLote.size > 0 ||
      dnisExistentes.length > 0 ||
      cursosInexistentes.length > 0,
  };
}

async function crearAlumnosEnLote(payload, opciones = {}) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: crearAlumnosEnLote");

  const reporte = await validarLoteAlumnos(payload);

  // Modo validación previa: reporte sin insertar (E12).
  if (opciones.soloValidar) {
    return { ok: true, mensaje: "Validación previa del lote", reporte };
  }

  const listaAlumnos = Array.isArray(payload) ? payload : payload.alumnos;

  const erroresFormato = reporte.filas
    .filter((f) => f.errores.length > 0 && !f.errores.every((e) => e.startsWith("DNI")))
    .flatMap((f) => f.errores.map((e) => `Alumno #${f.fila}: ${e}`));

  if (erroresFormato.length > 0) {
    throw new ErrorHandler(400, `Errores de validación en el lote:\n${erroresFormato.join("\n")}`);
  }

  if (reporte.dnisDuplicados.length > 0) {
    throw new ErrorHandler(
      400,
      `Existen DNIs duplicados dentro de la misma lista enviada: ${reporte.dnisDuplicados.join(", ")}`
    );
  }

  if (reporte.dnisExistentes.length > 0) {
    throw new ErrorHandler(
      400,
      `Los siguientes DNIs ya están registrados en el sistema: ${reporte.dnisExistentes.join(", ")}`
    );
  }

  if (reporte.cursosInexistentes.length > 0) {
    throw new ErrorHandler(
      400,
      `Los siguientes IDs de curso no existen en la base de datos: ${reporte.cursosInexistentes.join(", ")}`
    );
  }

  // 4. Formatear y realizar inserción masiva dentro de una transacción de Sequelize
  const alumnosParaGuardar = listaAlumnos.map((a) => ({
    nombre: a.nombre.trim(),
    apellido: a.apellido.trim(),
    dni: String(a.dni).trim(),
    fecha_nacimiento: a.fecha_nacimiento,
    nombre_tutor: a.nombre_tutor.trim(),
    telefono_tutor: a.telefono_tutor ? String(a.telefono_tutor).trim() : null,
    domicilio: a.domicilio.trim(),
    estado: a.estado || "activo",
    id_curso: a.id_curso ? Number(a.id_curso) : null,
    id_usuario: a.id_usuario ? Number(a.id_usuario) : null,
  }));

  const transaction = await sequelize.transaction();
  try {
    const alumnosCreados = await Alumno.bulkCreate(alumnosParaGuardar, {
      transaction,
      validate: true,
    });

    await transaction.commit();

    return {
      mensaje: `Se registraron ${alumnosCreados.length} alumnos correctamente`,
      cantidad: alumnosCreados.length,
      alumnos: alumnosCreados,
    };
  } catch (error) {
    await transaction.rollback();
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearAlumnosEnLote:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "Un DNI o ID de usuario en el lote ya está registrado en el sistema");
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "Uno de los cursos o usuarios especificados no existe");
    }

    if (error.name === "SequelizeValidationError") {
      throw new ErrorHandler(400, `Error de validación de datos: ${error.message}`);
    }

    throw new ErrorHandler(500, "Error interno al crear alumnos en lote");
  }
}

export {
  obtenerTodosAlumnos,
  obtenerAlumnosCurso,
  validarIdentidadAlumno,
  obtenerInfoParaAlumno,
  obtenerAlumnosCursoParaAlumno,
  obtenerAlumno,
  crearAlumno,
  crearAlumnosEnLote,
  validarLoteAlumnos,
  sincronizarUsuarioAlumno,
  eliminarAlumno,
  modificarAlumno,
  darDeBajaAlumno,
};
