import axios from "axios";
import { useAuthStore } from "../stores/auth.js";

// ==========================================
//      CONFIGURACIÓN Y HELPERS
// ==========================================

const BASE_URL = "/api";
const API_URL = `${BASE_URL}/academico`;

/**
 * Genera dinámicamente los headers con el token actualizado de Pinia
 */
const getConfig = () => {
  const authStore = useAuthStore();
  return {
    headers: {
      Authorization: `Bearer ${authStore.token}`,
      "Content-Type": "application/json",
    },
  };
};

/**
 * Estandariza la respuesta de errores para todo el servicio
 */
const manejarErrorApi = (error, mensajePorDefecto) => {
  console.error(`[API Error] ${mensajePorDefecto}:`, error);

  if (error.response) {
    return {
      success: false,
      status: error.response.status,
      message: error.response.data?.message || error.response.data?.error || mensajePorDefecto,
    };
  }

  return {
    success: false,
    message: "No se pudo conectar con el servidor. Revisá tu conexión.",
  };
};

// ==========================================
//                 CURSOS
// ==========================================

export const obtenerCursos = async () => {
  try {
    const response = await axios.get(`${API_URL}/cursos`, getConfig());
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los cursos");
  }
};

export const crearCurso = async (cursoData) => {
  try {
    const payload = {
      nombre_curso: cursoData.nombre_curso,
      nivel: cursoData.nivel,
      ciclo_lectivo: cursoData.ciclo_lectivo,
      anio: cursoData.anio ?? null,
      capacidad_maxima: cursoData.capacidad_maxima,
      aula: cursoData.aula,
      turno: cursoData.turno,
      id_profesor_titular: cursoData.id_profesor_titular,
      id_preceptor: cursoData.id_preceptor ?? null,
      estado: cursoData.estado,
    };
    const response = await axios.post(`${API_URL}/cursos`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al crear el curso");
  }
};

export const modificarCurso = async (cursoData) => {
  try {
    const payload = {
      id_curso: cursoData.id_curso,
      nombre_curso: cursoData.nombre_curso,
      nivel: cursoData.nivel,
      ciclo_lectivo: cursoData.ciclo_lectivo,
      anio: cursoData.anio ?? null,
      capacidad_maxima: cursoData.capacidad_maxima,
      aula: cursoData.aula,
      turno: cursoData.turno,
      id_profesor_titular: cursoData.id_profesor_titular,
      id_preceptor: cursoData.id_preceptor ?? null,
      estado: cursoData.estado,
    };
    const response = await axios.patch(`${API_URL}/cursos`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al modificar el curso");
  }
};

export const eliminarCurso = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/cursos/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se puede eliminar el curso. Verificá que no tenga alumnos asignados e intentá de nuevo.");
  }
};

export const cancelarCurso = async (id) => {
  try {
    const response = await axios.patch(`${API_URL}/cursos/cancelar/${id}`, {}, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo cancelar el curso.");
  }
};

// ==========================================
//               PROFESORES
// ==========================================

export const obtenerProfesores = async () => {
  try {
    const response = await axios.get(`${API_URL}/profesores`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los profesores");
  }
};

export const obtenerProfesor = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/profesores/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se encontró el profesor");
  }
};

