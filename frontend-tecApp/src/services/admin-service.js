import axios from "axios";
import { useAuthStore } from "../stores/auth.js";

const API_URL = "/api/admin";

const getConfig = () => {
  const authStore = useAuthStore();
  return {
    headers: {
      Authorization: `Bearer ${authStore.token}`,
      "Content-Type": "application/json",
    },
  };
};

// Timeline de auditoría con filtros (C4).
export const obtenerAuditoria = async (params = {}) => {
  try {
    const { data } = await axios.get(`${API_URL}/auditoria`, {
      ...getConfig(),
      params,
    });
    return { success: true, data: data.data || [], total: data.total || 0 };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        message:
          error.response.data?.error ||
          error.response.data?.message ||
          "Error al obtener la auditoría",
      };
    }
    return { success: false, message: "No se pudo conectar con el servidor." };
  }
};

// Configuración del sistema (E2).
export const obtenerConfiguracion = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/configuracion`, getConfig());
    return { success: true, data: data.config || {} };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        message: error.response.data?.error || "Error al obtener la configuración",
      };
    }
    return { success: false, message: "No se pudo conectar con el servidor." };
  }
};

export const guardarConfiguracion = async (cambios) => {
  try {
    const { data } = await axios.put(`${API_URL}/configuracion`, cambios, getConfig());
    return { success: true, data: data.config || {} };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        message: error.response.data?.error || "Error al guardar la configuración",
      };
    }
    return { success: false, message: "No se pudo conectar con el servidor." };
  }
};

// Resumen de reportes académicos (E1).
export const obtenerResumenReportes = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/reportes/resumen`, getConfig());
    return { success: true, data };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        message:
          error.response.data?.error ||
          error.response.data?.message ||
          "Error al obtener los reportes",
      };
    }
    return { success: false, message: "No se pudo conectar con el servidor." };
  }
};

// Una sola request para todo el Overview (C3).
export const obtenerMetricas = async () => {
  try {
    const { data } = await axios.get(`${API_URL}/metricas`, getConfig());
    return { success: true, data };
  } catch (error) {
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        message:
          error.response.data?.error ||
          error.response.data?.message ||
          "Error al obtener las métricas",
      };
    }
    return { success: false, message: "No se pudo conectar con el servidor." };
  }
};
