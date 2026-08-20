<template>
  <nav class="navbar" id="topbar-alumno">
    <div class="nav-izquierda">
      <!-- Hamburger for mobile -->
      <button class="hamburger" @click="$emit('toggle-sidebar')" aria-label="Menú">
        <i class="fas fa-bars"></i>
      </button>
      <div class="logo">
        <img src="/logoEscuela.png" width="48" height="48" alt="Logo Escuela" />
        <div class="logo-titulo">
          <h2>GESTIÓN ESCOLAR</h2>
          <p>Panel del Alumno</p>
        </div>
      </div>
    </div>

    <div class="nav-derecha">
      <!-- Notification bell (decorative) -->
      <button class="icon-btn" aria-label="Notificaciones">
        <i class="fas fa-bell"></i>
        <span class="notification-dot"></span>
      </button>

      <div class="profile-container" ref="profileContainer">
        <button class="profile-trigger" @click.stop="toggleMenu" id="profile-btn-alumno">
          <img :src="avatarUrl" alt="User" />
          <span class="profile-name">{{ userName }}</span>
          <i class="fas fa-chevron-down" :class="{ rotated: menuAbierto }"></i>
        </button>

        <transition name="dropdown">
          <div v-show="menuAbierto" class="profile-menu" id="profile-menu-alumno">
            <div class="menu-header">
              <img :src="avatarUrl" class="large-avatar" />
              <p class="user-name">{{ userName }}</p>
              <p class="user-email">DNI: {{ userDni }}</p>
            </div>
            <div class="menu-divider"></div>
            <div class="menu-body">
              <p class="user-role">
                Rol:
                <span class="role-badge">{{ userCurso }}</span>
              </p>
              <RouterLink to="/alumno/inicio" class="menu-item"> <i class="fas fa-home"></i> Inicio </RouterLink>
              <RouterLink to="/alumno/cursos" class="menu-item"> <i class="fas fa-graduation-cap"></i> Mis Cursos </RouterLink>
            </div>
            <div class="menu-divider"></div>
            <button class="sign-out-btn" @click="cerrarSesion" id="logout-btn-alumno">
              <i class="fas fa-sign-out-alt"></i>
              Cerrar Sesión
            </button>
          </div>
        </transition>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth.js";

defineEmits(["toggle-sidebar"]);

const router = useRouter();
const authStore = useAuthStore();

const menuAbierto = ref(false);
const profileContainer = ref(null);

const userName = computed(() => authStore.usuario?.nombre || authStore.usuario?.nombre_usuario || "Alumno");
const userDni = computed(() => authStore.usuario?.dni || "Sin documento");
const userCurso = computed(() => authStore.rol || "alumno");

const avatarUrl = computed(() => {
  const nameForApi = userName.value.split(" ").join("+");
  return `https://ui-avatars.com/api/?name=${nameForApi}&background=ca0d0d&color=fff&bold=true&size=96`;
});

const toggleMenu = () => {
  menuAbierto.value = !menuAbierto.value;
};

const cerrarMenuClickAfuera = (e) => {
  if (menuAbierto.value && profileContainer.value && !profileContainer.value.contains(e.target)) {
    menuAbierto.value = false;
  }
};

onMounted(() => document.addEventListener("click", cerrarMenuClickAfuera));
onUnmounted(() => document.removeEventListener("click", cerrarMenuClickAfuera));

const cerrarSesion = () => {
  authStore.logout();
  router.push("/");
};
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  height: 70px;
  background: #fff;
  border-bottom: 1px solid #e8edf2;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);
  position: sticky;
  top: 0;
  z-index: 200;
}

.nav-izquierda {
  display: flex;
  align-items: center;
  gap: 14px;
}

.hamburger {
  display: none;
  background: none;
  border: none;
  font-size: 20px;
  color: #334155;
  cursor: pointer;
  padding: 9px;
  border-radius: 10px;
  transition: background 0.2s;
}

.hamburger:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo img {
  border-radius: 12px;
}

.logo-titulo {
  display: flex;
  flex-direction: column;
}

.logo h2 {
  font-size: 1.05rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
  letter-spacing: 0.4px;
}

.logo p {
  color: #94a3b8;
  font-size: 0.76rem;
  margin: 0;
  font-weight: 500;
}

.nav-derecha {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  position: relative;
  background: none;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  font-size: 17px;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.notification-dot {
  position: absolute;
  top: 8px;
  right: 9px;
  width: 7px;
  height: 7px;
  background: #c0152a;
  border-radius: 50%;
  border: 2px solid #fff;
}

.profile-container {
  position: relative;
  display: flex;
  align-items: center;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e8edf2;
  background: #f8fafc;
  cursor: pointer;
  padding: 5px 12px 5px 5px;
  border-radius: 50px;
  transition: all 0.2s ease;
}

.profile-trigger:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
}

.profile-trigger img {
  border-radius: 50%;
  width: 34px;
  height: 34px;
  display: block;
  object-fit: cover;
}

.profile-name {
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
}

.profile-trigger i {
  font-size: 10px;
  color: #94a3b8;
  transition: transform 0.25s ease;
}

.profile-trigger i.rotated {
  transform: rotate(180deg);
}

/* Dropdown menu */
.profile-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 10px);
  width: 288px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12), 0 4px 12px rgba(15, 23, 42, 0.06);
  border: 1px solid #e8edf2;
  padding: 16px;
  z-index: 1000;
}

.menu-header {
  text-align: center;
  padding-bottom: 14px;
}

.large-avatar {
  border-radius: 50%;
  width: 68px;
  height: 68px;
  margin: 0 auto 10px;
  display: block;
  box-shadow: 0 4px 12px rgba(192, 21, 42, 0.18);
  border: 3px solid #fff;
  outline: 3px solid #fde8eb;
}

.user-name {
  font-weight: 700;
  font-size: 1.05rem;
  color: #0f172a;
  margin: 0;
}

.user-email {
  color: #94a3b8;
  font-size: 0.82rem;
  margin: 4px 0 0 0;
}

.menu-divider {
  height: 1px;
  background: #f1f5f9;
  margin: 12px 0;
}

.user-role {
  text-align: center;
  font-weight: 500;
  margin-bottom: 12px;
  font-size: 0.88rem;
  color: #64748b;
}

.role-badge {
  display: inline-block;
  background: rgba(192, 21, 42, 0.1);
  color: #c0152a;
  padding: 3px 12px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 0.78rem;
  text-transform: capitalize;
  letter-spacing: 0.04em;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  text-decoration: none;
  color: #374151;
  border-radius: 10px;
  transition: all 0.15s ease;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 2px;
}

.menu-item i {
  width: 18px;
  text-align: center;
  color: #94a3b8;
  transition: color 0.15s;
}

.menu-item:hover {
  background: #f8fafc;
  color: #0f172a;
}

.menu-item:hover i {
  color: #c0152a;
}

.sign-out-btn {
  width: 100%;
  padding: 11px;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  background: #f8fafc;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.88rem;
  color: #64748b;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.sign-out-btn:hover {
  background: #fef2f2;
  border-color: #fca5a5;
  color: #c0152a;
}

/* Dropdown transitions */
.dropdown-enter-active {
  transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px) scale(0.96);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

/* Responsive */
@media (max-width: 900px) {
  .hamburger {
    display: flex;
  }

  .profile-name {
    display: none;
  }

  .profile-trigger i.fa-chevron-down {
    display: none;
  }

  .logo-titulo {
    display: none;
  }
}

@media (max-width: 500px) {
  .navbar {
    padding: 0 16px;
  }

  .icon-btn {
    display: none;
  }
}
</style>
