<template>
    <div class="dash-wrapper" role="main" aria-label="Panel de administración del sistema de gestión escolar">
        <Topbar
            :current-page="nombrePagina(currentView)"
            @toggle-sidebar="alternarSidebar"
            @ir-inicio="setView('overview')"
            @ir-perfil="setView('perfil')"
        />

        <div class="dash" :class="{ 'sidebar-colapsado': sidebarColapsado }">
            <Sidebar
                :vista-actual="currentView"
                :colapsado="sidebarColapsado"
                :movil-abierto="sidebarMovilAbierto"
                @cambiar-vista="setView"
            />

            <div
                v-if="sidebarMovilAbierto"
                class="drawer-overlay"
                aria-hidden="true"
                @click="sidebarMovilAbierto = false"
            ></div>

            <div class="main">
                <div class="content">
                    <keep-alive>
                      <component
                        :is="componentesMap[currentView]"
                        @cambiar-vista="setView"
                      />
                    </keep-alive>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import Sidebar from "./views/Sidebar.vue";
import Topbar from "./views/Topbar.vue";
import Overview from "./views/Overview.vue";
import RolesView from "./views/RolesView.vue";
import MonitorCorreos from "./views/MonitorCorreos.vue";
import AlumnosView from "./views/AlumnosView.vue";
import ProfesoresView from "./views/ProfesoresView.vue";
import CursosView from "./views/CursosView.vue";
import NoticiasView from "./views/NoticiasView.vue";
import ComunicadosView from "./views/ComunicadosView.vue";
import AsignacionesView from "./views/AsignacionesView.vue";
import MateriasView from "./views/MateriasView.vue";
import PlanesEstudioView from "./views/PlanesEstudioView.vue";
import LibretaAdminView from "./views/LibretaAdminView.vue";
import PersonalView from "./views/PersonalView.vue";
import UsuariosView from "./views/UsuariosView.vue";
import AsistenciasView from "./views/AsistenciasView.vue";
import MensajesView from "./views/MensajesView.vue";
import AuditoriaView from "./views/AuditoriaView.vue";
import ReportesView from "./views/ReportesView.vue";
import ConfigView from "./views/ConfigView.vue";
import HorariosView from "./views/HorariosView.vue";
import ConvivenciaView from "./views/ConvivenciaView.vue";
import BibliotecaView from "./views/BibliotecaView.vue";
import ObjetosView from "./views/ObjetosView.vue";
import NotificacionesView from "./views/NotificacionesView.vue";
import UsuarioPerfil from "./views/UsuarioPerfil.vue";

const componentesMap = {
  overview: Overview,
  monitorcorreos: MonitorCorreos,
  roles: RolesView,
  alumnos: AlumnosView,
  profesores: ProfesoresView,
  cursos: CursosView,
  noticias: NoticiasView,
  comunicados: ComunicadosView,
  asignaciones: AsignacionesView,
  materias: MateriasView,
  planes: PlanesEstudioView,
  libreta: LibretaAdminView,
  personal: PersonalView,
  usuarios: UsuariosView,
  asistencias: AsistenciasView,
  mensajes: MensajesView,
  auditoria: AuditoriaView,
  reportes: ReportesView,
  config: ConfigView,
  horarios: HorariosView,
  convivencia: ConvivenciaView,
  biblioteca: BibliotecaView,
  objetos: ObjetosView,
  notificaciones: NotificacionesView,
  perfil: UsuarioPerfil,
};
const VISTAS_VALIDAS = Object.keys(componentesMap);
const pageNames = {
  overview: "Inicio",
  monitorcorreos: "Historial de Emails",
  roles: "Roles y permisos",
  alumnos: "Alumnos",
  profesores: "Profesores",
  cursos: "Cursos",
  noticias: "Noticias",
  comunicados: "Comunicados",
  asignaciones: "Asignaciones de Materias",
  materias: "Materias",
  planes: "Planes de Estudio",
  libreta: "Libreta Digital",
  personal: "Personal",
  usuarios: "Usuarios",
  asistencias: "Asistencias",
  mensajes: "WhatsApp",
  auditoria: "Auditoría",
  reportes: "Reportes",
  config: "Configuración",
  horarios: "Horarios",
  convivencia: "Convivencia",
  biblioteca: "Biblioteca",
  objetos: "Objetos perdidos",
  notificaciones: "Notificaciones",
  perfil: "Mi Perfil",
};
const nombrePagina = (vista) => pageNames[vista] || "Inicio";

