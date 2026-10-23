import { Op } from "sequelize";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import ErrorHandler from "../../utils/ErrorHandler.js";
import {
  Alumno,
  Curso,
  Asistencia,
  Usuario,
  Asignacion,
  Profesor,
  Materia,
} from "../../db/models/index.js";
import sequelize from "../../db/conexionDB.js";
import { validarTelefonoAR } from "../../utils/whatsappProvider.js";
import { enviarCredencialesAcceso } from "../../utils/sendMail.js";
import {
  pidePaginacion,
  parsearPaginacion,
  respuestaPaginada,
} from "../../utils/paginacion.js";

const COLUMNAS_ALUMNOS = ["id_alumno", "nombre", "apellido", "dni", "estado", "id_curso"];
const ALIAS_ALUMNOS = { curso: "id_curso" };

// Contraseña de la cuenta de acceso: mismo estándar que usuarios-controller
// (bcrypt con 10 rondas).
const RONDAS_BCRYPT = 10;

// Rol asignado a toda cuenta creada desde la ficha de un alumno.
const ROL_ALUMNO_ID = 1;

//Nunca se toca una cuenta root desde la ficha de un alumno.
const ROL_ROOT_ID = 8;

// Genera una contraseña de acceso legible por email: 12 alfanuméricos, sin
// caracteres ambiguos (0/O, 1/l/I). Solo viaja dentro del mail de credenciales:
// nunca se devuelve en la respuesta ni se loguea su contenido.
function generarContrasenaSegura() {
  const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let contrasena = "";
  for (let i = 0; i < 12; i += 1) {
    contrasena += ALFABETO[crypto.randomInt(ALFABETO.length)];
  }
  return contrasena;
}

// Include estándar para exponer la cuenta de acceso en los lecturas de alumnos.
const INCLUDE_CUENTA = {
  model: Usuario,
  as: "usuario",
  attributes: ["id_usuario", "email"],
};

// Normaliza el email del legajo: trim y vacío => null (evita que el validador
// isEmail del modelo rechace "" y tumbe el alta). En modificarAlumno un valor
// undefined se preserva tal cual para no borrar el email ya almacenado.
function normalizarEmail(valor) {
  if (valor === undefined) return undefined;
  if (valor === null) return null;
  if (typeof valor !== "string") return null;
  const limpio = valor.trim();
  return limpio || null;
}

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
      { model: Curso, attributes: ["nombre_curso"] },
      INCLUDE_CUENTA,
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

    const alumno = await Alumno.findByPk(id, {
      include: [INCLUDE_CUENTA],
    });

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
      include: [INCLUDE_CUENTA],
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

