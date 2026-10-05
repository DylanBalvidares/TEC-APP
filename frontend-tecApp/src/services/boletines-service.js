import axios from "axios";
import { useAuthStore } from "../stores/auth.js";

// Servicio de Boletines cuatrimestrales (aditivo a la libreta numérica).
// Base: GET/POST/PATCH /api/academico/boletines/*

const API_URL = "/api/academico/boletines";

const getConfig = () => {
  const authStore = useAuthStore();
  return {
    headers: {
      Authorization: `Bearer ${authStore.token}`,
      "Content-Type": "application/json",
    },
  };
};

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

// ---- Períodos ----
export const obtenerPeriodosBoletin = async () => {
  try {
    const response = await axios.get(`${API_URL}/periodos`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los períodos");
  }
};

export const crearPeriodoBoletin = async (periodoData) => {
  try {
    const response = await axios.post(`${API_URL}/periodos`, periodoData, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al crear el período");
  }
};

export const actualizarPeriodoBoletin = async (idPeriodo, cambios) => {
  try {
    const response = await axios.patch(`${API_URL}/periodos/${idPeriodo}`, cambios, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al actualizar el período");
  }
};

export const prepararCursoBoletin = async (idPeriodo, idCurso, idPlan) => {
  try {
    const response = await axios.post(
      `${API_URL}/periodos/${idPeriodo}/preparar`,
      { id_curso: idCurso, id_plan: idPlan },
      getConfig(),
    );
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al preparar el curso");
  }
};

// ---- Carga del profesor ----
export const obtenerCargaProfesorBoletin = async (idPeriodo) => {
  try {
    const qs = idPeriodo ? `?id_periodo=${idPeriodo}` : "";
    const response = await axios.get(`${API_URL}/profesor${qs}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo obtener la carga del período");
  }
};

export const guardarCalificacionBoletin = async (calificacionData) => {
  try {
    const response = await axios.post(`${API_URL}/calificaciones`, calificacionData, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al guardar la calificación");
  }
};

export const finalizarMateriaBoletin = async (idPeriodo, idAsignacion) => {
  try {
    const response = await axios.post(
      `${API_URL}/finalizar`,
      { id_periodo: idPeriodo, id_asignacion: idAsignacion },
      getConfig(),
    );
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al finalizar la materia");
  }
};

// ---- Lectura preceptor / supervisión ----
export const obtenerPlanillaBoletin = async (idCurso, idPeriodo) => {
  try {
    const qs = idPeriodo ? `?id_periodo=${idPeriodo}` : "";
    const response = await axios.get(`${API_URL}/planilla/curso/${idCurso}${qs}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo obtener la planilla");
  }
};

export const obtenerConsolidadoBoletin = async (idCurso, idPeriodo) => {
  try {
    const qs = idPeriodo ? `?id_periodo=${idPeriodo}` : "";
    const response = await axios.get(`${API_URL}/consolidado/curso/${idCurso}${qs}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "El consolidado aún no está disponible");
  }
};

// ---- Reaperturas ----
export const obtenerReaperturasBoletin = async (filtros = {}) => {
  try {
    const qs = new URLSearchParams(filtros).toString();
    const response = await axios.get(`${API_URL}/reaperturas${qs ? `?${qs}` : ""}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener las reaperturas");
  }
};

export const solicitarReaperturaBoletin = async (idPeriodo, idAsignacion, motivo) => {
  try {
    const response = await axios.post(
      `${API_URL}/reaperturas`,
      { id_periodo: idPeriodo, id_asignacion: idAsignacion, motivo },
      getConfig(),
    );
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al solicitar la reapertura");
  }
};

export const decidirReaperturaBoletin = async (idReapertura, estado, motivoDecision) => {
  try {
    const response = await axios.patch(
      `${API_URL}/reaperturas/${idReapertura}`,
      { estado, motivo_decision: motivoDecision },
      getConfig(),
    );
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al decidir la reapertura");
  }
};

// ---- Historial ----
export const obtenerHistorialBoletin = async (idAlumno, idPeriodo) => {
  try {
    const qs = idPeriodo ? `?id_periodo=${idPeriodo}` : "";
    const response = await axios.get(`${API_URL}/historial/alumno/${idAlumno}${qs}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo consultar el historial");
  }
};

// Etiqueta visible de una calificación (numérica, TED/TEP/TEA o Sin calificar).
export const etiquetaCalificacion = (tipo, valor) => {
  if (!tipo) return "Pendiente";
  if (tipo === "numerica") return String(Number(valor));
  if (tipo === "sin_calificar") return "S/C";
  return tipo;
};
