<template>
    <div class="docente-wrapper">
        <AppTopbar
            :current-page="currentPage"
            :sidebar-abierto="sidebarAbierto"
            sidebar-id="sidebar-profesor"
            @toggle-sidebar="toggleSidebar"
            @ir-inicio="router.push('/profesor/inicio')"
            @ver-perfil="abrirPerfil(false)"
        />

        <div class="container">
            <div class="sidebar-overlay" :class="{ visible: sidebarAbierto }" @click="closeSidebar()"></div>
            <aside id="sidebar-profesor" class="sidebar" :class="{ abierto: sidebarAbierto, colapsado: sidebarColapsado }">
                <nav class="sidebar-nav" aria-label="Secciones del docente">
                  <section class="sidebar-group">
                    <h2 class="sidebar-section">Inicio</h2>
                    <ul>
                    <li @click="closeSidebar()">
                        <RouterLink to="/profesor/inicio" active-class="active" aria-label="Inicio">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12l9-8 9 8v8a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Inicio
                        </RouterLink>
                    </li>
                    </ul>
                  </section>
                  <section class="sidebar-group">
                    <h2 class="sidebar-section">Comunicación</h2>
                    <ul>
                    <li @click="closeSidebar()">
                        <RouterLink to="/profesor/noticias" active-class="active" aria-label="Noticias">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 8V7a2 2 0 00-2-2H5a2 2 0 00-2 2v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.2"/></svg>
                            Noticias
                        </RouterLink>
                    </li>
                    <li @click="closeSidebar()">
                        <RouterLink to="/profesor/comunicados" active-class="active" aria-label="Comunicados">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Comunicados
                        </RouterLink>
                    </li>
                    </ul>
                  </section>
                  <section class="sidebar-group">
                    <h2 class="sidebar-section">Mis cursos · Académico</h2>
                    <ul>
                    <li @click="closeSidebar()">
                        <RouterLink to="/profesor/cursos" active-class="active" aria-label="Mis Cursos">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3L2 9l10 6 10-6-10-6zM2 15l10 6 10-6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Mis Cursos
                        </RouterLink>
                    </li>
                    <li @click="closeSidebar()">
                        <RouterLink to="/profesor/materias" active-class="active" aria-label="Mis Materias">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Mis Materias
                        </RouterLink>
                    </li>
                    <li @click="closeSidebar()">
                        <RouterLink to="/profesor/asistencias" active-class="active" aria-label="Asistencias">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Asistencias
                        </RouterLink>
                    </li>
                    <li @click="closeSidebar()">
                        <RouterLink to="/profesor/libreta" active-class="active" aria-label="Libreta Digital">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Libreta Digital
                        </RouterLink>
                    </li>
                    <li @click="closeSidebar()">
                        <RouterLink to="/profesor/boletines" active-class="active" aria-label="Boletines">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 12h6m-6 4h6M9 8h6M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Boletines
                        </RouterLink>
                    </li>
                    <li @click="closeSidebar()">
                        <RouterLink to="/profesor/plan" active-class="active" aria-label="Plan de Estudios">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Plan de Estudios
                        </RouterLink>
                    </li>
                    </ul>
                  </section>
                  <section class="sidebar-group">
                    <h2 class="sidebar-section">Mensajería</h2>
                    <ul>
                      <li @click="closeSidebar()">
                          <RouterLink to="/profesor/mensajes" active-class="active" aria-label="WhatsApp">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 11.5a8.5 8.5 0 01-12.4 7.5L3 21l2-5.4A8.5 8.5 0 1121 11.5z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                              WhatsApp
                          </RouterLink>
                      </li>
                    </ul>
                  </section>
                </nav>

                <div class="sidebar-help">
                    <i class="fas fa-circle-question"></i>
                    <div>
                        <p class="help-title">¿Necesitás ayuda?</p>
                        <p class="help-sub">Pixelina resolverá tu consulta.</p>
                    </div>
                </div>
            </aside>

            <main class="main-content">
                <header class="prof-header">
                    <div class="prof-header-left">
                        <div class="prof-avatar-wrap">
                            <img :src="avatarUrl" alt="Avatar profesor" />
                            <span class="prof-status-dot"></span>
                        </div>
                        <div class="prof-info">
                            <p class="prof-label">DOCENTE ACTIVO</p>
                            <h1>{{ userName }}</h1>
                            <p class="prof-sub">{{ profSubtitulo }}</p>
                        </div>
                    </div>
                    <div class="prof-header-stats">
                        <div class="hs-item">
                            <span class="hs-num">{{ statsCursos }}</span>
                            <span class="hs-label">Cursos</span>
                        </div>
                        <div class="hs-divider"></div>
                        <div class="hs-item">
                            <span class="hs-num">{{ statsMaterias }}</span>
                            <span class="hs-label">Materias</span>
                        </div>
                    </div>
                </header>

                <router-view></router-view>
            </main>
        </div>
        <UserProfileDialog v-model="openProfile" :edit="editingProfile" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import AppTopbar from "../ui/AppTopbar.vue";
