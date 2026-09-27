import axios from "axios";
import { useAuthStore } from "../stores/auth.js";

const API_URL = "/api/comunidad/mensajes";

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
      message:
        error.response.data?.message ||
        error.response.data?.error ||
        error.response.data?.mensaje ||
        mensajePorDefecto,
    };
  }
  return { success: false, message: "No se pudo conectar con el servidor. Revisá tu conexión." };
};

export const enviarWhatsappAAlumno = async (idAlumno, cuerpo) => {
  try {
    const r = await axios.post(`${API_URL}/enviar-alumno/${idAlumno}`, { cuerpo }, getConfig());
    return { success: true, data: r.data };
  } catch (e) {
    return manejarErrorApi(e, "Error al enviar el WhatsApp");
  }
};

export const obtenerMisMensajes = async (params = {}) => {
  try {
    const r = await axios.get(`${API_URL}/mios`, { ...getConfig(), params });
    return { success: true, data: r.data.lista || [], total: r.data.total || 0 };
  } catch (e) {
    return manejarErrorApi(e, "Error al obtener mi historial");
  }
};

export const obtenerTodosMensajes = async (params = {}) => {
  try {
    const r = await axios.get(`${API_URL}/todos`, { ...getConfig(), params });
    return { success: true, data: r.data.lista || [], total: r.data.total || 0 };
  } catch (e) {
    return manejarErrorApi(e, "Error al obtener el historial global");
  }
};

export const reenviarMensaje = async (id) => {
  try {
    const r = await axios.post(`${API_URL}/${id}/reenviar`, {}, getConfig());
    return { success: true, data: r.data };
  } catch (e) {
    return manejarErrorApi(e, "Error al reenviar el mensaje");
  }
};

export const marcarMensajeLeido = async (id) => {
  try {
    const r = await axios.patch(`${API_URL}/${id}/leido`, {}, getConfig());
    return { success: true, data: r.data };
  } catch (e) {
    return manejarErrorApi(e, "Error al marcar como leído");
  }
};

export const validarTelefono = async (telefono) => {
  try {
    const r = await axios.post(`${API_URL}/validar`, { telefono }, getConfig());
    return { success: true, data: r.data };
  } catch (e) {
    return manejarErrorApi(e, "Error al validar el teléfono");
  }
};

export const diagnosticarTelefonos = async () => {
  try {
    const r = await axios.get(`${API_URL}/diagnostico-telefonos`, getConfig());
    return { success: true, data: r.data };
  } catch (e) {
    return manejarErrorApi(e, "Error al diagnosticar teléfonos");
  }
};

export const eliminarMensaje = async (id) => {
  try {
    const r = await axios.delete(`${API_URL}/${id}`, getConfig());
    return { success: true, data: r.data };
  } catch (e) {
    return manejarErrorApi(e, "Error al eliminar el mensaje");
  }
};