export const obtenerAsignacionesProfesor = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/asignaciones/profesor/${id}`, getConfig());
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return manejarErrorApi(error, "No se encontraron asignaciones para este profesor");
  }
};

export const crearProfesor = async (profesorData) => {
  try {
    const payload = {
      nombre: profesorData.nombre,
      apellido: profesorData.apellido,
      dni: profesorData.dni,
      email: profesorData.email,
      telefono: profesorData.telefono,
      fecha_nacimiento: profesorData.fecha_nacimiento,
      domicilio: profesorData.domicilio,
      fecha_contratacion: profesorData.fecha_contratacion,
      estado: profesorData.estado,
      titulo_habilitante: profesorData.titulo_habilitante,
      especialidad: profesorData.especialidad,
    };
    const response = await axios.post(`${API_URL}/profesores`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al crear el profesor");
  }
};

export const modificarProfesor = async (profesorData) => {
  try {
    const payload = {
      id_profesor: profesorData.id_profesor,
      nombre: profesorData.nombre,
      apellido: profesorData.apellido,
      dni: profesorData.dni,
      email: profesorData.email,
      telefono: profesorData.telefono,
      fecha_nacimiento: profesorData.fecha_nacimiento,
      domicilio: profesorData.domicilio,
      fecha_contratacion: profesorData.fecha_contratacion,
      estado: profesorData.estado,
      titulo_habilitante: profesorData.titulo_habilitante,
      especialidad: profesorData.especialidad,
    };
    const response = await axios.patch(`${API_URL}/profesores`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al modificar el profesor");
  }
};

export const eliminarProfesor = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/profesores/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se puede eliminar el Profesor. Verificá que no tenga cursos asignados e intentá de nuevo.");
  }
};

export const darDeBajaProfesor = async (id) => {
  try {
    const response = await axios.patch(`${API_URL}/profesores/dar-de-baja/${id}`, {}, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo dar de baja al profesor.");
  }
};

// ==========================================
//                 CONVIVENCIA (E4)
// ==========================================

export const obtenerSanciones = async (idAlumno = null) => {
  try {
    const response = await axios.get(`${API_URL}/sanciones`, {
      ...getConfig(),
      ...(idAlumno ? { params: { id_alumno: idAlumno } } : {}),
    });
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener las sanciones");
  }
};

export const crearSancion = async (datos) => {
  try {
    const response = await axios.post(`${API_URL}/sanciones`, datos, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo registrar la sanción");
  }
};

export const eliminarSancion = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/sanciones/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo eliminar la sanción");
  }
};

export const obtenerObservaciones = async (idAlumno = null) => {
  try {
    const response = await axios.get(`${API_URL}/observaciones`, {
      ...getConfig(),
      ...(idAlumno ? { params: { id_alumno: idAlumno } } : {}),
    });
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener las observaciones");
  }
};

export const crearObservacion = async (datos) => {
  try {
    const response = await axios.post(`${API_URL}/observaciones`, datos, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo registrar la observación");
  }
};

// ==========================================
//                 HORARIOS (E3)
// ==========================================

export const obtenerHorarios = async (idCurso = null) => {
  try {
    const response = await axios.get(`${API_URL}/horarios`, {
      ...getConfig(),
      ...(idCurso ? { params: { id_curso: idCurso } } : {}),
    });
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los horarios");
  }
};

export const crearHorario = async (datos) => {
  try {
    const response = await axios.post(`${API_URL}/horarios`, datos, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo crear el horario");
  }
};

export const eliminarHorario = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/horarios/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo eliminar el horario");
  }
};

// ==========================================
//                 ALUMNOS
// ==========================================

export const obtenerMiCurso = async (idCurso) => {
  try {
    const response = await axios.get(`${API_URL}/alumnos/mi-curso/${idCurso}`, getConfig());
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los alumnos");
  }
};

export const obtenerAlumnos = async (params = undefined) => {
  try {
    // Con params (page/limit/...) el backend responde el contrato
    // { data, total, page, limit }; sin params, el array completo.
    const response = await axios.get(`${API_URL}/alumnos`, {
      ...getConfig(),
      ...(params ? { params } : {}),
    });
    const cuerpo = response.data;
    if (cuerpo && Array.isArray(cuerpo.data)) {
      return {
        success: true,
        data: cuerpo.data,
        total: cuerpo.total ?? cuerpo.data.length,
        page: cuerpo.page ?? 1,
        limit: cuerpo.limit ?? cuerpo.data.length,
      };
    }
    return {
      success: true,
      data: cuerpo,
    };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los alumnos");
  }
};

export const obtenerAlumnosCurso = async (idOCurso, fecha) => {
  // Esta función acepta:
  // - un id primitivo (number|string)
  // - un objeto que contenga el id bajo claves comunes (id_curso, idCurso, id)
  // - opcionalmente un `fecha` que se añadirá como query param
  const extraerIdCurso = (param) => {
    if (param === null || param === undefined) {
      return null;
    }

    if (typeof param === "number" || typeof param === "string") {
      return String(param);
    }

    if (typeof param === "object") {
      // Formas comunes que queremos soportar
      const candidatos = [
        param.id_curso,
        param.idCurso,
        param.id,
        param.cursoId,
        // formas anidadas
        param.curso?.id_curso,
        param.curso?.id,
      ];
      for (const c of candidatos) {
        if (c !== undefined && c !== null && c !== "") return String(c);
      }
    }
    return null;
  };

  try {
    const idCurso = extraerIdCurso(idOCurso);
    if (!idCurso) {

      return manejarErrorApi({ message: "Id de curso inválido" }, "Id de curso inválido");
    }

    let url = `${API_URL}/alumnos/curso/${encodeURIComponent(idCurso)}`;
    if (fecha) url += `?fecha=${encodeURIComponent(fecha)}`;

    const response = await axios.get(url, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    // Un curso sin alumnos responde 404: es una lista vacía válida, no un
    // error (evita ruido en consola en vistas que consultan varios cursos).
    if (error?.response?.status === 404) {
      return { success: true, data: [] };
    }
    return manejarErrorApi(error, "No se encontraron alumnos para este curso");
  }
};

export const crearAlumno = async (alumnoData) => {
  try {
    const payload = {
      nombre: alumnoData.nombre,
      apellido: alumnoData.apellido,
      dni: alumnoData.dni,
      fecha_nacimiento: alumnoData.fecha_nacimiento,
      email: alumnoData.email,
      nombre_tutor: alumnoData.nombre_tutor,
      telefono_tutor: alumnoData.telefono_tutor,
      domicilio: alumnoData.domicilio,
      id_curso: alumnoData.id_curso,
    };
    const response = await axios.post(`${API_URL}/alumnos`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al crear el alumno");
  }
};

export const crearAlumnosEnLote = async (alumnosData) => {
  try {
    const payload = Array.isArray(alumnosData) ? { alumnos: alumnosData } : alumnosData;
    const response = await axios.post(`${API_URL}/alumnos/lote`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al registrar alumnos en lote");
  }
};

export const modificarAlumno = async (alumnoData) => {
  try {
    const payload = {
      id_alumno: alumnoData.id_alumno,
      nombre: alumnoData.nombre,
      apellido: alumnoData.apellido,
dni: alumnoData.dni,
      fecha_nacimiento: alumnoData.fecha_nacimiento,
      email: alumnoData.email,
      nombre_tutor: alumnoData.nombre_tutor,
      telefono_tutor: alumnoData.telefono_tutor,
      id_curso: alumnoData.id_curso,
    }; 
    const response = await axios.patch(`${API_URL}/alumnos`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al modificar el alumno");
  }
};

export const eliminarAlumno = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/alumnos/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se puede eliminar el alumno. Intentá de nuevo.");
  }
};

export const darDeBajaAlumno = async (id) => {
  try {
    const response = await axios.patch(`${API_URL}/alumnos/dar-de-baja/${id}`, {}, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo dar de baja al alumno.");
  }
};

export const enviarEmailAlumno = async (idAlumno, emailData) => {
  try {
    const payload = {
      asunto: emailData.asunto,
      mensaje: emailData.mensaje,
    };

    const response = await axios.post(
      `${API_URL}/alumnos/enviar-email/${idAlumno}`,
      payload,
      getConfig()
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo enviar el email al alumno.");
  }
};

// ==========================================
//               ASISTENCIAS
// ==========================================

export async function guardarAsistenciasLote(payload) {
  try {
    const response = await axios.post(`${API_URL}/asistencias/lote`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al guardar el lote de asistencias");
  }
}

/**
 * Obtiene el historial de asistencias de un curso en un rango de fechas.
 * @param {Object} params - { id_curso, fecha_desde, fecha_hasta }
 */
export async function obtenerHistorialAsistencias({ id_curso, fecha_desde, fecha_hasta } = {}) {
  try {
    const params = new URLSearchParams();
    if (id_curso) params.append("id_curso", id_curso);
    if (fecha_desde) params.append("fecha_desde", fecha_desde);
    if (fecha_hasta) params.append("fecha_hasta", fecha_hasta);

    const url = `${API_URL}/asistencias/historial?${params.toString()}`;
    const response = await axios.get(url, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo obtener el historial de asistencias");
  }
}

// ==========================================
//        ASIGNACIONES DE MATERIAS
// ==========================================

export const obtenerAsignaciones = async () => {
  try {
    const response = await axios.get(`${API_URL}/asignaciones`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener las asignaciones");
  }
};

export const crearAsignacion = async (asignacionData) => {
  try {
    const payload = {
      id_curso: asignacionData.id_curso,
      id_materia: asignacionData.id_materia,
      id_profesor: asignacionData.id_profesor,
};
    const response = await axios.post(`${API_URL}/asignaciones`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al crear la asignación");
  }
};

export const modificarAsignacion = async (asignacionData) => {
  try {
    const payload = {
      id_asignacion: asignacionData.id_asignacion,
      id_curso: asignacionData.id_curso,
      id_materia: asignacionData.id_materia,
      id_profesor: asignacionData.id_profesor,
    };
    const response = await axios.patch(`${API_URL}/asignaciones`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al modificar la asignación");
  }
};

export const eliminarAsignacion = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/asignaciones/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se puede eliminar la asignación.");
  }
};

// ==========================================
//                 MATERIAS
// ==========================================

export const obtenerMaterias = async () => {
  try {
    const response = await axios.get(`${API_URL}/materias`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener las materias");
  }
};

export const crearMateria = async (materiaData) => {
  try {
    const payload = {
      nombre_materia: materiaData.nombre_materia,
      carga_horaria: materiaData.carga_horaria,
      descripcion: materiaData.descripcion_materia,
    };
    const response = await axios.post(`${API_URL}/materias`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al crear la materia");
  }
};

export const modificarMateria = async (materiaData) => {
  try {
    const payload = {
      id_materia: materiaData.id_materia,
      nombre_materia: materiaData.nombre_materia,
      carga_horaria: materiaData.carga_horaria,
      descripcion: materiaData.descripcion_materia,
    };
    const response = await axios.patch(`${API_URL}/materias`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al modificar la materia");
  }
};

export const eliminarMateria = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/materias/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se puede eliminar la materia.");
  }
};

// ==========================================
//             PLANES DE ESTUDIO
// ==========================================

export const obtenerPlanes = async () => {
  try {
    const response = await axios.get(`${API_URL}/planes`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los planes de estudio");
  }
};

export const obtenerPlan = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/planes/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo obtener el plan de estudio");
  }
};

export const obtenerPlanesVigentes = async ({ anio = null, curso = null } = {}) => {
  try {
    const params = new URLSearchParams();
    if (anio) params.append("anio", anio);
    if (curso) params.append("curso", curso);
    const qs = params.toString() ? `?${params.toString()}` : "";
    const response = await axios.get(`${API_URL}/planes/vigentes${qs}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los planes vigentes");
  }
};

