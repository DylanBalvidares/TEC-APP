import axios from "axios";
import { useAuthStore } from "../stores/auth.js";

const API_URL = "/api/biblioteca";

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
        mensajePorDefecto,
    };
  }
  return { success: false, message: "No se pudo conectar con el servidor." };
};

const lista = (res) => {
  const data = res?.data ?? res;
  return Array.isArray(data) ? data : (data?.data || []);
};

export const obtenerLibros = async () => {
  try {
    const response = await axios.get(`${API_URL}/biblioteca`, getConfig());
    return { success: true, data: lista(response) };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los libros");
  }
};

export const obtenerRecursos = async () => {
  try {
    const response = await axios.get(`${API_URL}/recursos`, getConfig());
    return { success: true, data: lista(response) };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los recursos");
  }
};

export const obtenerPrestamos = async () => {
  try {
    const response = await axios.get(`${API_URL}/prestamos`, getConfig());
    return { success: true, data: lista(response) };
  } catch (error) {
    return manejarErrorApi(error, "No se pudieron obtener los préstamos");
  }
};

export const actualizarPrestamo = async (prestamo) => {
  try {
    const id = prestamo.id_prestamo ?? prestamo.id;
    const response = await axios.patch(`${API_URL}/prestamos/${id}`, prestamo, getConfig());
    return { success: true, data: response.data };
  } catch (error) {
    return manejarErrorApi(error, "No se pudo actualizar el préstamo");
  }
};

export const registrarDevolucion = async (prestamo) => {
  const hoy = new Date().toISOString().slice(0, 10);
  return actualizarPrestamo({ ...prestamo, estado: "devuelto", fecha_devolucion: hoy });
};
