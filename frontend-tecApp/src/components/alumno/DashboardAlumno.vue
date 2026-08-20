<template>
  <div class="dashboard-wrapper">
    <Topbar @toggle-sidebar="sidebarAbierto = !sidebarAbierto" />
    <div class="dashboard-body">
      <Sidebar :abierto="sidebarAbierto" @close="sidebarAbierto = false" />
      <div class="sidebar-overlay" :class="{ visible: sidebarAbierto }" @click="sidebarAbierto = false"></div>
      <main class="view-container">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import Topbar from "./views/Topbar.vue";
import Sidebar from "./views/Sidebar.vue";

const sidebarAbierto = ref(false);
</script>

<style scoped>
.dashboard-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.dashboard-body {
  display: flex;
  flex: 1;
  position: relative;
}

/*
 * El contenido principal ocupa todo el espacio a la derecha del sidebar.
 * NO debe tener overflow-y propio — el scroll lo maneja la ventana
 * para que position:sticky del sidebar funcione correctamente.
 */
.view-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* Overlay para mobile sidebar */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 99;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(2px);
}

@media (max-width: 900px) {
  .sidebar-overlay.visible {
    display: block;
    opacity: 1;
  }
}

/* Transiciones de router-view */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-slide-leave-to {
  opacity: 0;
}
</style>
<style src="./alumno.css"></style>
