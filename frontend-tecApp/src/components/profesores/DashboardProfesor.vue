<template>
    <div class="docente-wrapper">
        <nav class="navbar">
            <div class="nav-izquierda">
                <button class="hamburger-btn" @click="sidebarAbierto = !sidebarAbierto">
                    <i class="fas fa-bars"></i>
                </button>
                <div class="logo">
                    <img src="/logoEscuela.png" width="48" height="48" alt="Logo" />
                    <div class="logo-titulo">
                        <h2>Gestión Escolar</h2>
                        <p>Panel docente</p>
                    </div>
                </div>
            </div>

                <div class="profile-container" ref="profileContainer">
                <button class="profile-trigger" @click.stop="toggleProfileMenu" :aria-expanded="profileMenuOpen" aria-haspopup="true">
                    <img :src="avatarUrl" alt="Avatar" />
                </button>
                <div class="profile-menu" :class="{ active: profileMenuOpen }">
                    <div class="menu-header">
                        <img :src="avatarUrl" class="large-avatar" alt="Avatar grande" />
                        <p class="user-name">{{ userName }}</p>
                        <p class="user-email">{{ userEmail }}</p>
                    </div>
                    <hr />
                    <div class="menu-body">
                        <p class="user-role">Rol: <span id="roleBadge">Profesor</span></p>
                        <button type="button" class="menu-item" @click="openProfile = true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Mi Perfil
                        </button>
                    </div>
                    <hr />
                    <button class="sign-out-btn" @click="cerrarSesion">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        &nbsp;Cerrar sesión
                    </button>
                </div>
            </div>
        </nav>

        <div class="container">
            <div class="sidebar-overlay" :class="{ visible: sidebarAbierto }" @click="sidebarAbierto = false"></div>
            <aside class="sidebar" :class="{ abierto: sidebarAbierto }">
                <ul>
                    <li @click="sidebarAbierto = false">
                        <RouterLink to="/profesor/inicio" active-class="active" aria-label="Inicio">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M3 12l9-8 9 8v8a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1v-8z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Inicio
                        </RouterLink>
                    </li>
                    <li @click="sidebarAbierto = false">
                        <RouterLink to="/profesor/noticias" active-class="active" aria-label="Noticias">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 8V7a2 2 0 00-2-2H5a2 2 0 00-2 2v1" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.2"/></svg>
                            Noticias
                        </RouterLink>
                    </li>
                    <li @click="sidebarAbierto = false">
                        <RouterLink to="/profesor/cursos" active-class="active" aria-label="Mis Cursos">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3L2 9l10 6 10-6-10-6zM2 15l10 6 10-6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Mis Cursos
                        </RouterLink>
                    </li>
                    <li @click="sidebarAbierto = false">
                        <RouterLink to="/profesor/comunicados" active-class="active" aria-label="Comunicados">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 4h16v16H4z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Comunicados
                        </RouterLink>
                    </li>
                    <li @click="sidebarAbierto = false">
                        <RouterLink to="/profesor/materias" active-class="active" aria-label="Mis Materias">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Mis Materias
                        </RouterLink>
                    </li>
                    <li @click="sidebarAbierto = false">
                        <RouterLink to="/profesor/asistencias" active-class="active" aria-label="Asistencias">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M9 11l3 3L22 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                            Asistencias
                        </RouterLink>
                    </li>
                </ul>

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
        <Modal v-model="openProfile" title="Mi Perfil" wide>
            <div class="perfil-modal-body">
                <div class="perfil-layout">
                    <div class="perfil-avatar-wrapper">
                        <img :src="avatarUrl" alt="Avatar" class="perfil-avatar-lg" />
                    </div>
                    <div class="perfil-info">
                        <template v-if="!editingProfile">
                            <h3 class="perfil-name">{{ userName }}</h3>
                            <p class="perfil-email">{{ userEmail }}</p>
                            <p class="perfil-role">
                                <span class="role-badge">Rol: Profesor</span>
                            </p>
                        </template>
                        <template v-else>
                            <div v-if="perfilFeedback" :class="['feedback-msg', perfilFeedbackTipo === 'error' ? 'feedback-error' : 'feedback-success']">
                                <i :class="perfilFeedbackTipo === 'error' ? 'ti ti-alert-circle' : 'ti ti-check'"></i>
                                {{ perfilFeedback }}
                            </div>
                            <div class="form-group">
                                <label>Nombre completo</label>
                                <input type="text" v-model="editProfile.nombre" class="perfil-input" />
                            </div>
                            <div class="form-group" style="margin-top:12px">
                                <label>Email</label>
                                <input type="email" v-model="editProfile.email" class="perfil-input" />
                            </div>
                        </template>
                    </div>
                </div>
            </div>
            <template #footer>
                <button class="btn-cancel" @click="closeProfile()">Cerrar</button>
                <template v-if="!editingProfile">
                    <button class="btn-edit-info" @click="startEditProfile">Editar perfil</button>
                    <div v-if="perfilFeedback && perfilFeedbackTipo === 'success'" class="feedback-msg feedback-success" style="margin-right:auto">
                        <i class="ti ti-check"></i> {{ perfilFeedback }}
                    </div>
                </template>
                <template v-else>
                    <button class="btn-cancel" @click="cancelEdit">Cancelar</button>
                    <button class="tb-btn primary" @click="saveProfile">Guardar</button>
                </template>
            </template>
        </Modal>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from "vue";