import UserProfileDialog from "../ui/UserProfileDialog.vue";
import { useResponsiveSidebar } from "../../composables/useResponsiveSidebar.js";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import { obtenerAsignacionesProfesor } from "@/services/academico-service.js";
import { resolverIdProfesor } from "@/composables/useProfesor.js";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const { sidebarOpen: sidebarAbierto, desktopCollapsed: sidebarColapsado, toggleSidebar, closeSidebar } = useResponsiveSidebar();

const userName = computed(() => authStore.usuario?.nombre || "Juan Pérez");
const avatarUrl = computed(() => `https://ui-avatars.com/api/?name=${userName.value.split(" ").join("+")}&background=c0152a&color=fff`);

// Stats del header
const asignacionesHeader = ref([]);
const statsCursos = computed(() => {
    const map = new Map();
    asignacionesHeader.value.forEach(a => {
        if (a.cursoAsignacion) map.set(a.cursoAsignacion.id_curso, true);
    });
    return map.size;
});
const statsMaterias = computed(() => asignacionesHeader.value.length);
const profSubtitulo = computed(() => {
    if (asignacionesHeader.value.length === 0) return 'Profesor Titular';
    const primera = asignacionesHeader.value[0]?.materiaAsignacion?.nombre_materia || '';
    const total = asignacionesHeader.value.length;
    return primera ? `${primera} · ${total} ${total === 1 ? 'materia' : 'materias'}` : 'Profesor Titular';
});

const cargarStatsHeader = async () => {
    try {
        const idProfesor = await resolverIdProfesor();
        if (!idProfesor) return;
        const res = await obtenerAsignacionesProfesor(idProfesor);
        if (res.success && res.data) {
            asignacionesHeader.value = res.data;
        }
    } catch (e) {
        console.warn('DashboardProfesor: no se pudieron cargar stats', e);
    }
};

const openProfile = ref(false);
const editingProfile = ref(false);
const currentPage = computed(() => ({ inicio: 'Inicio', noticias: 'Noticias', comunicados: 'Comunicados', cursos: 'Cursos', materias: 'Materias', asistencias: 'Asistencias', libreta: 'Libreta Digital', boletines: 'Boletines', plan: 'Plan de Estudios', mensajes: 'WhatsApp' }[route.path.split('/').filter(Boolean).at(-1)] || 'Inicio'));
const abrirPerfil = (edit) => { editingProfile.value = edit; openProfile.value = true; };

onMounted(() => {
    cargarStatsHeader();
});

const cerrarSesion = () => {
    authStore.logout();
    router.push("/");
};

</script>


<style scoped src="./profesores.css"></style>
<style scoped>
@media (min-width: 901px) {
  .sidebar.colapsado { width: 0; min-width: 0; padding: 0; overflow: hidden; box-shadow: none; transition: width .25s ease, padding .25s ease; }
  .sidebar.colapsado > * { visibility: hidden; }
}
</style>
