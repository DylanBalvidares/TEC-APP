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


      <!-- OVERLAY -->

      <div
        class="sidebar-overlay"
        :class="{ visible: sidebarAbierto }"
        @click="closeSidebar"
      ></div>


      <!-- =================================================
           SIDEBAR
      ================================================== -->

      <aside
        id="sidebar-preceptor"
        class="sidebar"
        :class="{ abierto: sidebarAbierto, colapsado: sidebarColapsado }"
      >

        <ul>

          <li class="sidebar-section" role="presentation">Inicio</li>


          <!-- INICIO -->

          <li @click="closeSidebar">

            <RouterLink
              to="/preceptor/inicio"
              active-class="active"
            >

              <i class="fas fa-home"></i>

              Inicio

            </RouterLink>

          </li>


          <li class="sidebar-section" role="presentation">Académico · Cursos a cargo</li>

          <!-- ASISTENCIAS -->

          <li @click="closeSidebar">

            <RouterLink
              to="/preceptor/asistencias"
              active-class="active"
            >

              <i class="fas fa-tasks"></i>

              Asistencias

            </RouterLink>

          </li>


          <!-- LIBRETA DIGITAL -->

          <li @click="closeSidebar">

            <RouterLink
              to="/preceptor/libreta"
              active-class="active"
            >

              <i class="fas fa-file-alt"></i>

              Libreta Digital

            </RouterLink>

          </li>


          <!-- BOLETINES CUATRIMESTRALES -->

          <li @click="closeSidebar">

            <RouterLink
              to="/preceptor/boletines"
              active-class="active"
            >

              <i class="fas fa-file-invoice"></i>

              Boletines

            </RouterLink>

          </li>


          <!-- PLAN DE ESTUDIOS -->

          <li @click="closeSidebar">

            <RouterLink
              to="/preceptor/plan"
              active-class="active"
            >

              <i class="fas fa-layer-group"></i>

              Plan de Estudios

            </RouterLink>

          </li>


          <!-- CURSOS -->

          <li>
              <RouterLink
                  to="/preceptor/cursos"
                  active-class="active"
              >
                  <i class="fas fa-user-friends"></i>
                  Cursos a cargo
              </RouterLink>
          </li>


          <li class="sidebar-section" role="presentation">Comunicación</li>

          <!-- WHATSAPP -->

          <li @click="closeSidebar">

            <RouterLink
              to="/preceptor/mensajes"
              active-class="active"
            >

              <i class="fab fa-whatsapp"></i>

              WhatsApp

            </RouterLink>

          </li>


          <!-- COMUNICADOS -->

          <li @click="closeSidebar">

            <RouterLink
              to="/preceptor/comunicados"
              active-class="active"
            >

              <i class="fas fa-bullhorn"></i>

              Comunicados

            </RouterLink>

          </li>


          <li class="sidebar-section" role="presentation">Seguimiento</li>

          <!-- REPORTES -->

          <li @click="closeSidebar">

            <RouterLink
              to="/preceptor/reportes"
              active-class="active"
            >

              <i class="fas fa-clipboard"></i>

              Reportes

            </RouterLink>

          </li>


          <!-- CALENDARIO -->

          <li @click="closeSidebar">

            <RouterLink
              to="/preceptor/calendario"
              active-class="active"
            >

              <i class="fas fa-calendar-alt"></i>

              Calendario

            </RouterLink>

          </li>

        </ul>


        <!-- =================================================
             AYUDA
        ================================================== -->

        <div class="sidebar-help">

          <i class="fas fa-circle-question"></i>

          <div>

            <p class="help-title">
              ¿Necesitás ayuda?
            </p>

            <p class="help-sub">
              Pixelina resolverá tu consulta.
            </p>

          </div>

        </div>

      </aside>



      <!-- =================================================
           CONTENIDO
      ================================================== -->

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
  .sidebar.colapsado { width: 0; min-width: 0; padding: 0; overflow: hidden; box-shadow: none; transition: width .25s ease, padding .25s ease; }
  .sidebar.colapsado > * { visibility: hidden; }
}
</style>
