<template>
    <div class="dash-wrapper" @keydown.esc="cerrarSidebarMovil">
        <Topbar
            :current-page="nombrePagina(currentView)"
            :sidebar-abierto="menuAbierto"
            @toggle-sidebar="alternarSidebar"
            @ir-inicio="setView('overview')"
            @ir-perfil="setView('perfil')"
        />

        <div class="dash" :class="{ 'sidebar-colapsado': sidebarColapsado }">
            <Sidebar
                ref="sidebarRef"
                :vista-actual="currentView"
                :colapsado="sidebarColapsado && !esMovil"
                :movil-abierto="sidebarMovilAbierto"
                :nav-inerte="esMovil && !sidebarMovilAbierto"
                @cambiar-vista="setView"
                @cerrar-movil="cerrarSidebarMovil"
            />

            <div
                v-if="sidebarMovilAbierto"
                class="drawer-overlay"
                aria-hidden="true"
                @click="cerrarSidebarMovil"
            ></div>

            <main class="main" aria-label="Panel de administración">
                <div class="content" ref="contentRef" tabindex="-1">
                    <keep-alive>
                      <component
                        :is="componentesMap[currentView]"
                        @cambiar-vista="setView"
                      />
                    </keep-alive>
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";

import Sidebar from "./views/Sidebar.vue";
import Topbar from "./views/Topbar.vue";
import { useComunicacionStore } from "../../stores/comunicacion.js";
import Overview from "./views/Overview.vue";
import RolesView from "./views/RolesView.vue";
import AlumnosView from "./views/AlumnosView.vue";
import ProfesoresView from "./views/ProfesoresView.vue";
import CursosView from "./views/CursosView.vue";
import ComunicacionView from "./views/ComunicacionView.vue";
import AsignacionesView from "./views/AsignacionesView.vue";
import MateriasView from "./views/MateriasView.vue";
import PlanesEstudioView from "./views/PlanesEstudioView.vue";
import LibretaAdminView from "./views/LibretaAdminView.vue";
import BoletinesAdminView from "./views/BoletinesAdminView.vue";
import PersonalView from "./views/PersonalView.vue";
import UsuariosView from "./views/UsuariosView.vue";
import AsistenciasView from "./views/AsistenciasView.vue";
import AuditoriaView from "./views/AuditoriaView.vue";
import ReportesView from "./views/ReportesView.vue";
import ConfigView from "./views/ConfigView.vue";
import HorariosView from "./views/HorariosView.vue";
import ConvivenciaView from "./views/ConvivenciaView.vue";
import BibliotecaView from "./views/BibliotecaView.vue";
import ObjetosView from "./views/ObjetosView.vue";
import NotificacionesView from "./views/NotificacionesView.vue";
import CertificadosView from "./views/CertificadosView.vue";
import BackupView from "./views/BackupView.vue";
import UsuarioPerfil from "./views/UsuarioPerfil.vue";

const componentesMap = {
  overview: Overview,
  roles: RolesView,
  alumnos: AlumnosView,
  profesores: ProfesoresView,
  cursos: CursosView,
  comunicacion: ComunicacionView,
  asignaciones: AsignacionesView,
  materias: MateriasView,
  planes: PlanesEstudioView,
  libreta: LibretaAdminView,
  boletines: BoletinesAdminView,
  personal: PersonalView,
  usuarios: UsuariosView,
  asistencias: AsistenciasView,
  auditoria: AuditoriaView,
  reportes: ReportesView,
  config: ConfigView,
  horarios: HorariosView,
  convivencia: ConvivenciaView,
  biblioteca: BibliotecaView,
  objetos: ObjetosView,
  notificaciones: NotificacionesView,
  certificados: CertificadosView,
  backup: BackupView,
  perfil: UsuarioPerfil,
};
const VISTAS_VALIDAS = Object.keys(componentesMap);
const pageNames = {
  overview: "Inicio",
  roles: "Roles y permisos",
  alumnos: "Alumnos",
  profesores: "Profesores",
  cursos: "Cursos",
  comunicacion: "Comunicación",
  asignaciones: "Asignaciones de Materias",
  materias: "Materias",
  planes: "Planes de Estudio",
  libreta: "Libreta Digital",
  boletines: "Boletines",
  personal: "Personal",
  usuarios: "Usuarios",
  asistencias: "Asistencias",
  auditoria: "Auditoría",
  reportes: "Reportes",
  config: "Configuración",
  horarios: "Horarios",
  convivencia: "Convivencia",
  biblioteca: "Biblioteca",
  objetos: "Objetos perdidos",
  notificaciones: "Notificaciones",
  certificados: "Certificados",
  backup: "Backup",
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
const contentRef = ref(null);
const sidebarRef = ref(null);
const comunicacion = useComunicacionStore();

// Alias legacy hacia las tabs de Comunicación (ver ComunicacionView).
const ALIAS_COMUNICACION = {
    noticias: "noticias",
    comunicados: "comunicados",
    mensajes: "mensajes",
    monitorcorreos: "emails",
};

const setView = (vista) => {
    // Las vistas sueltas de comunicación (noticias/comunicados/mensajes/emails)
    // ahora viven como tabs de Comunicación (ver ComunicacionView).
    if (typeof vista === "string" && vista in ALIAS_COMUNICACION) {
        comunicacion.solicitarTab(ALIAS_COMUNICACION[vista]);
        currentView.value = "comunicacion";
        router.replace({
            query: { ...route.query, vista: "comunicacion", tab: ALIAS_COMUNICACION[vista] },
        });
    } else {
        currentView.value = VISTAS_VALIDAS.includes(vista) ? vista : "overview";
    }
    sidebarMovilAbierto.value = false; // al navegar se cierra el drawer móvil
    nextTick(() => contentRef.value?.focus({ preventScroll: true }));
};

// Estado → URL (reemplaza el query sin recargar)
watch(currentView, (vista) => {
    const query = { ...route.query };
    if (vista === "overview") {
        delete query.vista;
    } else {
        query.vista = vista;
    }
    // El tab solo aplica a los contenedores con pestañas (hoy, Comunicación).
    if (vista !== "comunicacion") delete query.tab;
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
const esMovil = ref(false);
const menuAbierto = computed(() =>
    esMovil.value ? sidebarMovilAbierto.value : !sidebarColapsado.value,
);

const esPantallaMovil = () =>
    window.matchMedia("(max-width: 768px)").matches;

const alternarSidebar = () => {
    if (esPantallaMovil()) {
        sidebarMovilAbierto.value = !sidebarMovilAbierto.value;
        if (sidebarMovilAbierto.value) {
            nextTick(() => sidebarRef.value?.$el?.querySelector(".sidebar-search input")?.focus());
        }
    } else {
        sidebarColapsado.value = !sidebarColapsado.value;
    }
};

const cerrarSidebarMovil = () => {
    if (!sidebarMovilAbierto.value) return;
    sidebarMovilAbierto.value = false;
    nextTick(() => contentRef.value?.focus({ preventScroll: true }));
};

onMounted(() => {
    esMovil.value = esPantallaMovil();
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (guardado !== null) sidebarColapsado.value = guardado === "true";
});

watch(sidebarColapsado, (v) => {
    localStorage.setItem(CLAVE_STORAGE, String(v));
});

// Si se pasa a desktop con el drawer abierto, cerrarlo
const onCambioMedia = () => {
    esMovil.value = esPantallaMovil();
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
