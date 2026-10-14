import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

// ==============================
// LAYOUTS PRINCIPALES
// ==============================

import DashboardAdministrador from "../components/administrador/DashboardAdministrador.vue";
import DashboardAlumno from "../components/alumno/DashboardAlumno.vue";
import DashboardProfesor from "../components/profesores/DashboardProfesor.vue";
import DashboardPreceptor from "../components/preceptores/DashboardPreceptor.vue";

// ==============================
// AUTH
// ==============================

import Inicio from "../components/auth/Inicio.vue";
import Login from "../components/auth/Login.vue";
import Registro from "../components/auth/Registro.vue";
import Unauthorized from "../components/auth/Unauthorized.vue";

// ==============================
// ADMINISTRADOR
// ==============================

import UsuarioPerfil from "../components/administrador/views/UsuarioPerfil.vue";

// ==============================
// ALUMNO
// ==============================

import InicioView from "../components/alumno/views/InicioView.vue";
import NoticiasView from "../components/alumno/views/NoticiaView.vue";
import CursosView from "../components/alumno/views/CursosView.vue";
import ObjetosPerdidosView from "../components/alumno/views/ObjetosPerdidosView.vue";

// ==============================
// BIBLIOTECA
// ==============================

import Biblioteca from "../components/bibliotecario/Biblioteca.vue";
import Libros from "../components/bibliotecario/Libros.vue";
import BibliotecaRecursos from "../components/bibliotecario/BiblotecaRecursos.vue";
import PrestamosBiblotecario from "../components/bibliotecario/PrestamosBiblotecario.vue";
import BibliotecaDashboard from "../components/bibliotecario/BibliotecaDashboard.vue";

// ==============================
// PROFESOR
// ==============================

import MateriasView from "../components/profesores/views/MateriasView.vue";
import AsistenciasViewProfesor from "../components/profesores/views/AsistenciasView.vue";
import InicioViewProfesor from "../components/profesores/views/InicioView.vue";
import NoticiasViewProfesor from "../components/profesores/views/NoticiasView.vue";
import CursosViewProfesor from "../components/profesores/views/CursosView.vue";
import ComunicadosViewProfesor from "../components/profesores/views/ComunicadosView.vue";

// ==============================
// PRECEPTOR
// ==============================

import CursosPreceptorView from "../components/preceptores/views/CursosPreceptorView.vue";
import AlumnosView from "../components/preceptores/views/AlumnosView.vue";
import ComunicadosViewPreceptor from "../components/preceptores/views/ComunicadosView.vue";
import BoletinesAlumnosView from "../components/preceptores/views/BoletinesAlumnosView.vue";
import AsistenciasViewPreceptor from "../components/preceptores/views/AsistenciasView.vue";

// ==============================
// RUTAS
// ==============================

const routes = [
  // ------------------------------
  // AUTH
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
  // ADMINISTRADOR
  // ------------------------------

  {
    path: "/dashboard-administrador",
    component: DashboardAdministrador,
    meta: {
      requiresAuth: true,
      role: "root",
    },
  },
  {
    path: "/perfil/administrador",
    component: UsuarioPerfil,
    meta: {
      requiresAuth: true,
    },
  },

  // ------------------------------
  // ALUMNO
  // ------------------------------

  {
    path: "/alumno",
    component: DashboardAlumno,
  //  meta: {
  //    requiresAuth: true,
   //   role: "alumno",
   // },
    children: [
      {
        path: "inicio",
        component: InicioView,
      },
      {
        path: "noticias",
        component: NoticiasView,
      },
      {
        path: "cursos",
        component: CursosView,
      },
      {
        path: "objetos-perdidos",
        component: ObjetosPerdidosView,
      },
      {
        path: "",
        redirect: "/alumno/inicio",
      },
    ],
  },

  // ------------------------------
  // BIBLIOTECA
  // ------------------------------

  {
    path: "/biblioteca",
    component: Biblioteca,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/biblioteca/libros",
    component: Libros,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/biblioteca/recursos",
    component: BibliotecaRecursos,
    meta: {
      requiresAuth: true,
    },
  },
  {
    path: "/biblioteca/prestamos",
    component: PrestamosBiblotecario,
    meta: {
      requiresAuth: true,
      role: "bibliotecario",
    },
  },
  {
    path: "/biblioteca/dashboard",
    component: BibliotecaDashboard,
    meta: {
      requiresAuth: true,
      role: "bibliotecario",
    },
  },

  // ------------------------------
  // PROFESOR
  // ------------------------------

  {
    path: "/profesor",
    component: DashboardProfesor,
    meta: {
      requiresAuth: true,
      role: "profesor",
    },
    children: [
      {
        path: "inicio",
        component: InicioViewProfesor,
      },
      {
        path: "noticias",
        component: NoticiasViewProfesor,
      },
      {
        path: "comunicados",
        component: ComunicadosViewProfesor,
      },
      {
        path: "cursos",
        component: CursosViewProfesor,
      },
      {
        path: "materias",
        component: MateriasView,
      },
      {
        path: "asistencias",
        component: AsistenciasViewProfesor,
      },
      {
        path: "",
        redirect: "/profesor/inicio",
      },
    ],
  },

  // ------------------------------
  // PRECEPTOR
  // ------------------------------

  {
    path: "/preceptor",
    component: DashboardPreceptor,

    // Se mantiene sin restricciones de rol
    // por ahora, como en el router anterior.

    children: [
      {
        path: "",
        redirect: "/preceptor/cursos",
      },
      {
        path: "cursos",
        component: CursosPreceptorView,
      },
      {
        path: "alumnos/:id_curso",
        component: AlumnosView,
      },
      {
        path: "boletines/:id_curso",
        component: BoletinesAlumnosView,
      },
      {
        path: "comunicados",
        component: ComunicadosViewPreceptor,
      },
      {
        path: "asistencias",
        component: AsistenciasViewPreceptor,
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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.estaAutenticado) {
    return next("/");
  }

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