export const crearPlan = async (planData) => {
  try {
    const response = await axios.post(`${API_URL}/planes`, planData, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al crear el plan de estudio");
  }
};

export const modificarPlan = async (planData) => {
  try {
    const response = await axios.patch(`${API_URL}/planes`, planData, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al modificar el plan de estudio");
  }
};

export const eliminarPlan = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/planes/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se puede eliminar el plan de estudio.");
  }
};

export const agregarMateriaAPlan = async (idPlan, vinculo) => {
  try {
    const response = await axios.post(`${API_URL}/planes/${idPlan}/materias`, vinculo, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al agregar la materia al plan");
  }
};

export const quitarMateriaDePlan = async (idPlanMateria) => {
  try {
    const response = await axios.delete(`${API_URL}/planes/materias/${idPlanMateria}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al quitar la materia del plan");
  }
};

export const agregarCorrelativa = async (idPlanMateria, idRequerida) => {
  try {
    const response = await axios.post(
      `${API_URL}/planes/materias/${idPlanMateria}/correlativas`,
      { id_plan_materia_req: idRequerida },
      getConfig(),
    );
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al agregar la correlativa");
  }
};

export const quitarCorrelativa = async (idPlanMateria, idRequerida) => {
  try {
    const response = await axios.delete(
      `${API_URL}/planes/materias/${idPlanMateria}/correlativas/${idRequerida}`,
      getConfig(),
    );
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al quitar la correlativa");
  }
};

// ==========================================
//                 PERSONAL
// ==========================================

export const obtenerTodoPersonal = async () => {
  try {
    const response = await axios.get(`${API_URL}/personal`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo obtener el personal");
  }
};

export const obtenerPersonal = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/personal/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se encontró el registro del personal");
  }
};

export const crearPersonal = async (personalData) => {
  try {
    const payload = {
      nombre: personalData.nombre,
      apellido: personalData.apellido,
      dni: personalData.dni,
      fecha_nacimiento: personalData.fecha_nacimiento,
      fecha_ingreso: personalData.fecha_ingreso,
      domicilio: personalData.domicilio,
      telefono: personalData.telefono,
      email: personalData.email,
      estado: personalData.estado,
      id_usuario: personalData.id_usuario,
      id_cargo: personalData.id_cargo,
    };
    const response = await axios.post(`${API_URL}/personal`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al registrar el personal");
  }
};

export const modificarPersonal = async (personalData) => {
  try {
    const payload = {
      id_personal: personalData.id_personal,
      nombre: personalData.nombre,
      apellido: personalData.apellido,
      dni: personalData.dni,
      fecha_nacimiento: personalData.fecha_nacimiento,
      fecha_ingreso: personalData.fecha_ingreso,
      domicilio: personalData.domicilio,
      telefono: personalData.telefono,
      email: personalData.email,
      estado: personalData.estado,
      id_usuario: personalData.id_usuario,
      id_cargo: personalData.id_cargo,
    };
    const response = await axios.patch(`${API_URL}/personal`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al modificar el personal");
  }
};

export const eliminarPersonal = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/personal/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se puede eliminar el personal.");
  }
};

export const darDeBajaPersonal = async (id) => {
  try {
    const response = await axios.patch(`${API_URL}/personal/dar-de-baja/${id}`, {}, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo dar de baja al personal.");
  }
};

// ==========================================
//               PERSONAL (sync user)
// ==========================================

export const sincronizarUsuarioPersonal = async (payload) => {
  try {
    const response = await axios.patch(`${API_URL}/personal/sincronizar-usuario-personal`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo sincronizar el usuario con el personal");
  }
};

export const sincronizarUsuarioAlumno = async (payload) => {
  try {
    const response = await axios.patch(`${API_URL}/alumnos/sincronizar-usuario-alumno`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo sincronizar el usuario con el alumno");
  }
};

export const sincronizarUsuarioProfesor = async (payload) => {
  try {
    const response = await axios.patch(`${API_URL}/profesores/sincronizar-usuario-profesor`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo sincronizar el usuario con el profesor");
  }
};

// ==========================================
//               CARGOS
// ==========================================

export const obtenerCargos = async () => {
  try {
    const response = await axios.get(`${API_URL}/cargos`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los cargos");
  }
};

export const obtenerCargo = async (id) => {
  try {
    // Q2: el backend expone /cargos/:id (plural); /cargo/ caía en el 404.
    const response = await axios.get(`${API_URL}/cargos/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se encontró el cargo");
  }
};

export const crearCargo = async (cargoData) => {
  try {
    const payload = {
      nombre_cargo: cargoData.nombre_cargo,
      descripcion: cargoData.descripcion,
    };
    const response = await axios.post(`${API_URL}/cargos`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al crear el cargo");
  }
};

export const modificarCargo = async (cargoData) => {
  try {
    const payload = {
      id_cargo: cargoData.id_cargo,
      nombre_cargo: cargoData.nombre_cargo,
      descripcion: cargoData.descripcion,
    };
    const response = await axios.patch(`${API_URL}/cargos`, payload, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al modificar el cargo");
  }
};

export const eliminarCargo = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/cargos/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se puede eliminar el cargo.");
  }
};

// ==========================================
//               ALUMNOS (VISTA ALUMNO)
// ==========================================

const obtenerIdCursoAlumno = async () => {
  // 1. Intentar desde localStorage (ya guardado en login)
  const alumnoRaw = localStorage.getItem("alumno");
  if (alumnoRaw) {
    const alumno = JSON.parse(alumnoRaw);
    const id = alumno.data?.id_curso || alumno.id_curso;
    if (id) return id;
  }

  // 2. Fallback: obtener desde la API usando el usuario autenticado
  try {
    const authStore = useAuthStore();
    const userId = authStore.usuario?.id ?? authStore.usuario?.id_usuario;
    if (userId) {
      const response = await axios.get(`${API_URL}/alumnos-mi-info/${userId}`, getConfig());
      const info = response.data;
      // Guardar para futuras consultas
      authStore.guardarInfo(info);
      return info.id_curso;
    }
  } catch (e) {
    console.warn("No se pudo obtener info del alumno desde API:", e);
  }

  return null;
};

export const obtenerMisMaterias = async () => {
  try {
    const idCurso = await obtenerIdCursoAlumno();
    if (!idCurso) {
      console.warn("No se pudo determinar el curso del alumno");
      return [];
    }

    const response = await axios.get(`${API_URL}/asignaciones/curso/${idCurso}`, getConfig());
    return response.data.map((asig) => ({
      id: asig.id_asignacion,
      materia: asig.materiaAsignacion?.nombre_materia || "Materia",
      horario: "08:00 - 09:30",
      dias: "Lun / Mié",
      profesor: asig.profesorAsignacion ? `Prof. ${asig.profesorAsignacion.apellido}, ${asig.profesorAsignacion.nombre}` : "Sin profesor",
    }));
  } catch (error) {
    console.error("Error al obtener mis materias:", error);
    return [];
  }
};

// Los comunicados se sirven desde comunidad-service.js
// (`obtenerTodosComunicados` / `obtenerComunicado`) porque el módulo vive en
// `comunidad`, no en `academico`. Ver utils/comunicados.js para los helpers de
// presentación que comparten las vistas de alumno y profesor.

// ==========================================
//           CALIFICACIONES / LIBRETA
// ==========================================

export const obtenerNotasProfesor = async () => {
  try {
    const response = await axios.get(`${API_URL}/notas/profesor`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener las calificaciones del docente");
  }
};

export const obtenerNotasPreceptorCurso = async (idCurso) => {
  try {
    const response = await axios.get(`${API_URL}/notas/preceptor/curso/${idCurso}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener las calificaciones del curso");
  }
};

export const obtenerMisNotasAlumno = async () => {
  try {
    const response = await axios.get(`${API_URL}/notas/mis-notas`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener tus calificaciones");
  }
};

export const guardarNota = async (notaData) => {
  try {
    const response = await axios.post(`${API_URL}/notas`, notaData, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al guardar la calificación");
  }
};

export const modificarNotaService = async (notaData) => {
  try {
    const response = await axios.patch(`${API_URL}/notas`, notaData, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al modificar la calificación");
  }
};

export const obtenerHistorialNotasAlumno = async (idAlumno) => {
  try {
    const response = await axios.get(`${API_URL}/notas/historial/alumno/${idAlumno}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo consultar el historial de calificaciones");
  }
};

// Wrapper semántico para la vista de administración: planilla completa
// de un curso (usa el endpoint de preceptor, habilitado para root/admin).
export const obtenerPlanillaAdmin = async (idCurso) => {
  return obtenerNotasPreceptorCurso(idCurso);
};

export const eliminarNotaService = async (idNota) => {
  try {
    const response = await axios.delete(`${API_URL}/notas/${idNota}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al eliminar la calificación");
  }
};

/* =========================================================
   HISTORIAL DE EMAILS
========================================================= */


/**
 * Obtener historial de correos enviados por el preceptor
 *
 * GET /api/academico/correos/enviados
 */
export const obtenerCorreosEnviados = async () => {

  try {

    const response = await axios.get(
      `${API_URL}/correos/enviados`,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error, "No se pudieron obtener los correos enviados");

  }

};


/**
 * Obtener historial de correos de un alumno
 *
 * GET /api/academico/alumnos/:id/correos
 */
export const obtenerCorreosAlumno = async (
  idAlumno
) => {

  try {

    const response = await axios.get(
      `${API_URL}/alumnos/${idAlumno}/correos`,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error, "No se pudo obtener el historial de correos del alumno");

  }

};


/**
 * Marcar correo como leído
 *
 * PATCH /api/academico/correos/:id/leido
 */
export const marcarCorreoLeido = async (
  idCorreo
) => {

  try {

    const response = await axios.patch(
      `${API_URL}/correos/${idCorreo}/leido`,
      {},
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error, "No se pudo marcar el correo como leído");

  }

};


/* =========================================================
   COMUNICADOS
========================================================= */


/**
 * Obtener comunicados
 *
 * GET /api/comunidad/comunicados
 *
 * Parámetros opcionales:
 * rol
 * curso
 * cursos
 */
export const obtenerComunicados = async (
  parametros = {}
) => {

  try {

    const config = getConfig();

    const params = {};

    if (parametros.rol) {
      params.rol = parametros.rol;
    }

    if (parametros.curso) {
      params.curso = parametros.curso;
    }

    if (parametros.cursos) {
      params.cursos = parametros.cursos;
    }

    if (Object.keys(params).length > 0) {
      config.params = params;
    }

    const response = await axios.get(
      `${BASE_URL}/comunidad/comunicados`,
      config
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error, "No se pudieron obtener los comunicados");

  }

};


/**
 * Obtener un comunicado específico
 *
 * GET /api/comunidad/comunicados/:id
 */
export const obtenerComunicado = async (
  id
) => {

  try {

    const response = await axios.get(
      `${BASE_URL}/comunidad/comunicados/${id}`,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error, "No se pudo obtener el comunicado");

  }

};


/**
 * Crear comunicado
 *
 * POST /api/comunidad/comunicados
 */
export const crearComunicado = async (
  comunicadoData
) => {

  try {

    const payload = {

      titulo:
        comunicadoData.titulo,

      mensaje:
        comunicadoData.mensaje,

      importancia:
        comunicadoData.importancia,

      destino:
        comunicadoData.destino,

      curso_destino:
        comunicadoData.curso_destino ?? null,

      autor_id:
        comunicadoData.autor_id

    };

    const response = await axios.post(
      `${BASE_URL}/comunidad/comunicados`,
      payload,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error, "No se pudo crear el comunicado");

  }

};


/**
 * Modificar comunicado
 *
 * PUT /api/comunidad/comunicados/:id
 */
export const modificarComunicado = async (
  id,
  comunicadoData
) => {

  try {

    const payload = {};

    if (
      comunicadoData.titulo !== undefined
    ) {
      payload.titulo =
        comunicadoData.titulo;
    }

    if (
      comunicadoData.mensaje !== undefined
    ) {
      payload.mensaje =
        comunicadoData.mensaje;
    }

    if (
      comunicadoData.importancia !== undefined
    ) {
      payload.importancia =
        comunicadoData.importancia;
    }

    if (
      comunicadoData.destino !== undefined
    ) {
      payload.destino =
        comunicadoData.destino;
    }

    if (
      comunicadoData.curso_destino !== undefined
    ) {
      payload.curso_destino =
        comunicadoData.curso_destino;
    }

    const response = await axios.put(
      `${BASE_URL}/comunidad/comunicados/${id}`,
      payload,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error, "No se pudo modificar el comunicado");

  }

};


/**
 * Eliminar comunicado
 *
 * DELETE /api/comunidad/comunicados/:id
 */
export const eliminarComunicado = async (
  id
) => {

  try {

    const response = await axios.delete(
      `${BASE_URL}/comunidad/comunicados/${id}`,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error, "No se pudo eliminar el comunicado");

  }

};