import Modal from '@/components/ui/Modal.vue';
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";
import { obtenerAsignacionesProfesor } from "@/services/academico-service.js";
import { resolverIdProfesor } from "@/composables/useProfesor.js";

const router = useRouter();
const authStore = useAuthStore();

const sidebarAbierto = ref(false);

const userName = computed(() => authStore.usuario?.nombre || "Juan Pérez");
const userEmail = computed(() => authStore.usuario?.email || "juan.perez@escuela.edu");
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

const profileMenuOpen = ref(false);
const toggleProfileMenu = () => (profileMenuOpen.value = !profileMenuOpen.value);
const openProfile = ref(false);
const closeProfile = () => (openProfile.value = false);

const handleClickOutside = (e) => {
    if (!e.target.closest(".profile-container")) profileMenuOpen.value = false;
};

onMounted(() => {
    document.addEventListener("click", handleClickOutside);
    cargarStatsHeader();
});
onUnmounted(() => document.removeEventListener("click", handleClickOutside));

const cerrarSesion = () => {
    authStore.logout();
    router.push("/");
};

// ── Perfil editable ──────────────────────────────────────────────────────────
const editingProfile = ref(false);
const editProfile = reactive({ nombre: authStore.usuario?.nombre || '', email: authStore.usuario?.email || '' });
const perfilFeedback = ref("");
const perfilFeedbackTipo = ref(""); // "error" o "success"

const startEditProfile = () => {
    editingProfile.value = true;
    perfilFeedback.value = "";
    editProfile.nombre = authStore.usuario?.nombre || '';
    editProfile.email = authStore.usuario?.email || '';
};

const cancelEdit = () => {
    editingProfile.value = false;
    perfilFeedback.value = "";
};

const saveProfile = () => {
    perfilFeedback.value = "";

    if (!editProfile.nombre.trim() || !editProfile.email.trim()) {
        perfilFeedback.value = "Completá nombre y email.";
        perfilFeedbackTipo.value = "error";
        return;
    }

    // validación simple de email
    if (!editProfile.email.includes("@")) {
        perfilFeedback.value = "El email no es válido.";
        perfilFeedbackTipo.value = "error";
        return;
    }

    authStore.updateProfile({ nombre: editProfile.nombre.trim(), email: editProfile.email.trim() });
    editingProfile.value = false;
    perfilFeedback.value = "Perfil actualizado correctamente.";
    perfilFeedbackTipo.value = "success";

    setTimeout(() => { perfilFeedback.value = ""; }, 3000);
};
</script>


<style scoped src="./profesores.css"></style>
<style scoped>
.perfil-modal-body {
    padding: 10px 0;
}
.perfil-layout {
    display: flex;
    gap: 24px;
    align-items: center;
}
.perfil-avatar-wrapper {
    flex-shrink: 0;
    border-radius: 50%;
    padding: 4px;
    background: linear-gradient(135deg, var(--primary, #c0152a), var(--primary-dark, #7f0917));
    box-shadow: 0 4px 12px rgba(192, 21, 42, 0.2);
}
.perfil-avatar-lg {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    border: 4px solid #fff;
    object-fit: cover;
    display: block;
}
.perfil-info {
    flex: 1;
}
.perfil-name {
    margin: 0 0 8px 0;
    font-size: 1.5rem;
    font-weight: 800;
    color: var(--text, #0f172a);
}
.perfil-email {
    margin: 0 0 12px 0;
    color: var(--muted, #64748b);
    font-size: 1.05rem;
}
.perfil-role {
    margin: 0;
}
.role-badge {
    background: var(--primary-soft, rgba(192, 21, 42, 0.1));
    color: var(--primary, #c0152a);
    font-weight: 700;
    font-size: 0.85rem;
    padding: 4px 12px;
    border-radius: 999px;
    display: inline-block;
}
.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.form-group label {
    font-weight: 600;
    font-size: 0.95rem;
    color: var(--text, #334155);
}
.perfil-input {
    border: 1px solid #d1d5db;
    border-radius: var(--radius-sm, 10px);
    padding: 12px 14px;
    background: var(--surface-2, #f8fafc);
    color: var(--text, #0f172a);
    font-family: inherit;
    transition: all 0.2s;
    width: 100%;
}
.perfil-input:focus {
    border-color: var(--primary, #c0152a);
    box-shadow: 0 0 0 3px var(--primary-soft, rgba(192, 21, 42, 0.15));
    outline: none;
}
.feedback-msg {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 10px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 12px;
}
.feedback-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
}
.feedback-success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
}
@media (max-width: 600px) {
    .perfil-layout {
        flex-direction: column;
        text-align: center;
    }
}
</style>
