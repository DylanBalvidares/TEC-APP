import { createApp } from "vue";
import App from "./app.vue";
import router from "./router/router";
import { createPinia } from "pinia";
import { useAuthStore } from "./stores/auth";
import axios from "axios";
import "./style.css";
import "./assets/admin-shared.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Configuración global de Axios para inyectar Token automáticamente
axios.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();

    // Inyectar Bearer token automáticamente si el usuario está autenticado y no se definió manualmente
    if (authStore.token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${authStore.token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Eliminamos 'next' de los parámetros
router.beforeEach((to, from) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth) {
    if (!authStore.estaAutenticado) {
      return {
        path: "/inicio",
      };
    }

    console.log("PERMISO DASHBOARD:", to.meta.role);
    console.log("PERMISO ACTUAL:", authStore.rol);
    if (to.meta.role && authStore.rol !== to.meta.role) {
      return {
        path: "/unauthorized",
      };
    }
  }

  // Si pasamos todos los filtros (o si es una ruta pública),
  // retornamos 'true' (o nada) para permitir la navegación.
  return;
});

app.use(router);
app.mount("#app");
