import axios from "axios";
import { useAuthStore } from "../stores/auth";
import router from "../router/router.js";

const API_URL = `${import.meta.env.VITE_API_URL}/auth`;
const ALUMNOS_API_URL = `${import.meta.env.VITE_API_URL}/academico`;

//const API_URL = "/api/auth";
//const ALUMNOS_API_URL = "/api/academico";

const ROL_ROUTES = {
  root: "/dashboard-administrador",
  preceptor: "/dashboard-preceptor",
  profesor: "/profesor",
  alumno: "/alumno/inicio",
};

const getConfig = () => {
  const authStore = useAuthStore();
  return {
    headers: {
      Authorization: `Bearer ${authStore.token}`,
      "Content-Type": "application/json",
    },
  };
};

const estandarizarError = (error, mensajePorDefecto) => {
  console.error(`[API Error] ${mensajePorDefecto}:`, error);
  const data = error.response?.data;
  return {
    success: false,
    message: data?.message || data?.error || mensajePorDefecto,
  };
};

export const redireccionarSegunRol = (nombreRol) => {
  const ruta = ROL_ROUTES[nombreRol?.toLowerCase()] || "/";
  router.push(ruta);
};

const obtenerInfoAlumno = async (idUsuario) => {
  const authStore = useAuthStore();
  try {
    const response = await axios.get(`${ALUMNOS_API_URL}/alumnos-mi-info/${idUsuario}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return estandarizarError(error, "No se pudo obtener el perfil de alumno");
  }
};

const obtenerInfoProfesor = async (idUsuario) => {
  const authStore = useAuthStore();
  try {
    const response = await axios.get(`${ALUMNOS_API_URL}/profesores-mi-info/${idUsuario}`, {
      headers: { Authorization: `Bearer ${authStore.token}` },
    });
    return { success: true, data: response.data };
  } catch (error) {
    return estandarizarError(error, "No se pudo obtener el perfil de profesor");
  }
};

const cargarPerfilAdicional = async (usuario) => {
  if (!usuario || !usuario.nombre_rol) return;

  const authStore = useAuthStore();
  if (usuario.nombre_rol === "alumno") {
    const info = await obtenerInfoAlumno(usuario.id);
    if (info.success) authStore.guardarInfo(info.data);
  } else if (usuario.nombre_rol === "profesor") {
    const info = await obtenerInfoProfesor(usuario.id);
    if (info.success) authStore.guardarInfo(info.data);
  }
};

export const login = async (loginData) => {
  try {
    const { data } = await axios.post(`${API_URL}/login`, loginData);
    const authStore = useAuthStore();

    authStore.login(data.token, data.usuario);
    // Cargar perfil adicional en segundo plano (no bloquea el login)
    cargarPerfilAdicional(data.usuario).catch(() => {});
    redireccionarSegunRol(data.usuario.nombre_rol);

    return { success: true, usuario: data.usuario };
  } catch (error) {
    return estandarizarError(error, "Error al iniciar sesión.");
  }
};

export const registro = async (registroData) => {
  try {
    const { data } = await axios.post(`${API_URL}/iniciar-registro`, {
      dni: registroData.dni,
      nacimiento: registroData.fecha_nacimiento,
      email: registroData.email,
    });
    return { success: true, message: data.message };
  } catch (error) {
    return estandarizarError(error, "No fue posible iniciar el registro.");
  }
};

export const verificarCodigo = async (info) => {
  try {
    const { data } = await axios.post(`${API_URL}/verificar-codigo`, info);
    return { success: true, ...data };
  } catch (error) {
    return estandarizarError(error, "Código inválido o expirado.");
  }
};
