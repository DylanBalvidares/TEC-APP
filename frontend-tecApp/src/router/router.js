
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

// ==============================
// AUTH
// ==============================

import Inicio from "../components/auth/Inicio.vue";
import Login from "../components/auth/Login.vue";
import Registro from "../components/auth/Registro.vue";
import Unauthorized from "../components/auth/Unauthorized.vue";

// ==============================
// PRECEPTOR
// ==============================

import DashboardPreceptor from "../components/preceptores/DashboardPreceptor.vue";
import CursosPreceptorView from "../components/preceptores/views/CursosPreceptorView.vue";
import AlumnosView from "../components/preceptores/views/AlumnosView.vue";
import ComunicadosView from "../components/preceptores/views/ComunicadosView.vue";

// ==============================
// RUTAS
// ==============================

const routes = [

  // ------------------------------
  // Páginas de autenticación
  // ------------------------------

  {
    path: "/",
    component: Inicio,
  },

  {
    path: "/login",
    component: Login,
  },

  {
    path: "/registro",
    component: Registro,
  },

  {
    path: "/unauthorized",
    component: Unauthorized,
  },

  // ------------------------------
  // PRECEPTOR
  // ------------------------------

  {
    path: "/preceptor",
    component: DashboardPreceptor,

    // IMPORTANTE:
    // Por ahora NO ponemos:
    // requiresAuth: true
    // role: "preceptor"
    //
    // Así podemos entrar directamente
    // mientras desarrollamos el panel.

    children: [

      {
        path: "cursos",
        component: CursosPreceptorView,
      },

      {
        path: "alumnos/:id_curso",
        component: AlumnosView,
      },

      {
        path: "comunicados",
        component: ComunicadosView,
      },
    ],
  },

  // ------------------------------
  // RUTA NO ENCONTRADA
  // ------------------------------

  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },

];

// ==============================
// CREAR ROUTER
// ==============================

const router = createRouter({
  history: createWebHistory("/frontend-tecApp/"),
  routes,
});

// ==============================
// GUARD DE AUTENTICACIÓN
// ==============================
//
// Lo dejamos funcionando para las demás
// rutas, pero Preceptor no tiene meta de
// autenticación por ahora.
//
// Cuando hagamos el login del Preceptor,
// volvemos a agregar:
// requiresAuth: true
// role: "preceptor"
// ==============================

router.beforeEach((to, from, next) => {

  const authStore = useAuthStore();

  // Verificar autenticación solamente
  // si la ruta la requiere.
  if (to.meta.requiresAuth && !authStore.estaAutenticado) {
    return next("/");
  }

  // Verificar rol solamente si la ruta
  // tiene un rol definido.
  if (
    to.meta.role &&
    authStore.rol !== to.meta.role &&
    authStore.rol !== "root"
  ) {
    return next("/unauthorized");
  }

  next();
});

export default router;
