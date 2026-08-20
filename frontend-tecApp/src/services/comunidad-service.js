import axios from "axios";
import { useAuthStore } from "../stores/auth.js";

// ==========================================
//      CONFIGURACIÓN Y HELPERS
// ==========================================

const API_URL = import.meta.env.VITE_API_URL;
/**
 * Genera dinámicamente los headers con el token actualizado de Pinia.
 * @param {boolean} isMultipart - True si se envía FormData (archivos), omite el Content-Type JSON.
 */
const getConfig = (isMultipart = false) => {
  const authStore = useAuthStore();
  const headers = {
    Authorization: `Bearer ${authStore.token}`,
  };

  if (!isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  return { headers };
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
      message:
        error.response.data?.message ||
        error.response.data?.error ||
        error.response.data?.mensaje || // Soporte para las respuestas de tu backend
        mensajePorDefecto,
    };
  }

  return {
    success: false,
    message: "No se pudo conectar con el servidor. Revisá tu conexión.",
  };
};

// ==========================================
//      SERVICIOS DE NOTICIAS
// ==========================================

export const obtenerNoticias = async () => {
  try {
    const response = await axios.get(`${API_URL}/comunidad/noticias`, getConfig());
    return response.data.noticias;
  } catch (error) {
    manejarErrorApi(error, "Error al obtener las noticias");
    return [];
  }
};

export const crearNoticia = async (formDataArmado) => {
  try {
    const response = await axios.post(
      `${API_URL}/comunidad/noticias`, 
      formDataArmado, 
      formDataArmado instanceof FormData ? getConfig(true) : getConfig()
    );
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al crear la noticia");
  }
};

export const actualizarNoticia = async (id, formDataArmado) => {
  try {
    const response = await axios.patch(
      `${API_URL}/comunidad/noticias/${id}`, 
      formDataArmado, 
      formDataArmado instanceof FormData ? getConfig(true) : getConfig()
    );
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al actualizar la noticia");
  }
};

export const eliminarNoticia = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/comunidad/noticias/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al eliminar la noticia");
  }
};

// ==========================================
//      SERVICIOS DE COMUNICADOS
// ==========================================

export const obtenerTodosComunicados = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${API_URL}/comunidad/comunicados?${queryString}` : `${API_URL}/comunidad/comunicados`;
    const response = await axios.get(url, getConfig());
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return manejarErrorApi(error, "Error al obtener los comunicados");
  }
};

export const obtenerComunicado = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/comunidad/comunicados/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, `Error al obtener el comunicado ${id}`);
  }
};

export const crearComunicado = async (comunicadoData) => {
  try {
    const response = await axios.post(`${API_URL}/comunidad/comunicados`, comunicadoData, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al crear el comunicado");
  }
};

export const actualizarComunicado = async (id, comunicadoData) => {
  try {
    const response = await axios.put(`${API_URL}/comunidad/comunicados/${id}`, comunicadoData, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, `Error al actualizar el comunicado ${id}`);
  }
};

export const eliminarComunicado = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/comunidad/comunicados/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, `Error al eliminar el comunicado ${id}`);
  }
};

// ==========================================
//        SERVICIOS DE OBJETOS PERDIDOS
// ==========================================

export const obtenerObjetosPerdidos = async () => {
  try {
    const response = await axios.get(`${API_URL}/comunidad/objetos-perdidos`, getConfig());
    return response.data;
  } catch (error) {
    manejarErrorApi(error, "Error al obtener los objetos perdidos");
    return [];
  }
};

export const reportarObjetoPerdido = async (objetoData) => {
  try {
    const response = await axios.post(`${API_URL}/comunidad/objetos-perdidos`, objetoData, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al reportar el objeto perdido");
  }
};

export const actualizarEstadoObjetoPerdido = async (id, estado) => {
  try {
    const response = await axios.put(`${API_URL}/comunidad/objetos-perdidos/${id}`, { estado }, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al actualizar el estado del objeto");
  }
};

export const eliminarObjetoPerdido = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/comunidad/objetos-perdidos/${id}`, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "Error al eliminar el objeto perdido");
  }
};
