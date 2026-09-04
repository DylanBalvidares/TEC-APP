import axios from "axios";
import { useAuthStore } from "../stores/auth.js";

// ==========================================
//      CONFIGURACIÓN Y HELPERS
// ==========================================

const BASE_URL = import.meta.env.VITE_API_URL;
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
      capacidad_maxima: cursoData.capacidad_maxima,
      aula: cursoData.aula,
      turno: cursoData.turno,
      id_profesor_titular: cursoData.id_profesor_titular,
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
      capacidad_maxima: cursoData.capacidad_maxima,
      aula: cursoData.aula,
      turno: cursoData.turno,
      id_profesor_titular: cursoData.id_profesor_titular,
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

export const obtenerAlumnos = async () => {
  try {
    const response = await axios.get(`${API_URL}/alumnos`, getConfig());
    return {
      success: true,
      data: response.data,
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
      nombre_tutor: alumnoData.nombre_tutor,
      telefono_tutor: alumnoData.telefono_tutor,
      domicilio: alumnoData.domicilio,
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
//                  CARGOS
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
    const response = await axios.get(`${API_URL}/cargo/${id}`, getConfig());
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
    const userId = authStore.usuario?.id;
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

export const obtenerComunicados = async (params = {}) => {
  try {
    const queryString = Object.keys(params).length > 0 ? `?${new URLSearchParams(params).toString()}` : "";
    const response = await axios.get(`${BASE_URL}/comunidad/comunicados${queryString}`, getConfig());

    return {
      success: true,
      data: response.data,
    }

  } catch (error) {
    return manejarErrorApi(error, "No se pudo obtener los comunicados");
  }
};

export const obtenerComunicado = async (id) => {
  try {
    const response = await axios.get(`${BASE_URL}/comunidad/comunicados/${id}`, getConfig());
    return {
      success: true,
      data: response.data,
    }
  } catch (error) {
    return manejarErrorApi(error, "No se pudo obtener el comunicado");
  }
};
