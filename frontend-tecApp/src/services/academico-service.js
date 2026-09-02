
import axios from "axios";
import { useAuthStore } from "@/stores/auth.js";

const BASE_URL = import.meta.env.VITE_API_URL;
const API_URL = `${BASE_URL}/academico`;


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const getConfig = () => {

  const authStore = useAuthStore();

  return {
    headers: {
      Authorization: `Bearer ${authStore.token}`
    }
  };

};


/* =========================================================
   MANEJO DE ERRORES
========================================================= */

const manejarErrorApi = (error) => {

  if (error.response) {

    return {
      success: false,
      status: error.response.status,
      message:
        error.response.data?.message ||
        "Ocurrió un error en el servidor."
    };

  }

  if (error.request) {

    return {
      success: false,
      status: 0,
      message:
        "No se pudo conectar con el servidor."
    };

  }

  return {
    success: false,
    status: 0,
    message:
      error.message ||
      "Ocurrió un error inesperado."
  };

};


/* =========================================================
   CURSOS
========================================================= */


/**
 * Obtener todos los cursos
 */
export const obtenerCursos = async () => {

  try {

    const response = await axios.get(
      `${API_URL}/cursos`,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/**
 * Crear curso
 */
export const crearCurso = async (cursoData) => {

  try {

    const response = await axios.post(
      `${API_URL}/cursos`,
      cursoData,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/**
 * Modificar curso
 */
export const modificarCurso = async (cursoData) => {

  try {

    const response = await axios.patch(
      `${API_URL}/cursos`,
      cursoData,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/**
 * Eliminar curso
 */
export const eliminarCurso = async (id) => {

  try {

    const response = await axios.delete(
      `${API_URL}/cursos/${id}`,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/**
 * Cancelar curso
 */
export const cancelarCurso = async (id) => {

  try {

    const response = await axios.patch(
      `${API_URL}/cursos/cancelar/${id}`,
      {},
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/* =========================================================
   ALUMNOS
========================================================= */


/**
 * Obtener alumnos de un curso
 *
 * GET /api/academico/alumnos/curso/:id
 */
export const obtenerAlumnosCurso = async (
  idOCurso,
  fecha = null
) => {

  try {

    const idCurso =
      typeof idOCurso === "object"
        ? (
            idOCurso.id_curso ??
            idOCurso.id ??
            idOCurso.idCurso
          )
        : idOCurso;

    const url =
      `${API_URL}/alumnos/curso/${idCurso}`;

    const config = getConfig();

    if (fecha) {

      config.params = {
        fecha
      };

    }

    const response =
      await axios.get(
        url,
        config
      );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/**
 * Obtener todos los alumnos
 */
export const obtenerAlumnos = async () => {

  try {

    const response = await axios.get(
      `${API_URL}/alumnos`,
      getConfig()
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/**
 * Crear alumno
 *
 * POST /api/academico/alumnos
 */
export const crearAlumno = async (alumnoData) => {

  try {

    const payload = {

      nombre:
        alumnoData.nombre,

      apellido:
        alumnoData.apellido,

      dni:
        alumnoData.dni,

      fecha_nacimiento:
        alumnoData.fecha_nacimiento,

      nombre_tutor:
        alumnoData.nombre_tutor,

      telefono_tutor:
        alumnoData.telefono_tutor,

      domicilio:
        alumnoData.domicilio,

      id_curso:
        alumnoData.id_curso

    };


    // Si el alumno ya tiene una cuenta,
    // podemos asociar su usuario existente.
    if (alumnoData.id_usuario) {

      payload.id_usuario =
        alumnoData.id_usuario;

    }


    const response =
      await axios.post(
        `${API_URL}/alumnos`,
        payload,
        getConfig()
      );


    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/**
 * Modificar alumno
 *
 * PATCH /api/academico/alumnos
 */
export const modificarAlumno = async (
  alumnoData
) => {

  try {

    const payload = {

      id_alumno:
        alumnoData.id_alumno

    };


    // Campos opcionales
    if (
      alumnoData.nombre !== undefined
    ) {
      payload.nombre =
        alumnoData.nombre;
    }

    if (
      alumnoData.apellido !== undefined
    ) {
      payload.apellido =
        alumnoData.apellido;
    }

    if (
      alumnoData.dni !== undefined
    ) {
      payload.dni =
        alumnoData.dni;
    }

    if (
      alumnoData.fecha_nacimiento !== undefined
    ) {
      payload.fecha_nacimiento =
        alumnoData.fecha_nacimiento;
    }

    if (
      alumnoData.nombre_tutor !== undefined
    ) {
      payload.nombre_tutor =
        alumnoData.nombre_tutor;
    }

    if (
      alumnoData.telefono_tutor !== undefined
    ) {
      payload.telefono_tutor =
        alumnoData.telefono_tutor;
    }

    if (
      alumnoData.domicilio !== undefined
    ) {
      payload.domicilio =
        alumnoData.domicilio;
    }

    if (
      alumnoData.id_curso !== undefined
    ) {
      payload.id_curso =
        alumnoData.id_curso;
    }

    if (
      alumnoData.id_usuario !== undefined
    ) {
      payload.id_usuario =
        alumnoData.id_usuario;
    }

    if (
      alumnoData.estado !== undefined
    ) {
      payload.estado =
        alumnoData.estado;
    }


    const response =
      await axios.patch(
        `${API_URL}/alumnos`,
        payload,
        getConfig()
      );


    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/**
 * Eliminar alumno
 *
 * DELETE /api/academico/alumnos/:id
 */
export const eliminarAlumno = async (
  id
) => {

  try {

    const response =
      await axios.delete(
        `${API_URL}/alumnos/${id}`,
        getConfig()
      );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/**
 * Dar de baja alumno
 *
 * PATCH /api/academico/alumnos/dar-de-baja/:id
 */
export const darDeBajaAlumno = async (
  id
) => {

  try {

    const response =
      await axios.patch(
        `${API_URL}/alumnos/dar-de-baja/${id}`,
        {},
        getConfig()
      );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};


/* =========================================================
   EMAIL A ALUMNO
========================================================= */


/**
 * Enviar email a un alumno
 *
 * POST /api/academico/alumnos/enviar-email/:id_alumno
 *
 * Body:
 * {
 *   asunto: "...",
 *   mensaje: "..."
 * }
 */
export const enviarEmailAlumno = async (
  idAlumno,
  emailData
) => {

  try {

    const payload = {

      asunto:
        emailData.asunto,

      mensaje:
        emailData.mensaje

    };


    const response =
      await axios.post(
        `${API_URL}/alumnos/enviar-email/${idAlumno}`,
        payload,
        getConfig()
      );


    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    return manejarErrorApi(error);

  }

};
