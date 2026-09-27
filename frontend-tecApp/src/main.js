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

// Si el backend responde 401 con un token presente, la sesión ya no es válida:
// se limpia el estado y se vuelve al login (evita pantallas rotas por sesión vencida).
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();
      const teniaSesion = !!authStore.token;

      if (teniaSesion) {
        authStore.logout();
        const actual = router.currentRoute.value.fullPath;
        if (actual !== "/" && actual !== "/login") {
          router.replace({ path: "/", query: { redirect: actual } });
        }
      }
    }

    return Promise.reject(error);
  },
);

app.use(router);
app.mount("#app");
