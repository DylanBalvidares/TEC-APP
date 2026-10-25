<template>
  <div class="preceptor-wrapper">

    <!-- =====================================================
         NAVBAR
    ===================================================== -->

    <AppTopbar
      :current-page="currentPage"
      :sidebar-abierto="sidebarAbierto"
      sidebar-id="sidebar-preceptor"
      @toggle-sidebar="toggleSidebar"
      @ir-inicio="router.push('/preceptor/inicio')"
      @ver-perfil="abrirPerfil(false)"
    />
    <UserProfileDialog v-model="profileDialogOpen" :edit="profileDialogEdit" />


    <!-- =====================================================
         CONTENEDOR
    ===================================================== -->

    <div class="container">


      <RoleSidebar id="sidebar-preceptor" label="Secciones del preceptor" :groups="navigationByRole.preceptor" :open="sidebarAbierto" :collapsed="sidebarColapsado" @close="closeSidebar">
        <template #footer>
          <div class="role-sidebar-help"><i class="fas fa-circle-question" aria-hidden="true"></i><span><strong>¿Necesitás ayuda?</strong><small>Pixelina resolverá tu consulta.</small></span></div>
        </template>
      </RoleSidebar>

      <main class="main-content">

        <router-view />

      </main>

    </div>



    <!-- =====================================================
         MODAL PERFIL
    ===================================================== -->



  </div>
</template>


<script setup>

import {
  ref,
  computed
} from "vue";

import AppTopbar from "../ui/AppTopbar.vue";
import RoleSidebar from "../ui/RoleSidebar.vue";
import { navigationByRole } from "../../config/role-navigation.js";
import UserProfileDialog from "../ui/UserProfileDialog.vue";
import { useResponsiveSidebar } from "../../composables/useResponsiveSidebar.js";

import {
  useRouter,
  useRoute
} from "vue-router";

/* =========================================================
   ROUTER / AUTH
========================================================= */

const router = useRouter();
const route = useRoute();
const profileDialogOpen = ref(false);
const profileDialogEdit = ref(false);
const currentPage = computed(() => ({ inicio: 'Inicio', asistencias: 'Asistencias', libreta: 'Libreta Digital', boletines: 'Boletines', cursos: 'Cursos', alumnos: 'Alumnos', comunicados: 'Comunicados', mensajes: 'WhatsApp', plan: 'Plan de Estudios' }[route.path.split('/').filter(Boolean).at(-1)] || 'Inicio'));
const abrirPerfil = (edit) => { profileDialogEdit.value = edit; profileDialogOpen.value = true; };

/* =========================================================
   SIDEBAR
========================================================= */

const { sidebarOpen: sidebarAbierto, desktopCollapsed: sidebarColapsado, toggleSidebar, closeSidebar } = useResponsiveSidebar();


</script>


<style src="./preceptores.css"></style>
<style scoped>
@media (min-width: 901px) {
  .role-sidebar.collapsed { width: 72px; min-width: 72px; }
}
</style>
