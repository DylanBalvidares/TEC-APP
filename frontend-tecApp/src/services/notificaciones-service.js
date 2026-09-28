import axios from "axios";
import { useAuthStore } from "../stores/auth.js";

const API_URL = "/api/comunidad/notificaciones";

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
  if (error.response) {
    return {
      success: false,
      status: error.response.status,
      message: error.response.data?.message || error.response.data?.error || mensajePorDefecto,
    };
  }
  return { success: false, message: "No se pudo conectar con el servidor." };
};

export const obtenerMisNotificaciones = async (soloNoLeidas = false) => {
  try {
    const r = await axios.get(`${API_URL}/mias`, {
      ...getConfig(),
      params: soloNoLeidas ? { noLeidas: "1" } : {},
    });
    return { success: true, data: r.data.lista || [], total: r.data.total || 0 };
  } catch (e) {
    return manejarErrorApi(e, "Error al obtener notificaciones");
  }
};

export const marcarNotificacionLeida = async (id) => {
  try {
    const r = await axios.patch(`${API_URL}/${id}/leida`, {}, getConfig());
    return { success: true, data: r.data };
  } catch (e) {
    return manejarErrorApi(e, "Error al marcar como leída");
  }
};

export const obtenerPreferencias = async () => {
  try {
    const r = await axios.get(`${API_URL}/preferencias`, getConfig());
    return { success: true, data: r.data.preferencias || {} };
  } catch (e) {
    return manejarErrorApi(e, "Error al obtener preferencias");
  }
};

export const guardarPreferencias = async (preferencias) => {
  try {
    const r = await axios.put(`${API_URL}/preferencias`, preferencias, getConfig());
    return { success: true, data: r.data.preferencias || {} };
  } catch (e) {
    return manejarErrorApi(e, "Error al guardar preferencias");
  }
};
