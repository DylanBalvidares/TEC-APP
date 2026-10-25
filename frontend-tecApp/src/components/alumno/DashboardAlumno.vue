<template>
  <div class="dashboard-wrapper">
    <AppTopbar
      :current-page="currentPage"
      :sidebar-abierto="sidebarAbierto"
      sidebar-id="sidebar-alumno"
      @toggle-sidebar="toggleSidebar"
      @ir-inicio="irInicio"
      @ver-perfil="abrirPerfil(false)"
    />
    <UserProfileDialog v-model="perfilAbierto" :edit="editarPerfil" />
    <div class="dashboard-body">
      <Sidebar :abierto="sidebarAbierto" :colapsado="sidebarColapsado" @close="closeSidebar" />
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
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import AppTopbar from "../ui/AppTopbar.vue";
import UserProfileDialog from "../ui/UserProfileDialog.vue";
import { useResponsiveSidebar } from "../../composables/useResponsiveSidebar.js";
import Sidebar from "./views/Sidebar.vue";

const { sidebarOpen: sidebarAbierto, desktopCollapsed: sidebarColapsado, toggleSidebar, closeSidebar } = useResponsiveSidebar();
const perfilAbierto = ref(false);
const editarPerfil = ref(false);
const route = useRoute();
const router = useRouter();
const nombresPagina = { inicio: "Inicio", noticias: "Noticias", cursos: "Cursos", libreta: "Libreta Digital", "objetos-perdidos": "Objetos perdidos" };
const currentPage = computed(() => nombresPagina[route.path.split("/").filter(Boolean).at(-1)] || "Inicio");
const abrirPerfil = (edit) => { editarPerfil.value = edit; perfilAbierto.value = true; };
const irInicio = () => router.push('/alumno/inicio');
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