async function obtenerParticipantesParaAlumno(idUsuario) {
  try {
    const id = Number(idUsuario);
    if (!Number.isInteger(id) || id <= 0) {
      throw new ErrorHandler(400, "Usuario inválido");
    }

    // El curso siempre se determina a partir de la sesión autenticada; nunca
    // se acepta un id_curso enviado por el cliente para esta consulta.
    const alumno = await Alumno.findOne({
      where: { id_usuario: id },
      attributes: ["id_alumno", "id_curso"],
    });
    if (!alumno) throw new ErrorHandler(404, "No se encontró el alumno");
    if (!alumno.id_curso) {
      return { curso: null, companeros: [], profesores: [] };
    }

    const idCurso = Number(alumno.id_curso);
    const curso = await Curso.findByPk(idCurso, {
      attributes: ["id_curso", "nombre_curso"],
      include: [{
        model: Profesor,
        as: "profesorTitular",
        attributes: ["id_profesor", "nombre", "apellido"],
        required: false,
      }],
    });
    if (!curso) throw new ErrorHandler(404, "No se encontró el curso del alumno");

    const alumnosCurso = await Alumno.findAll({
      where: {
        id_curso: idCurso,
        estado: { [Op.in]: ["activo", "condicional"] },
      },
      attributes: ["id_alumno", "nombre", "apellido"],
      order: [["apellido", "ASC"], ["nombre", "ASC"]],
    });
    const companeros = alumnosCurso
      .filter((otro) => Number(otro.id_alumno) !== Number(alumno.id_alumno))
      .map((otro) => ({
        nombre: otro.nombre,
        apellido: otro.apellido,
      }));

    const asignaciones = await Asignacion.findAll({
      where: { id_curso: idCurso },
      attributes: ["id_profesor"],
      include: [
        {
          model: Profesor,
          as: "profesorAsignacion",
          attributes: ["id_profesor", "nombre", "apellido"],
          required: false,
        },
        {
          model: Materia,
          as: "materiaAsignacion",
          attributes: ["id_materia", "nombre_materia"],
          required: false,
        },
      ],
    });

    const profesoresPorId = new Map();
    const agregarProfesor = (profesor, materia = null, esTitular = false) => {
      if (!profesor?.id_profesor) return;
      const key = Number(profesor.id_profesor);
      if (!profesoresPorId.has(key)) {
        profesoresPorId.set(key, {
          nombre: profesor.nombre,
          apellido: profesor.apellido,
          es_titular: false,
          materias: [],
        });
      }
      const registro = profesoresPorId.get(key);
      if (esTitular) registro.es_titular = true;
      if (materia?.nombre_materia && !registro.materias.includes(materia.nombre_materia)) {
        registro.materias.push(materia.nombre_materia);
      }
    };

    agregarProfesor(curso.profesorTitular, null, true);
    asignaciones.forEach((asignacion) => {
      agregarProfesor(asignacion.profesorAsignacion, asignacion.materiaAsignacion);
    });

    return {
      curso: { id_curso: curso.id_curso, nombre_curso: curso.nombre_curso },
      companeros,
      profesores: [...profesoresPorId.values()].sort((a, b) =>
        `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, "es"),
      ),
    };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("[ERROR] Error en obtenerParticipantesParaAlumno:", error);
    throw new ErrorHandler(500, "Error interno al obtener participantes del curso");
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
    const data = await Alumno.create({
      ...alumno,
      email: normalizarEmail(alumno?.email),
    });
    return data;
  } catch (error) {
    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en crearAlumno:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(400, "El DNI o ID de Usuario ingresado ya existe");
    }

    if (error.name === "SequelizeForeignKeyConstraintError") {
      throw new ErrorHandler(400, "El curso o usuario especificado no existe");
    }

    if (error.name === "SequelizeValidationError") {
      throw new ErrorHandler(
        400,
        "Datos de validación incorrectos. Verifique los campos enviados.",
      );
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

// Crea o actualiza la cuenta de acceso (usuarios) de un alumno desde su ficha.
// - Sin cuenta: exige email + contrasena, crea el usuario con rol Alumno (1)
//   y vincula alumnos.id_usuario.
// - Con cuenta: actualiza el email si cambió y/o la contraseña si viene.
// Lo usan administrativo (sus alumnos) y preceptor (limitado por
// validarCursoPreceptor a sus cursos); ver PATCH /alumnos/:id/cuenta.
async function gestionarCuentaAlumno(id, datosCuenta = {}) {
  console.log("\x1b[1m\x1b[36m[INFO]\x1b[0m Ejecutando controlador: gestionarCuentaAlumno");
  const idAlumno = Number(id);
  if (!idAlumno || idAlumno < 0) {
    throw new ErrorHandler(400, "ID de alumno inválida");
  }

  const email =
    typeof datosCuenta?.email === "string" ? datosCuenta.email.trim() : "";
  const contrasena =
    typeof datosCuenta?.contrasena === "string" ? datosCuenta.contrasena.trim() : "";
  // Casilla "Enviar credenciales por email": si no viene contraseña, se
  // genera una seguridad en el servidor y sale por email al guardar.
  const enviarCredenciales = datosCuenta?.enviarCredenciales === true;
  let contrasenaUsada = contrasena;
  if (enviarCredenciales && !contrasenaUsada) {
    contrasenaUsada = generarContrasenaSegura();
  }

  try {
    const alumno = await Alumno.findByPk(idAlumno);
    if (!alumno) {
      throw new ErrorHandler(404, "No se encontro el alumno especificado");
    }

    // Con cuenta vinculada: solo email y/o contraseña (el rol queda igual).
    if (alumno.id_usuario) {
      const cuenta = await Usuario.findByPk(alumno.id_usuario);
      if (!cuenta) {
        throw new ErrorHandler(404, "No se encontró la cuenta vinculada al alumno");
      }

      if (Number(cuenta.id_rol) === ROL_ROOT_ID) {
        throw new ErrorHandler(
          403,
          "No se puede modificar una cuenta root desde la ficha del alumno",
        );
      }

      const datosAActualizar = {};
      if (email && email !== cuenta.email) {
        datosAActualizar.email = email;
      }
      if (contrasenaUsada) {
        datosAActualizar.contrasena = await bcrypt.hash(contrasenaUsada, RONDAS_BCRYPT);
      }

      if (Object.keys(datosAActualizar).length === 0) {
        return {
          ok: true,
          creada: false,
          cambios: false,
          message: "La cuenta ya está actualizada",
        };
      }

      await cuenta.update(datosAActualizar);

      let credencialesEnviadas;
      let aviso;
      if (enviarCredenciales) {
        const enviado = await enviarCredencialesAcceso(
          `${alumno.nombre} ${alumno.apellido}`.trim(),
          datosAActualizar.email ?? cuenta.email,
          contrasenaUsada,
        );
        credencialesEnviadas = Boolean(enviado);
        if (!enviado) {
          aviso =
            "La cuenta quedó guardada, pero no se pudo enviar el email de credenciales. Podés reintentarlo desde la edición de la ficha.";
        }
      }

      return {
        ok: true,
        creada: false,
        cambios: true,
        message: "Cuenta de acceso actualizada",
        usuario: {
          id_usuario: cuenta.id_usuario,
          email: datosAActualizar.email ?? cuenta.email,
        },
        ...(enviarCredenciales
          ? { credencialesEnviadas, ...(aviso ? { aviso } : {}) }
          : {}),
      };
    }

    // Sin cuenta: alta y vinculación en un solo paso.
    if (!email || !contrasenaUsada) {
      throw new ErrorHandler(
        400,
        !contrasenaUsada
          ? "El email y la contraseña son obligatorios para crear la cuenta de acceso"
          : "El email es obligatorio: es el correo de la cuenta y donde se envían las credenciales",
      );
    }

    const nuevaCuenta = await Usuario.create({
      nombre: alumno.nombre,
      apellido: alumno.apellido,
      email,
      contrasena: await bcrypt.hash(contrasenaUsada, RONDAS_BCRYPT),
      id_rol: ROL_ALUMNO_ID,
    });

    await Alumno.update(
      { id_usuario: nuevaCuenta.id_usuario },
      { where: { id_alumno: idAlumno } },
    );

    let credencialesEnviadas;
    let aviso;
    if (enviarCredenciales) {
      const enviado = await enviarCredencialesAcceso(
        `${alumno.nombre} ${alumno.apellido}`.trim(),
        nuevaCuenta.email,
        contrasenaUsada,
      );
      credencialesEnviadas = Boolean(enviado);
      if (!enviado) {
        aviso =
          "La cuenta quedó creada, pero no se pudo enviar el email de credenciales. Podés reintentarlo desde la edición de la ficha.";
      }
    }

    return {
      ok: true,
      creada: true,
      cambios: true,
      message: "Cuenta de acceso creada y vinculada",
      usuario: { id_usuario: nuevaCuenta.id_usuario, email: nuevaCuenta.email },
      ...(enviarCredenciales
        ? { credencialesEnviadas, ...(aviso ? { aviso } : {}) }
        : {}),
    };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;

    if (error.name === "SequelizeUniqueConstraintError") {
      throw new ErrorHandler(
        400,
        "El correo electrónico ya está en uso por otro usuario",
      );
    }
    if (error.name === "SequelizeValidationError") {
      throw new ErrorHandler(
        400,
        "Datos de la cuenta inválidos. Verificá el email y la contraseña.",
      );
    }

    console.error("\x1b[1m\x1b[31m[ERROR]\x1b[0m Error en gestionarCuentaAlumno:", error);
    throw new ErrorHandler(500, "Error interno al gestionar la cuenta del alumno");
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
    email,
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
        email: normalizarEmail(email),
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
  obtenerParticipantesParaAlumno,
  obtenerAlumno,
  crearAlumno,
  crearAlumnosEnLote,
  validarLoteAlumnos,
  sincronizarUsuarioAlumno,
  gestionarCuentaAlumno,
  eliminarAlumno,
  modificarAlumno,
  darDeBajaAlumno,
};
