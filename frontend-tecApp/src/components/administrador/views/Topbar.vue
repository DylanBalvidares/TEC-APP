<template>
    <header class="topbar">
        <div class="brand-section">
            <button
                class="menu-toggle"
                aria-label="Abrir o cerrar menú de navegación"
                @click="$emit('toggle-sidebar')"
            >
                <i class="ti ti-menu-2" aria-hidden="true"></i>
            </button>
            <img src="/logoEscuela.png" class="brand-logo" alt="Logo Escuela" />
            <div class="brand-divider"></div>
            <nav class="breadcrumb" aria-label="Ubicación actual">
                <button class="breadcrumb-raiz" @click="$emit('ir-inicio')">
                    Tec-app
                </button>
                <template v-if="currentPage !== 'Inicio'">
                    <i class="ti ti-chevron-right" aria-hidden="true"></i>
                    <span class="breadcrumb-actual">{{ currentPage }}</span>
                </template>
            </nav>
        </div>

        <div class="user-section" ref="profileMenuRef">
            <button
                class="avatar-btn"
                @click="toggleMenu"
                :class="{ 'is-active': menuAbierto }"
                aria-label="Menú de usuario"
            >
                <img
                    v-if="!avatarError"
                    :src="avatarUrl"
                    alt="Avatar del usuario"
                    @error="avatarError = true"
                />
                <span v-else class="avatar-fallback" aria-hidden="true">{{
                    inicialesUsuario
                }}</span>
            </button>

            <transition name="fade-slide">
                <div v-if="menuAbierto" class="dropdown-menu">
                    <div class="dropdown-header">
                        <img
                            v-if="!avatarError"
                            :src="avatarUrl"
                            class="dropdown-avatar"
                            alt="Avatar"
                            @error="avatarError = true"
                        />
                        <span
                            v-else
                            class="dropdown-avatar avatar-fallback"
                            aria-hidden="true"
                            >{{ inicialesUsuario }}</span
                        >
                        <div class="dropdown-user-info">
                            <p class="user-name">{{ userName }}</p>
                            <p class="user-email">{{ userDocLine }}</p>
                        </div>
                    </div>

                    <div class="dropdown-divider"></div>

                    <div class="dropdown-body">
                        <div class="user-badge">
                            <span class="badge-label"
                                >Perfil Institucional</span
                            >
                            <span class="badge-value">{{ userRole }}</span>
                        </div>

                        <button
                            type="button"
                            class="dropdown-item"
                            @click="irAlPerfil"
                        >
                            <i class="ti ti-user-circle"></i> Mi Perfil
                        </button>
                    </div>

                    <div class="dropdown-divider"></div>

                    <button
                        class="dropdown-item text-danger"
                        @click="cerrarSesion"
                    >
                        <i class="ti ti-logout"></i> Cerrar Sesión
                    </button>
                </div>
            </transition>
        </div>

        <Modal
            v-model="confirmarLogout"
            title="Cerrar sesión"
            variante="danger"
        >
            <p class="modal-texto">¿Seguro que querés cerrar sesión?</p>
            <template #footer>
                <button
                    class="tb-btn outline"
                    @click="confirmarLogout = false"
                >
                    Cancelar
                </button>
                <button class="tb-btn danger" @click="ejecutarLogout">
                    Cerrar sesión
                </button>
            </template>
        </Modal>
    </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../../stores/auth";
import Modal from "../../ui/Modal.vue";
import { etiquetaRol } from "../../../utils/roles.js";

defineProps({
    currentPage: { type: String, default: "Inicio" },
});

const emit = defineEmits(["toggle-sidebar", "ir-inicio", "ir-perfil"]);

const router = useRouter();
const authStore = useAuthStore();

// Referencias del DOM y estado
const menuAbierto = ref(false);
const profileMenuRef = ref(null);

// Datos del usuario con fallbacks seguros (reactivos a la sesión)
const nombreRolCrudo = computed(
    () => authStore.usuario?.nombre_rol || "",
);
const userName = computed(() => {
    const u = authStore.usuario;
    const completo = `${u?.nombre || ""} ${u?.apellido || ""}`.trim();
    return completo || u?.nombre || "Usuario Invitado";
});
const userDocLine = computed(() => {
    const u = authStore.usuario;
    if (u?.dni) return `DNI: ${u.dni}`;
    if (u?.email) return u.email;
    return "Cuenta institucional";
});
const userRole = computed(() => etiquetaRol(nombreRolCrudo.value));

