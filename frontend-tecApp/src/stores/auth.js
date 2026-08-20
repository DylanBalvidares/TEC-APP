import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  // 1. Estado inicial leyendo de localStorage de manera segura con try-catch
  const token = ref(localStorage.getItem("token") || null);

  let usuarioInicial = null;
  try {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      usuarioInicial = JSON.parse(storedUser);
    }
  } catch (e) {
    console.error(
      "Error parseando los datos de usuario guardados en localStorage:",
      e,
    );
    // Limpiamos datos rotos o inválidos para prevenir colapsos en cascada
    localStorage.removeItem("usuario");
    localStorage.removeItem("token");
    token.value = null;
  }

  const usuario = ref(usuarioInicial);

  // 2. Getters (computed)
  const estaAutenticado = computed(() => !!token.value);
  // Exponemos el rol para que el router.beforeEach lo pueda leer
  const rol = computed(() => usuario.value?.nombre_rol || null);
  // Exponemos los permisos para usarlos en los componentes (ej. ocultar botones)
  const permisos = computed(() => usuario.value?.permisos || []);

  // 3. Acciones
  // Cambiamos 'setToken' por 'login' para guardar ambas cosas a la vez
  const login = (nuevoToken, datosUsuario) => {
    token.value = nuevoToken;
    usuario.value = datosUsuario;

    localStorage.setItem("token", nuevoToken);
    // localStorage solo guarda strings, así que convertimos el objeto
    localStorage.setItem("usuario", JSON.stringify(datosUsuario));
  };

  const logout = () => {
    token.value = null;
    usuario.value = null;

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
  };

  // Actualiza campos del perfil localmente y persiste en localStorage
  const updateProfile = (patch) => {
    if (!usuario.value) usuario.value = {};
    usuario.value = { ...usuario.value, ...patch };
    try {
      localStorage.setItem("usuario", JSON.stringify(usuario.value));
    } catch (e) {
      console.error("No se pudo guardar usuario en localStorage:", e);
    }
  };

  // Extra: Un helper muy útil para usar con v-if en tus componentes Vue
  const tienePermiso = (permiso) => permisos.value.includes(permiso);

  const guardarInfo = (info) => {
    localStorage.setItem("alumno", JSON.stringify(info));
  };

  return {
    token,
    usuario,
    estaAutenticado,
    rol,
    permisos,
    login,
    logout,
    updateProfile,
    tienePermiso,
    guardarInfo,
  };
});
