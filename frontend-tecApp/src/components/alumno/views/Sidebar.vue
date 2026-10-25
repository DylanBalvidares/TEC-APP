<template>
  <RoleSidebar
    id="sidebar-alumno"
    label="Navegación del alumno"
    :groups="navigationByRole.alumno"
    :open="abierto"
    :collapsed="colapsado"
    @close="$emit('close')"
  >
    <template #footer>
      <button class="sidebar-help" id="sidebar-help-btn" type="button" @click="ayudaAbierta = true">
        <i class="fas fa-circle-question" aria-hidden="true"></i>
        <span><strong>¿Necesitás ayuda?</strong><small>Guía de secciones.</small></span>
      </button>
    </template>
  </RoleSidebar>
  <AyudaAlumnoDialog v-model="ayudaAbierta" @navigate="$emit('close')" />
</template>

<script setup>
import { ref } from "vue";
import AyudaAlumnoDialog from "./AyudaAlumnoDialog.vue";
import RoleSidebar from "../../ui/RoleSidebar.vue";
import { navigationByRole } from "../../../config/role-navigation.js";

const ayudaAbierta = ref(false);

defineProps({
  abierto: { type: Boolean, default: false },
  colapsado: { type: Boolean, default: false },
});

defineEmits(["close"]);
</script>

<style scoped>
.sidebar-help { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px; border: 0; border-radius: 9px; background: #f9fafb; color: #374151; text-align: left; cursor: pointer; }
.sidebar-help i { width: 26px; text-align: center; color: #b42318; }
.sidebar-help span { display: grid; gap: 2px; }
.sidebar-help strong { font-size: .8rem; }
.sidebar-help small { color: #6b7280; font-size: .7rem; }
</style>