// Avatar dinámico usando el color rojo institucional (cd322c)
const avatarError = ref(false);
const inicialesUsuario = computed(() =>
    userName.value
        .split(/[\s_]+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
);
const avatarUrl = computed(() => {
    const name = userName.value.split(" ").join("+");
    return `https://ui-avatars.com/api/?name=${name}&background=cd322c&color=fff&rounded=true&bold=true`;
});

// Manejo del menú
const toggleMenu = () => {
    menuAbierto.value = !menuAbierto.value;
};

// Acceso al perfil dentro del mismo dashboard (mantiene sidebar/topbar)
const irAlPerfil = () => {
    menuAbierto.value = false;
    emit("ir-perfil");
};

const handleClickOutside = (event) => {
    if (profileMenuRef.value && !profileMenuRef.value.contains(event.target)) {
        menuAbierto.value = false;
    }
};

onMounted(() => {
    document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
    document.removeEventListener("click", handleClickOutside);
});

// Acción de logout con modal de confirmación (sin confirm nativo)
const confirmarLogout = ref(false);

const cerrarSesion = () => {
    menuAbierto.value = false;
    confirmarLogout.value = true;
};

const ejecutarLogout = () => {
    confirmarLogout.value = false;
    authStore.logout();
    router.push("/");
};
</script>

<style scoped>
/* --- Header Principal --- */
.topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 64px;
    padding: 0 24px;
    background-color: #ffffff;
    border-bottom: 1px solid #e5e7eb; /* Gris más acorde a tu auth */
    position: sticky;
    top: 0;
    z-index: 1000;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* --- Botón de menú (toggle sidebar) --- */
.menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: #374151;
    font-size: 22px;
    padding: 6px;
    border-radius: 6px;
    transition: background 0.15s;
}

.menu-toggle:hover {
    background: #f3f4f6;
}

/* --- Marca y Logo --- */
.brand-section {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
}

.brand-logo {
    width: 36px;
    height: 36px;
    object-fit: contain;
    border-radius: 6px;
}

.brand-divider {
    width: 1px;
    height: 24px;
    background-color: #d1d5db;
}

/* --- Breadcrumb --- */
.breadcrumb {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    min-width: 0;
}

.breadcrumb-raiz {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: #6b7280;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: -0.01em;
}

.breadcrumb-raiz:hover {
    color: #cd322c;
    text-decoration: underline;
}

.breadcrumb i {
    font-size: 14px;
    color: #9ca3af;
    flex-shrink: 0;
}

.breadcrumb-actual {
    color: #6b7280;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

/* --- Sección de Usuario --- */
.user-section {
    position: relative;
}

.avatar-btn {
    background: transparent;
    border: 2px solid transparent;
    padding: 2px;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    outline: none;
}

.avatar-btn img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
}

.avatar-fallback {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #cd322c;
    color: #fff;
    font-size: 13px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.dropdown-avatar.avatar-fallback {
    width: 44px;
    height: 44px;
    font-size: 15px;
}

.avatar-btn:hover,
.avatar-btn.is-active,
.avatar-btn:focus-visible {
    border-color: #cd322c; /* Hover institucional */
    box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.1);
}

/* --- Menú Desplegable --- */
.dropdown-menu {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    width: 260px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 8px 10px -6px rgba(0, 0, 0, 0.1);
    padding: 8px 0;
    overflow: hidden;
}

.dropdown-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
}

.dropdown-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
}

.dropdown-user-info {
    display: flex;
    flex-direction: column;
}

.user-name {
    font-size: 14px;
    font-weight: 600;
    color: #111827;
    margin: 0;
}

.user-email {
    font-size: 12px;
    color: #6b7280;
    margin: 2px 0 0 0;
}

.dropdown-divider {
    height: 1px;
    background-color: #f3f4f6;
    margin: 4px 0;
}

.dropdown-body {
    padding: 4px 0;
}

/* Ahora el badge sí se renderiza */
.user-badge {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    margin: 4px 12px 12px 12px;
    background-color: #f9fafb;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
}

.badge-label {
    font-size: 11px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.badge-value {
    font-size: 12px;
    font-weight: 600;
    color: #cd322c; /* Destacado del rol */
}

.dropdown-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 16px;
    font-size: 13px;
    color: #4b5563;
    text-decoration: none;
    background: none;
    border: none;
    cursor: pointer;
    transition:
        background-color 0.2s ease,
        color 0.2s ease;
    text-align: left;
}

.dropdown-item i {
    font-size: 15px;
    color: #9ca3af;
    width: 20px;
    text-align: center;
    transition: 0.2s;
}

.dropdown-item:hover {
    background-color: #f3f4f6;
    color: #111827;
}

.dropdown-item:hover i {
    color: #4b5563;
}

.dropdown-item.text-danger {
    color: #b91c1c;
}

.dropdown-item.text-danger i {
    color: #ef4444;
}

.dropdown-item.text-danger:hover {
    background-color: #fef2f2; /* Hover rojo claro */
    color: #991b1b;
}

/* --- Animación de Transición --- */
.fade-slide-enter-active,
.fade-slide-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

/* --- Responsive --- */
@media (max-width: 640px) {
    .brand-divider {
        display: none;
    }

    .brand-section {
        gap: 10px;
    }

    .topbar {
        padding: 0 16px;
    }
}
</style>
