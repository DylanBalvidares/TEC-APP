<template>
    <div class="dash-wrapper" role="main" aria-label="Panel de administración del sistema de gestión escolar">
        <Topbar :current-page="nombrePagina(currentView)" />

        <div class="dash">
            <Sidebar :vista-actual="currentView" @cambiar-vista="setView" />

            <div class="main">
                <div class="content">
                    <keep-alive>
                      <component
                        :is="componentesMap[currentView]"
                        @cambiar-vista="setView"
                      />
                    </keep-alive>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";

import Sidebar from "./views/Sidebar.vue";
import Topbar from "./views/Topbar.vue";
import Overview from "./views/Overview.vue";
import RolesView from "./views/RolesView.vue";
import MonitorCorreos from "./views/MonitorCorreos.vue";
import AlumnosView from "./views/AlumnosView.vue";
import ProfesoresView from "./views/ProfesoresView.vue";
import CursosView from "./views/CursosView.vue";
import NoticiasView from "./views/NoticiasView.vue";
import ComunicadosView from "./views/ComunicadosView.vue";
import AsignacionesView from "./views/AsignacionesView.vue";
import MateriasView from "./views/MateriasView.vue";
import LibretaAdminView from "./views/LibretaAdminView.vue";
import PersonalView from "./views/PersonalView.vue";
import UsuariosView from "./views/UsuariosView.vue";
import AsistenciasView from "./views/AsistenciasView.vue";

const componentesMap = {
  overview: Overview,
  monitorcorreos: MonitorCorreos,
  roles: RolesView,
  alumnos: AlumnosView,
  profesores: ProfesoresView,
  cursos: CursosView,
  noticias: NoticiasView,
  asignaciones: AsignacionesView,
  materias: MateriasView,
  libreta: LibretaAdminView,
  personal: PersonalView,
  usuarios: UsuariosView,
  asistencias: AsistenciasView,
  comunicados: ComunicadosView,
};
const pageNames = {
  overview: "Inicio",
  monitorcorreos: "Historial de Emails",
  roles: "Roles y permisos",
  alumnos: "Alumnos",
  profesores: "Profesores",
  cursos: "Cursos",
  noticias: "Noticias",
  comunicados: "Comunicados",
  asignaciones: "Asignaciones de Materias",
  materias: "Materias",
  libreta: "Libreta Digital",
  personal: "Personal",
  usuarios: "Usuarios",
  asistencias: "Asistencias",
};
const currentView = ref("overview");

const nombrePagina = (vista) => pageNames[vista] || "Inicio";

const setView = (vista) => {
    currentView.value = vista;
};
</script>

<style scoped>
.dash-wrapper {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    max-width: 100vw;
    background: var(--color-background-tertiary, #f8f9fa);
    font-size: 13px;
    box-sizing: border-box;
    overflow-x: hidden;
}

.dash {
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr);
    flex: 1;
    width: 100%;
    min-width: 0;
    position: relative;
}

.main {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    width: 100%;
    overflow: hidden;
}

.content {
    padding: 16px 20px;
    flex: 1;
    overflow-y: auto;
    overflow-x: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    box-sizing: border-box;
}

.content > * {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
}
</style>