const route = useRoute();
const router = useRouter();

// ── Vista sincronizada con la URL (?vista=alumnos) ──────────────────────────
const vistaInicial = VISTAS_VALIDAS.includes(route.query.vista)
    ? route.query.vista
    : "overview";
const currentView = ref(vistaInicial);

const setView = (vista) => {
    currentView.value = VISTAS_VALIDAS.includes(vista) ? vista : "overview";
    sidebarMovilAbierto.value = false; // al navegar se cierra el drawer móvil
};

// Estado → URL (reemplaza el query sin recargar)
watch(currentView, (vista) => {
    const query = { ...route.query };
    if (vista === "overview") {
        delete query.vista;
    } else {
        query.vista = vista;
    }
    router.replace({ query });
});

// URL → Estado (soporta atrás/adelante del navegador)
watch(
    () => route.query.vista,
    (v) => {
        const vista = VISTAS_VALIDAS.includes(v) ? v : "overview";
        if (vista !== currentView.value) currentView.value = vista;
    },
);

// ── Sidebar: colapsado (desktop) y drawer (móvil) ───────────────────────────
const CLAVE_STORAGE = "admin-sidebar-colapsado";
const sidebarColapsado = ref(false);
const sidebarMovilAbierto = ref(false);

const esPantallaMovil = () =>
    window.matchMedia("(max-width: 768px)").matches;

const alternarSidebar = () => {
    if (esPantallaMovil()) {
        sidebarMovilAbierto.value = !sidebarMovilAbierto.value;
    } else {
        sidebarColapsado.value = !sidebarColapsado.value;
    }
};

onMounted(() => {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (guardado !== null) sidebarColapsado.value = guardado === "true";
});

watch(sidebarColapsado, (v) => {
    localStorage.setItem(CLAVE_STORAGE, String(v));
});

// Si se pasa a desktop con el drawer abierto, cerrarlo
const onCambioMedia = () => {
    if (!esPantallaMovil()) sidebarMovilAbierto.value = false;
};
onMounted(() =>
    window.addEventListener("resize", onCambioMedia, { passive: true }),
);
onUnmounted(() => window.removeEventListener("resize", onCambioMedia));
</script>

<style scoped>
.dash-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    max-width: 100vw;
    background: var(--color-background-tertiary, #f8f9fa);
    font-size: 13px;
    box-sizing: border-box;
    overflow-x: hidden;
}

.dash {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    flex: 1;
    width: 100%;
    min-width: 0;
    position: relative;
}

.dash.sidebar-colapsado {
    grid-template-columns: 72px minmax(0, 1fr);
}

.drawer-overlay {
    display: none;
}

.main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    width: 100%;
    overflow: hidden;
}

.content {
    padding: 16px 20px;
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    box-sizing: border-box;
}

.content > * {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
}

/* ── Móvil: drawer lateral ─────────────────────────────────────────────── */
@media (max-width: 768px) {
    .dash {
        grid-template-columns: minmax(0, 1fr);
    }

    .drawer-overlay {
        display: block;
        position: fixed;
        top: 64px; /* debajo del Topbar */
        inset: 64px 0 0 0;
        background: rgba(0, 0, 0, 0.35);
        z-index: 90;
    }

    .content {
        padding: 12px;
    }
}
</style>
