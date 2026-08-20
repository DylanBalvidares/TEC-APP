<template>
    <div
        class="dash"
        role="main"
        aria-label="Panel de administración del sistema de gestión escolar"
    >
        <Sidebar :vista-actual="currentView" @cambiar-vista="setView" />

        <div class="main">
            <Topbar :current-page="nombrePagina(currentView)" />

            <div class="content">
                <keep-alive>
                  <component :is="componentesMap[currentView]" />
                </keep-alive>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";

import Sidebar from "./views/Sidebar.vue";
import Topbar from "./views/Topbar.vue";
import AlumnosView from "./views/AlumnosView.vue";
import ProfesoresView from "./views/ProfesoresView.vue";
import CursosView from "./views/CursosView.vue";
import NoticiasView from "./views/NoticiasView.vue";
import ComunicadosView from "./views/ComunicadosView.vue";
import AsignacionesView from "./views/AsignacionesView.vue";
import MateriasView from "./views/MateriasView.vue";
import PersonalView from "./views/PersonalView.vue";
import UsuariosView from "./views/UsuariosView.vue";
import AsistenciasView from "./views/AsistenciasView.vue";

const componentesMap = {
  alumnos: AlumnosView,
  profesores: ProfesoresView,
  cursos: CursosView,
  noticias: NoticiasView,
  asignaciones: AsignacionesView,
  materias: MateriasView,
  personal: PersonalView,
  usuarios: UsuariosView,
  asistencias: AsistenciasView,
  comunicados: ComunicadosView,
};
const pageNames = {
  alumnos: "Alumnos",
  profesores: "Profesores",
  cursos: "Cursos",
  noticias: "Noticias",
  comunicados: "Comunicados",
  asignaciones: "Asignaciones de Materias",
  materias: "Materias",
  personal: "Personal",
  usuarios: "Usuarios",
  asistencias: "Asistencias",
};
const currentView = ref("alumnos");

const nombrePagina = (vista) => pageNames[vista] || "Inicio";

const setView = (vista) => {
    currentView.value = vista;
};
</script>

<style scoped>
.dash {
    display: grid;
    grid-template-columns: 200px 1fr;
    min-height: 600px;
    background: var(--color-background-tertiary, #f8f9fa);
    border-radius: var(--border-radius-lg, 12px);
    border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    overflow: hidden;
    font-size: 13px;
}

.main {
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.content {
    padding: 16px 20px;
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
}
</style>
