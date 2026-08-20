import axios from "axios";
import { useAuthStore } from "../stores/auth.js";

const API_URL = `${import.meta.env.VITE_API_URL}/usuarios`;

const getConfig = () => {
  const authStore = useAuthStore();

  return {
    headers: {
      Authorization: `Bearer ${authStore.token}`,
      "Content-Type": "application/json",
    },
  };
};

// =========== USUARIOS ===========

export const obtenerUsuarios = async () => {
  try {
    const response = await axios.get(`${API_URL}/usuarios`, getConfig());

    console.log("Usuarios obtenidos:", response.data);

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        message:
          error.response.data?.message || error.response.data?.error || "Error al obtener usuarios",
      };
    }
    return { success: false, message: "No se pudo conectar con el servidor." };
  }
};

export const crearUsuario = async (usuarioData) => {
  try {
    const response = await axios.post(
      `${API_URL}/usuarios/registro`,
      {
        nombre: usuarioData.nombre,
        apellido: usuarioData.apellido,
        email: usuarioData.email,
        contrasena: usuarioData.contrasena,
        id_rol: usuarioData.id_rol,
      },
      getConfig(),
    );

    console.log("Usuario creado:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error al crear usuario:", error);
    throw error;
  }
};

export const eliminarUsuario = async (id) => {
  try {
    const response = await axios.delete(
      `${API_URL}/usuarios/${id}`,
      getConfig(),
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    if (error.response) {
      console.error("ERROR RESPONSE ->", error.response);

      return {
        success: false,
        status: error.response.status,
        message:
          error.response.data?.message || "No se pudo eliminar el usuario.",
      };
    }

    return {
      success: false,
      message: "No se pudo conectar con el servidor.",
    };
  }
};

export const modificarUsuario = async (usuarioData) => {
  try {
    const response = await axios.patch(
      `${API_URL}/usuarios`,
      {
        id_usuario: usuarioData.id_usuario,
        nombre: usuarioData.nombre,
        apellido: usuarioData.apellido,
        email: usuarioData.email,
        contrasena: usuarioData.contrasena,
        id_rol: usuarioData.id_rol,
      },
      getConfig(),
    );

    console.log("Usuario modificado:", response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error("Error al modificar usuario:", error);
    throw error;
  }
};

// =========== ROLES ===========

export const obtenerRoles = async () => {
  try {
    const response = await axios.get(`${API_URL}/roles`, getConfig());

    console.log("Roles obtenidos:", response.data);

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error al obtener roles:", error);
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        message:
          error.response.data?.message || error.response.data?.error || "Error al obtener roles",
      };
    }
    return { success: false, message: "No se pudo conectar con el servidor." };
  }
};
