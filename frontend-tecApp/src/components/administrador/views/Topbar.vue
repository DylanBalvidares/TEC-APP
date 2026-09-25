<template>
    <header class="topbar">
        <div class="brand-section">
            <img src="/logoEscuela.png" class="brand-logo" alt="Logo Escuela" />
            <div class="brand-divider"></div>
            <div class="brand-text">
                <h1 class="brand-title">Tec-app</h1>
                <span class="brand-subtitle">{{ currentPage }}</span>
            </div>
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

                        <RouterLink
                            to="/perfil/administrador"
                            class="dropdown-item"
                            @click="menuAbierto = false"
                        >
                            <i class="ti ti-user-circle"></i> Mi Perfil
                        </RouterLink>
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
    </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../../stores/auth";

defineProps({
    currentPage: { type: String, default: "Inicio" },
});

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
const ETIQUETAS_ROL = {
    root: "Administrador",
    administrativo: "Administrativo",
    profesor: "Profesor",
    preceptor: "Preceptor",
    alumno: "Alumno",
    tutor: "Tutor",
    delegado: "Delegado",
    bibliotecario: "Bibliotecario",
};
const userRole = computed(() => {
    const crudo = nombreRolCrudo.value;
    if (ETIQUETAS_ROL[crudo]) return ETIQUETAS_ROL[crudo];
    return crudo
        ? crudo.charAt(0).toUpperCase() + crudo.slice(1)
        : "Invitado";
});

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

// Acción de logout
const cerrarSesion = () => {
    if (!window.confirm("¿Seguro que querés cerrar sesión?")) return;
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

/* --- Marca y Logo --- */
.brand-section {
    display: flex;
    align-items: center;
    gap: 16px;
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

.brand-text {
    display: flex;
    align-items: baseline;
    gap: 10px;
}

.brand-title {
    font-size: 16px;
    font-weight: 600;
    color: #111827;
    margin: 0;
    letter-spacing: -0.01em;
}

.brand-subtitle {
    font-size: 13px;
    color: #6b7280;
    font-weight: 500;
    padding-left: 4px;
    border-left: 2px solid #cd322c; /* Toque visual de la página actual */
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
@media (max-width: 600px) {
    .brand-divider {
        display: none;
    }

    .brand-subtitle {
        font-size: 11px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 35vw;
    }

    .topbar {
        padding: 0 16px;
    }
}
</style>
