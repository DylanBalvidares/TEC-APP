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
            <RoleSidebar id="sidebar-profesor" label="Secciones del docente" :groups="navigationByRole.profesor" :open="sidebarAbierto" :collapsed="sidebarColapsado" @close="closeSidebar">
              <template #footer>
                <div class="role-sidebar-help"><i class="fas fa-circle-question" aria-hidden="true"></i><span><strong>¿Necesitás ayuda?</strong><small>Pixelina resolverá tu consulta.</small></span></div>
              </template>
            </RoleSidebar>

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
                    <div class="prof-header-stats" :aria-busy="cargandoStatsHeader">
                        <div class="hs-item">
                            <span class="hs-num">{{ cargandoStatsHeader ? "…" : statsCursos }}</span>
                            <span class="hs-label">Cursos</span>
                        </div>
                        <div class="hs-divider"></div>
                        <div class="hs-item">
                            <span class="hs-num">{{ cargandoStatsHeader ? "…" : statsMaterias }}</span>
                            <span class="hs-label">Materias</span>
                        </div>
                    </div>
                </header>

                <AnimatedRouterView :depth="1" />
            </main>
        </div>
        <UserProfileDialog v-model="openProfile" :edit="editingProfile" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import AppTopbar from "../ui/AppTopbar.vue";
import AnimatedRouterView from "../ui/AnimatedRouterView.vue";
import RoleSidebar from "../ui/RoleSidebar.vue";
import { navigationByRole } from "../../config/role-navigation.js";
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
const cargandoStatsHeader = ref(true);
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
    } finally {
        cargandoStatsHeader.value = false;
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
  .role-sidebar.collapsed { width: 72px; min-width: 72px; }
}
</style>
