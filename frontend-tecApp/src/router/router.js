import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth.js";

// E15: code-splitting. Cada layout/vista se carga bajo demanda para que el
// bundle inicial solo incluya auth + router. Inicio/Login/Registro se
// mantienen ansiosos porque son la puerta de entrada.
import Inicio from "../components/auth/Inicio.vue";
import Login from "../components/auth/Login.vue";
import Registro from "../components/auth/Registro.vue";
import Unauthorized from "../components/auth/Unauthorized.vue";

// Layouts Principales
const DashboardAdministrador = () =>
  import("../components/administrador/DashboardAdministrador.vue");
const DashboardAlumno = () => import("../components/alumno/DashboardAlumno.vue");

// Vistas del Alumno (Las nuevas versiones refactorizadas)
const InicioView = () => import("../components/alumno/views/InicioView.vue");
const NoticiasView = () => import("../components/alumno/views/NoticiaView.vue");
const CursosView = () => import("../components/alumno/views/CursosView.vue");
const ObjetosPerdidosView = () =>
  import("../components/alumno/views/ObjetosPerdidosView.vue");

// Biblioteca y otros
const Biblioteca = () => import("../components/bibliotecario/Biblioteca.vue");
const Libros = () => import("../components/bibliotecario/Libros.vue");
const BibliotecaRecursos = () =>
  import("../components/bibliotecario/BiblotecaRecursos.vue");
const PrestamosBiblotecario = () =>
  import("../components/bibliotecario/PrestamosBiblotecario.vue");
const BibliotecaDashboard = () =>
  import("../components/bibliotecario/BibliotecaDashboard.vue");

// Profesores
const DashboardProfesor = () =>
  import("../components/profesores/DashboardProfesor.vue");
const MateriasView = () =>
  import("../components/profesores/views/MateriasView.vue");
const AsistenciasView = () =>
  import("../components/profesores/views/AsistenciasView.vue");
const InicioViewProfesor = () =>
  import("../components/profesores/views/InicioView.vue");
const NoticiasViewProfesor = () =>
  import("../components/profesores/views/NoticiasView.vue");
const CursosViewProfesor = () =>
  import("../components/profesores/views/CursosView.vue");
const ComunicadosViewProfesor = () =>
  import("../components/profesores/views/ComunicadosView.vue");

// Preceptores
const DashboardPreceptor = () =>
  import("../components/preceptor/DashboardPreceptor.vue");
const CursosPreceptorView = () =>
  import("../components/preceptor/views/CursosPreceptorView.vue");
const AlumnosView = () => import("../components/preceptor/views/AlumnosView.vue");

// Libreta Digital
const LibretaAlumnoView = () =>
  import("../components/alumno/views/LibretaAlumnoView.vue");
const LibretaDigitalViewProfesor = () =>
  import("../components/profesores/views/LibretaDigitalView.vue");
const LibretaPreceptorView = () =>
  import("../components/preceptor/views/LibretaPreceptorView.vue");

// WhatsApp
const MensajesProfesorView = () =>
  import("../components/profesores/views/MensajesView.vue");
const MensajesPreceptorView = () =>
  import("../components/preceptor/views/MensajesView.vue");

// Planes de Estudio (consulta por rol)
const PlanEstudioViewProfesor = () =>
  import("../components/profesores/views/PlanEstudioView.vue");
const PlanEstudioViewPreceptor = () =>
  import("../components/preceptor/views/PlanEstudioView.vue");

const routes = [
  { path: "/", component: Inicio },
  { path: "/login", component: Login },
  { path: "/registro", component: Registro },
  { path: "/unauthorized", component: Unauthorized },

  // --- RUTA MODULAR DEL ALUMNO ---
  {
    path: "/alumno",
    component: DashboardAlumno, // El layout que contiene Sidebar y Topbar
    meta: { requiresAuth: true, role: "alumno" },

    children: [
      { path: "inicio", component: InicioView },
      { path: "noticias", component: NoticiasView },
      { path: "cursos", component: CursosView },
      { path: "libreta", component: LibretaAlumnoView },
      { path: "objetos-perdidos", component: ObjetosPerdidosView },
      { path: "", redirect: "/alumno/inicio" }, // Si entran a /alumno, van a inicio
    ],
  },

  // --- OTRAS RUTAS ---
  {
    path: "/dashboard-administrador",
    component: DashboardAdministrador,
    meta: { requiresAuth: true, role: "root" },
  },
  { path: "/biblioteca", component: Biblioteca, meta: { requiresAuth: true } },
  {
    path: "/biblioteca/libros",
    component: Libros,
    meta: { requiresAuth: true },
  },
  {
    path: "/biblioteca/recursos",
    component: BibliotecaRecursos,
    meta: { requiresAuth: true },
  },
  {
    path: "/biblioteca/prestamos",
    component: PrestamosBiblotecario,
    meta: { requiresAuth: true, role: "bibliotecario" },
  },
  {
    path: "/biblioteca/dashboard",
    component: BibliotecaDashboard,
    meta: { requiresAuth: true, role: "bibliotecario" },
  },
  // El perfil ahora vive dentro del dashboard (?vista=perfil) para no perder
  // el layout. Se mantiene la ruta vieja como redirección compatible.
  {
    path: "/perfil/administrador",
    redirect: { path: "/dashboard-administrador", query: { vista: "perfil" } },
  },

  {
    path: "/profesor",
    component: DashboardProfesor,
    meta: { requiresAuth: true, role: "profesor" },
    children: [
      { path: "inicio", component: InicioViewProfesor },
      { path: "noticias", component: NoticiasViewProfesor },
      { path: "comunicados", component: ComunicadosViewProfesor },
      { path: "cursos", component: CursosViewProfesor },
      { path: "materias", component: MateriasView },
      { path: "asistencias", component: AsistenciasView },
      { path: "libreta", component: LibretaDigitalViewProfesor },
      { path: "plan", component: PlanEstudioViewProfesor },
      { path: "mensajes", component: MensajesProfesorView },
      { path: "", redirect: "/profesor/inicio" }, // Si entran a /alumno, van a inicio
    ],
  },
  
  // --- PRECEPTOR ---
  {
    path: "/preceptor",
    component: DashboardPreceptor,
    meta: { requiresAuth: true, role: "preceptor" },

    children: [

      {
        path: "cursos",
        component: CursosPreceptorView,
      },

      {
        path: "libreta",
        component: LibretaPreceptorView,
      },

      {
        path: "plan",
        component: PlanEstudioViewPreceptor,
      },

      {
        path: "boletines",
        redirect: "/preceptor/libreta",
      },

      {
        path: "alumnos/:id_curso",
        component: AlumnosView,
      },

      {
        path: "mensajes",
        component: MensajesPreceptorView,
      },

      {
        path: "",
        redirect: "/preceptor/cursos",
      },

    ],
  },

  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory('/frontend-tecApp/'),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.estaAutenticado) {
    return next("/");
  }

  if (to.meta.role && authStore.rol !== to.meta.role && authStore.rol !== "root") {
    return next("/unauthorized");
  }

  next();
});

export default router;
