<template>
  <div class="preceptor-wrapper">

    <!-- =====================================================
         NAVBAR
    ===================================================== -->

    <nav class="navbar">

      <div class="nav-izquierda">

        <button
          class="hamburger-btn"
          @click="sidebarAbierto = !sidebarAbierto"
        >
          <i class="fas fa-bars"></i>
        </button>

        <div class="logo">

          <img
            src="/logoEscuela.png"
            width="48"
            height="48"
            alt="Logo"
          >

          <div class="logo-titulo">

            <h2>GESTIÓN ESCOLAR</h2>

            <p>Panel Preceptor</p>

          </div>

        </div>

      </div>


      <!-- =================================================
           PERFIL
      ================================================== -->

      <div
        class="profile-container"
        ref="profileContainer"
      >

        <button
          class="profile-trigger"
          @click.stop="toggleProfileMenu"
          :aria-expanded="profileMenuOpen"
          aria-haspopup="true"
        >

          <img
            :src="avatarUrl"
            alt="Avatar"
          >

        </button>


        <div
          class="profile-menu"
          :class="{ active: profileMenuOpen }"
        >

          <div class="menu-header">

            <img
              :src="avatarUrl"
              class="large-avatar"
              alt="Avatar"
            >

            <p class="user-name">
              {{ userName }}
            </p>

            <p class="user-email">
              {{ userEmail }}
            </p>

          </div>


          <hr>


          <div class="menu-body">

            <p class="user-role">

              Rol:

              <span class="role-badge">
                Preceptor
              </span>

            </p>


            <button
              type="button"
              class="menu-item"
              @click="openProfile = true"
            >

              <i class="fas fa-user"></i>

              Mi Perfil

            </button>

          </div>


          <hr>


          <button
            class="sign-out-btn"
            @click="cerrarSesion"
          >

            <i class="fas fa-right-from-bracket"></i>

            Cerrar sesión

          </button>

        </div>

      </div>

    </nav>



    <!-- =====================================================
         CONTENEDOR
    ===================================================== -->

    <div class="container">


      <!-- OVERLAY -->

      <div
        class="sidebar-overlay"
        :class="{ visible: sidebarAbierto }"
        @click="sidebarAbierto = false"
      ></div>


      <!-- =================================================
           SIDEBAR
      ================================================== -->

      <aside
        class="sidebar"
        :class="{ abierto: sidebarAbierto }"
      >

        <ul>


          <!-- INICIO -->

          <li @click="sidebarAbierto = false">

            <RouterLink
              to="/preceptor/inicio"
              active-class="active"
            >

              <i class="fas fa-home"></i>

              Inicio

            </RouterLink>

          </li>


          <!-- ASISTENCIAS -->

          <li @click="sidebarAbierto = false">

            <RouterLink
              to="/preceptor/asistencias"
              active-class="active"
            >

              <i class="fas fa-tasks"></i>

              Asistencias

            </RouterLink>

          </li>


          <!-- BOLETINES -->

          <li @click="sidebarAbierto = false">

            <RouterLink
              to="/preceptor/boletines"
              active-class="active"
            >

              <i class="fas fa-file-alt"></i>

              Boletines

            </RouterLink>

          </li>


          <!-- CURSOS -->

          <li @click="sidebarAbierto = false">

            <RouterLink
              to="/preceptor/cursos"
              active-class="active"
            >

              <i class="fas fa-user-friends"></i>

              Cursos a cargo

            </RouterLink>

          </li>


          <!-- COMUNICADOS -->

          <li @click="sidebarAbierto = false">

            <RouterLink
              to="/preceptor/comunicados"
              active-class="active"
            >

              <i class="fas fa-bullhorn"></i>

              Comunicados

            </RouterLink>

          </li>


          <!-- REPORTES -->

          <li @click="sidebarAbierto = false">

            <RouterLink
              to="/preceptor/reportes"
              active-class="active"
            >

              <i class="fas fa-clipboard"></i>

              Reportes

            </RouterLink>

          </li>


          <!-- CALENDARIO -->

          <li @click="sidebarAbierto = false">

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

    <div
      v-if="openProfile"
      class="profile-modal-overlay"
      @click.self="openProfile = false"
    >

      <div class="profile-modal">

        <button
          class="cerrar-modal"
          @click="openProfile = false"
        >

          <i class="fas fa-xmark"></i>

        </button>


        <div class="profile-modal-header">

          <img
            :src="avatarUrl"
            alt="Avatar"
          >

          <h2>
            Mi Perfil
          </h2>

        </div>


        <div class="profile-modal-body">

          <p>
            <strong>Nombre:</strong>
            {{ userName }}
          </p>

          <p>
            <strong>Email:</strong>
            {{ userEmail }}
          </p>

          <p>
            <strong>Rol:</strong>
            Preceptor
          </p>

        </div>


        <div class="profile-modal-actions">

          <button
            class="btn-cerrar"
            @click="openProfile = false"
          >

            Cerrar

          </button>

        </div>

      </div>

    </div>

  </div>
</template>


<script setup>

import {
  ref,
  computed,
  onMounted,
  onUnmounted
} from "vue";

import {
  useRouter
} from "vue-router";

import {
  useAuthStore
} from "@/stores/auth.js";


/* =========================================================
   ROUTER / AUTH
========================================================= */

const router = useRouter();

const authStore =
  useAuthStore();


/* =========================================================
   SIDEBAR
========================================================= */

const sidebarAbierto =
  ref(false);


/* =========================================================
   USUARIO
========================================================= */

const userName =
  computed(
    () =>
      authStore.usuario?.nombre ||
      "Usuario Escuela"
  );


const userEmail =
  computed(
    () =>
      authStore.usuario?.email ||
      "usuario@escuela.edu"
  );


const avatarUrl =
  computed(
    () =>
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        userName.value
      )}&background=c0152a&color=fff`
  );


/* =========================================================
   PERFIL
========================================================= */

const profileMenuOpen =
  ref(false);

const openProfile =
  ref(false);


const toggleProfileMenu =
  () => {

    profileMenuOpen.value =
      !profileMenuOpen.value;

  };


/* =========================================================
   CLICK FUERA DEL PERFIL
========================================================= */

const handleClickOutside =
  (event) => {

    if (
      !event.target.closest(
        ".profile-container"
      )
    ) {

      profileMenuOpen.value =
        false;

    }

  };


/* =========================================================
   CERRAR SESIÓN
========================================================= */

const cerrarSesion =
  () => {

    authStore.logout();

    router.push("/");

  };


/* =========================================================
   EVENTOS
========================================================= */

onMounted(
  () => {

    document.addEventListener(
      "click",
      handleClickOutside
    );

  }
);


onUnmounted(
  () => {

    document.removeEventListener(
      "click",
      handleClickOutside
    );

  }
);

</script>


<style scoped src="./preceptores.css"></style>