import ErrorHandler from "../../utils/ErrorHandler.js";
import Comunicado from "../../db/models/comunicados-model.js";
import ComunicadoLectura from "../../db/models/comunicado-lectura-model.js";
import { Alumno, Curso, Personal } from "../../db/models/index.js";
import Usuario from "../../db/models/user-model.js";
import { crearNotificacionMasiva } from "./notificaciones-controller.js";
import { emitir } from "../../utils/eventos.js";

import { Op } from "sequelize";

// El comunicado guarda sólo `autor_id`; sin este include el frontend no tiene
// forma de mostrar quién publicó (y antes caía en textos hardcodeados).
const CON_AUTOR = {
  model: Usuario,
  as: "autor",
  attributes: ["id_usuario", "nombre", "apellido", "id_rol"],
};

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

      const condiciones = [
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
      ];

      if (filtros.autor_id) {
        condiciones.push({ autor_id: filtros.autor_id });
      }

      whereClause = {
        [Op.or]: condiciones,
      };
    } else if (rol === "preceptor") {
      // El preceptor gestiona alumnos y cursos: ve los generales, los de
      // alumnos y los dirigidos a sus cursos (por nombre en `curso_destino`),
      // además de los que publicó él mismo.
      const cursosPreceptor = filtros.cursos
        ? filtros.cursos.split(",").map((c) => c.trim()).filter(Boolean)
        : [];

      const condiciones = [
        { destino: "todos" },
        { destino: "alumnos" },
        ...(cursosPreceptor.length > 0
          ? [
              {
                destino: "curso",
                curso_destino: {
                  [Op.in]: cursosPreceptor,
                },
              },
            ]
          : [{ destino: "curso" }]),
      ];

      if (filtros.autor_id) {
        condiciones.push({ autor_id: filtros.autor_id });
      }

      whereClause = {
        [Op.or]: condiciones,
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
      include: [CON_AUTOR],
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

    const comunicado = await Comunicado.findByPk(id, { include: [CON_AUTOR] });

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

// Fan-out de comunicados (E-notificaciones): roles que reciben la
// notificación de panel por cada destino, espejando los perfiles de lectura
// de comunicados (DESTINOS_POR_ROL en comunidad-router.js). Root queda
// excluido siempre por ser cuenta de sistema.
const ROLES_POR_DESTINO = {
  todos: [1, 2, 3, 4, 5, 6, 7],
  alumnos: [1, 2, 6],
  profesores: [3],
  autoridades: [4, 5, 7],
};

/**
 * Cuentas destinatarias del comunicado (el mismo padrón que usa el fan-out de
 * notificaciones). Devuelve además `sinCuenta`: legajos del público que no
 * tienen cuenta y por lo tanto no pueden entrar a confirmar lectura
 * ('curso' → alumnos de ese curso; 'alumnos' → legajos del sistema).
 */
export async function obtenerDestinatarios(comunicado) {
  if (comunicado.destino === "curso") {
    const cursos = await Curso.findAll({
      where: { nombre_curso: comunicado.curso_destino },
      attributes: ["id_curso", "id_preceptor"],
      raw: true,
    });
    const idsCursos = cursos.map((c) => Number(c.id_curso)).filter(Boolean);
    if (idsCursos.length === 0) {
      return { idsUsuarios: [], sinCuenta: 0 };
    }

    const idsUsuarios = new Set();
    let sinCuenta = 0;

    const alumnos = await Alumno.findAll({
      where: { id_curso: { [Op.in]: idsCursos } },
      attributes: ["id_usuario"],
      raw: true,
    });
    for (const alumno of alumnos) {
      if (alumno.id_usuario) {
        idsUsuarios.add(Number(alumno.id_usuario));
      } else {
        sinCuenta += 1;
      }
    }

    // El curso asigna al preceptor por id_personal; las notificaciones y
    // confirmaciones se dirigen a su cuenta de usuario, si ya existe.
    const idsPreceptores = [...new Set(
      cursos.map((curso) => Number(curso.id_preceptor)).filter(Boolean),
    )];
    if (idsPreceptores.length > 0) {
      const preceptores = await Personal.findAll({
        where: { id_personal: { [Op.in]: idsPreceptores } },
        attributes: ["id_usuario"],
        raw: true,
      });
      for (const preceptor of preceptores) {
        if (preceptor.id_usuario) idsUsuarios.add(Number(preceptor.id_usuario));
      }
    }

    return { idsUsuarios: [...idsUsuarios], sinCuenta };
  }

  const rolesDestino = ROLES_POR_DESTINO[comunicado.destino];
  if (!rolesDestino || rolesDestino.length === 0) {
    return { idsUsuarios: [], sinCuenta: 0 };
  }

  // Para destino 'alumnos' se informa además cuántos legajos del sistema
  // siguen sin cuenta (el fan-out llega solo a las cuentas existentes).
  const sinCuenta =
    comunicado.destino === "alumnos"
      ? await Alumno.count({ where: { id_usuario: null } })
      : 0;

  const usuarios = await Usuario.findAll({
    where: { id_rol: { [Op.in]: rolesDestino } },
    attributes: ["id_usuario"],
    raw: true,
  });
  return {
    idsUsuarios: [...new Set(usuarios.map((u) => Number(u.id_usuario)).filter(Boolean))],
    sinCuenta,
  };
}

/**
 * Notifica por panel el comunicado recién creado a sus destinatarios.
 * La notificación jamás debe romper la publicación: todo error queda logueado
 * y la creación sigue su curso.
 */
async function notificarComunicado(comunicado) {
  try {
    const { idsUsuarios } = await obtenerDestinatarios(comunicado);

    return await crearNotificacionMasiva(idsUsuarios, {
      tipo: "comunicado",
      id_comunicado: comunicado.id_comunicado,
      titulo: comunicado.titulo,
      cuerpo: comunicado.mensaje ? String(comunicado.mensaje).slice(0, 300) : null,
    });
  } catch (error) {
    console.error(
      "\x1b[1m\x1b[31m[ERROR]\x1b[0m Error notificando el comunicado (no bloquea la creación):",
      error.message,
    );
    return { creadas: 0 };
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

    // Aviso por panel a los destinatarios (cuenta primero, si falla no rompe).
    await notificarComunicado(comunicado);

    return comunicado;
  } catch (error) {
    if (error instanceof ErrorHandler) {
      throw error;
    }
    console.error("Error en crearComunicado:", error);
    throw new ErrorHandler(500, "Error interno al crear comunicado");
  }
}

export async function eliminarComunicado(id, contexto = null) {
  try {
    const idComunicado = Number(id);
    if (!idComunicado || idComunicado < 0) {
      throw new ErrorHandler(400, "ID de comunicado inválido");
    }

    if (Number(contexto?.idRol) === 4) {
      const comunicado = await Comunicado.findByPk(idComunicado);
      if (!comunicado) throw new ErrorHandler(404, "Comunicado no encontrado");
      const esAutor = Number(comunicado.autor_id) === Number(contexto.idUsuario);

      if (!esAutor) {
        if (comunicado.destino !== "curso" || !comunicado.curso_destino) {
          throw new ErrorHandler(403, "El preceptor sólo puede eliminar sus comunicados o los de sus cursos");
        }

        const personal = await Personal.findOne({
          where: { id_usuario: Number(contexto.idUsuario) },
          attributes: ["id_personal"],
          raw: true,
        });
        if (!personal) throw new ErrorHandler(403, "No hay un legajo de preceptor asociado a esta cuenta");

        const cursoAsignado = await Curso.findOne({
          where: {
            id_preceptor: personal.id_personal,
            nombre_curso: comunicado.curso_destino,
          },
          attributes: ["id_curso"],
          raw: true,
        });
        if (!cursoAsignado) throw new ErrorHandler(403, "El comunicado no pertenece a un curso a tu cargo");
      }
    }

    const filasEliminadas = await Comunicado.destroy({
      where: { id_comunicado: idComunicado },
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

// ── Confirmaciones de lectura (E-confirmaciones) ───────────────────────────
// Destinatarios que leyeron el comunicado, observables por preceptores y
// administradores desde las vistas de gestión.

// Confirmaciones visibles para administradores (7) y root (8). El preceptor
// (4) ve las de los comunicados que muestra su panel: los publicados por él,
// los de destino todos/alumnos y los dirigidos a sus cursos.
const ROLES_QUE_VEN_CONFIRMACIONES = [7, 8];

const esRolGestion = (idRol) => ROLES_QUE_VEN_CONFIRMACIONES.includes(Number(idRol));

// Núcleo síncrono de la regla. `cursosPreceptor` es el padrón de nombres de
// cursos a cargo (null para roles que no lo necesitan).
const esVisibleParaListado = (idRol, idUsuario, comunicado, cursosPreceptor) => {
  if (esRolGestion(idRol)) return true;
  if (Number(idRol) !== 4) return false;
  if (Number(comunicado.autor_id) === Number(idUsuario)) return true;
  if (comunicado.destino === "todos" || comunicado.destino === "alumnos") return true;
  if (comunicado.destino === "curso") {
    return (cursosPreceptor || []).includes(comunicado.curso_destino);
  }
  return false;
};

async function cursosDePreceptor(idUsuario) {
  const personal = await Personal.findOne({
    where: { id_usuario: idUsuario },
    attributes: ["id_personal"],
    raw: true,
  });
  if (!personal) return [];

  const filas = await Curso.findAll({
    where: { id_preceptor: personal.id_personal },
    attributes: ["nombre_curso"],
    raw: true,
  });
  return filas.map((c) => c.nombre_curso);
}

async function esConfirmacionVisible(idRol, idUsuario, comunicado) {
  if (Number(idRol) === 4 && comunicado.destino === "curso") {
    return esVisibleParaListado(idRol, idUsuario, comunicado, await cursosDePreceptor(idUsuario));
  }
  return esVisibleParaListado(idRol, idUsuario, comunicado, null);
}

/**
 * Registra la lectura de un comunicado para el usuario autenticado. Solo se
 * acepta si es destinatario REAL del comunicado (mismo padrón del fan-out) y
 * es idempotente: repetir la marca no crea filas nuevas.
 */
export async function marcarComunicadoLeido(idComunicado, idUsuario) {
  try {
    const idC = Number(idComunicado);
    const idU = Number(idUsuario);
    if (!idU) throw new ErrorHandler(400, "No se identificó al usuario");

    const comunicado = await Comunicado.findByPk(idC);
    if (!comunicado) throw new ErrorHandler(404, "No se encontró el comunicado");

    const { idsUsuarios } = await obtenerDestinatarios(comunicado);
    if (!idsUsuarios.includes(idU)) {
      throw new ErrorHandler(403, "No sos destinatario de este comunicado");
    }

    const [, creada] = await ComunicadoLectura.findOrCreate({
      where: { id_comunicado: idC, id_usuario: idU },
      defaults: { leida_en: new Date() },
    });

    if (creada) {
      // Administración mantiene abierto el padrón de lecturas y necesita
      // actualizarlo cuando otro destinatario confirma.
      emitir("confirmacion_lectura", { id_comunicado: idC });
    }

    return { ok: true, mensaje: "Lectura registrada" };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en marcarComunicadoLeido:", error);
    throw new ErrorHandler(500, "Error interno al registrar la lectura");
  }
}

/**
 * Confirmaciones de lectura de un comunicado: padrón de destinatarios con
 * cuenta (leídos con fecha / pendientes), resumen X/Y y aviso de cuántos
 * legajos del público quedan sin cuenta.
 */
export async function obtenerConfirmacionesLectura(idComunicado, idUsuario, idRol) {
  try {
    const comunicado = await Comunicado.findByPk(Number(idComunicado));
    if (!comunicado) throw new ErrorHandler(404, "No se encontró el comunicado");

    const autorizado = await esConfirmacionVisible(idRol, idUsuario, comunicado);
    if (!autorizado) {
      throw new ErrorHandler(403, "No podés ver las confirmaciones de lectura de este comunicado");
    }

    const { idsUsuarios, sinCuenta } = await obtenerDestinatarios(comunicado);

    const usuarios = idsUsuarios.length
      ? await Usuario.findAll({
          where: { id_usuario: { [Op.in]: idsUsuarios } },
          attributes: ["id_usuario", "nombre", "apellido", "id_rol"],
          order: [["apellido", "ASC"]],
          raw: true,
        })
      : [];

    const lecturas = idsUsuarios.length
      ? await ComunicadoLectura.findAll({
          where: {
            id_comunicado: comunicado.id_comunicado,
            id_usuario: { [Op.in]: idsUsuarios },
          },
          attributes: ["id_usuario", "leida_en"],
          raw: true,
        })
      : [];
    const leidaPor = new Map(lecturas.map((l) => [Number(l.id_usuario), l.leida_en]));

    const destinatarios = usuarios.map((u) => {
      const leidaEn = leidaPor.get(Number(u.id_usuario)) || null;
      return {
        id_usuario: Number(u.id_usuario),
        nombre: u.nombre,
        apellido: u.apellido,
        id_rol: Number(u.id_rol),
        leida: Boolean(leidaEn),
        leida_en: leidaEn,
      };
    });

    const total = destinatarios.length;
    const leidos = destinatarios.filter((d) => d.leida).length;

    return {
      id_comunicado: comunicado.id_comunicado,
      titulo: comunicado.titulo,
      destino: comunicado.destino,
      curso_destino: comunicado.curso_destino || null,
      total,
      leidos,
      pendientes: total - leidos,
      sinCuenta,
      destinatarios,
    };
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en obtenerConfirmacionesLectura:", error);
    throw new ErrorHandler(500, "Error interno al obtener las confirmaciones");
  }
}

/**
 * Resumen X/Y de lecturas para los badges de las listas de gestión (una tanda
 * por vez). El padrón se precarga completo (3 consultas) y se resuelve en
 * memoria; los llamados no autorizados devuelven `visible: false`.
 */
export async function resumenLecturasComunicados(idsComunicados, idUsuario, idRol) {
  try {
    const ids = [...new Set((idsComunicados || []).map(Number).filter(Boolean))].slice(0, 100);
    if (ids.length === 0) return [];

    const comunicados = await Comunicado.findAll({
      where: { id_comunicado: { [Op.in]: ids } },
      attributes: ["id_comunicado", "destino", "curso_destino", "autor_id"],
      raw: true,
    });

    const lecturas = await ComunicadoLectura.findAll({
      where: { id_comunicado: { [Op.in]: ids } },
      attributes: ["id_comunicado", "id_usuario"],
      raw: true,
    });
    const leidosPorComunicado = new Map();
    for (const lectura of lecturas) {
      const clave = Number(lectura.id_comunicado);
      if (!leidosPorComunicado.has(clave)) {
        leidosPorComunicado.set(clave, new Set());
      }
      leidosPorComunicado.get(clave).add(Number(lectura.id_usuario));
    }

    // Padrón precargado: usuarios por rol, alumnos y cuentas de preceptores.
    const [usuariosTodas, alumnosTodas, cursosTodas, personalTodo] = await Promise.all([
      Usuario.findAll({ attributes: ["id_usuario", "id_rol"], raw: true }),
      Alumno.findAll({ attributes: ["id_usuario", "id_curso"], raw: true }),
      Curso.findAll({ attributes: ["id_curso", "nombre_curso", "id_preceptor"], raw: true }),
      Personal.findAll({ attributes: ["id_personal", "id_usuario"], raw: true }),
    ]);
    const cuentasPorRol = new Map();
    for (const u of usuariosTodas) {
      const rol = Number(u.id_rol);
      if (!cuentasPorRol.has(rol)) cuentasPorRol.set(rol, new Set());
      cuentasPorRol.get(rol).add(Number(u.id_usuario));
    }
    const cuentasPorCurso = new Map();
    for (const a of alumnosTodas) {
      if (!a.id_usuario) continue;
      const curso = Number(a.id_curso);
      if (!cuentasPorCurso.has(curso)) cuentasPorCurso.set(curso, new Set());
      cuentasPorCurso.get(curso).add(Number(a.id_usuario));
    }
    const idsCursosPorNombre = new Map();
    const cursoPorId = new Map();
    for (const curso of cursosTodas) {
      cursoPorId.set(Number(curso.id_curso), curso);
      if (!idsCursosPorNombre.has(curso.nombre_curso)) {
        idsCursosPorNombre.set(curso.nombre_curso, new Set());
      }
      idsCursosPorNombre.get(curso.nombre_curso).add(Number(curso.id_curso));
    }
    const usuarioPorIdPersonal = new Map(
      personalTodo
        .filter((personal) => personal.id_usuario)
        .map((personal) => [Number(personal.id_personal), Number(personal.id_usuario)]),
    );

    let cursosPreceptor = null;
    if (Number(idRol) === 4) cursosPreceptor = await cursosDePreceptor(idUsuario);

    const salida = [];
    for (const comunicado of comunicados) {
      const visible = esVisibleParaListado(idRol, idUsuario, comunicado, cursosPreceptor);
      let padron = new Set();

      if (visible) {
        if (comunicado.destino === "curso") {
          const idsCursos = idsCursosPorNombre.get(comunicado.curso_destino) || new Set();
          for (const idCurso of idsCursos) {
            for (const id of cuentasPorCurso.get(idCurso) || []) padron.add(id);
            const idPreceptor = cursoPorId.get(idCurso)?.id_preceptor;
            const idUsuarioPreceptor = usuarioPorIdPersonal.get(Number(idPreceptor));
            if (idUsuarioPreceptor) padron.add(idUsuarioPreceptor);
          }
        } else {
          for (const rol of ROLES_POR_DESTINO[comunicado.destino] || []) {
            for (const id of cuentasPorRol.get(Number(rol)) || []) {
              padron.add(id);
            }
          }
        }
      }

      const leidosSet =
        leidosPorComunicado.get(Number(comunicado.id_comunicado)) || new Set();
      const leidos = [...padron].filter((id) => leidosSet.has(id)).length;

      salida.push({
        id_comunicado: Number(comunicado.id_comunicado),
        visible,
        total: padron.size,
        leidos,
        pendientes: padron.size - leidos,
      });
    }

    return salida;
  } catch (error) {
    if (error instanceof ErrorHandler) throw error;
    console.error("Error en resumenLecturasComunicados:", error);
    throw new ErrorHandler(500, "Error interno al obtener el resumen de lecturas");
  }
}
