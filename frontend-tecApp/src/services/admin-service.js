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
