import ErrorHandler from "../utils/ErrorHandler.js";
import { Personal, Curso, Alumno } from "../db/models/index.js";

const validarCursoPreceptor = async (req, res, next) => {
  const rol = req.headers["id_rol"];
  const usuario = req.headers["id_usuario"];

  if (parseInt(rol) !== 4) {
    return next();
  }

  try {
    if (!usuario) {
      return next(new ErrorHandler(401, "Usuario no especificado en la petición"));
    }

    const personal = await Personal.findOne({
      where: { id_usuario: usuario },
    });

    if (!personal) {
      return next(
        new ErrorHandler(
          403,
          "Acceso denegado: No se encontró registro de personal para este usuario",
        ),
      );
    }

    const cursosAsignados = await Curso.findAll({
      where: { id_preceptor: personal.id_personal },
      attributes: ["id_curso"],
    });

    const idsCursosAsignados = cursosAsignados.map((c) => c.id_curso);

    let idCursoObjetivo = null;

    if (req.method === "POST") {
      const listaAlumnos = Array.isArray(req.body)
        ? req.body
        : Array.isArray(req.body?.alumnos)
        ? req.body.alumnos
        : null;

      if (listaAlumnos) {
        const cursosEnLote = listaAlumnos
          .map((a) => a.id_curso)
          .filter((c) => c !== undefined && c !== null)
          .map((c) => parseInt(c));

        for (const cursoId of cursosEnLote) {
          if (!idsCursosAsignados.includes(cursoId)) {
            return next(
              new ErrorHandler(
                403,
                `Acceso denegado: No tenés permiso sobre el curso ID ${cursoId} en el lote`,
              ),
            );
          }
        }
      } else if (req.body.id_curso) {
        idCursoObjetivo = parseInt(req.body.id_curso);
      }
    } else if (req.method === "PATCH") {
      const idAlumno = req.body.id_alumno || req.body.id;
      if (!idAlumno) {
        return next(new ErrorHandler(400, "ID de alumno no especificado para modificar"));
      }

      const alumno = await Alumno.findByPk(idAlumno);
      if (!alumno) {
        return next(new ErrorHandler(404, "Alumno no encontrado"));
      }

      if (req.body.id_curso) {
        const nuevoCurso = parseInt(req.body.id_curso);
        if (!idsCursosAsignados.includes(nuevoCurso)) {
          return next(
            new ErrorHandler(
              403,
              "Acceso denegado: No podés asignar un alumno a un curso que no gestionás",
            ),
          );
        }
      }

      idCursoObjetivo = alumno.id_curso;
    } else if (req.method === "DELETE" && req.params.id) {
      const alumno = await Alumno.findByPk(req.params.id);
      if (!alumno) {
        return next(new ErrorHandler(404, "Alumno no encontrado"));
      }
      idCursoObjetivo = alumno.id_curso;
    } else if (req.method === "GET") {
      if (req.path.startsWith("/alumnos/curso/")) {
        idCursoObjetivo = parseInt(req.params.id);
      } else if (req.path.startsWith("/alumnos/") && !req.path.includes("/mi-info") && !req.path.includes("/mi-curso")) {
        const alumno = await Alumno.findByPk(req.params.id);
        if (!alumno) {
          return next(new ErrorHandler(404, "Alumno no encontrado"));
        }
        idCursoObjetivo = alumno.id_curso;
      }
    }

    if (idCursoObjetivo !== null) {
      if (!idsCursosAsignados.includes(idCursoObjetivo)) {
        return next(
          new ErrorHandler(
            403,
            "Acceso denegado: No tenés permiso sobre el curso de este alumno",
          ),
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default validarCursoPreceptor;
