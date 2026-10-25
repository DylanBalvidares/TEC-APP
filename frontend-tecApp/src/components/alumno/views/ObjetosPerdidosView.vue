<template>
  <Modal v-model="dialogOpen" title="Funcionalidad en desarrollo">
    <div class="desarrollo-content">
      <span class="desarrollo-icon" aria-hidden="true">
        <i class="fas fa-box-open"></i>
      </span>
      <p>La sección de objetos perdidos está en desarrollo. Pronto vas a poder consultar y reportar objetos desde acá.</p>
    </div>
    <template #footer>
      <button class="btn-volver" type="button" @click="volverAlInicio">Volver al inicio</button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRouter } from "vue-router";
import Modal from "@/components/ui/Modal.vue";

const router = useRouter();
const dialogOpen = ref(true);

watch(dialogOpen, (open) => {
  if (!open) router.replace("/alumno/inicio");
});

const volverAlInicio = () => {
  router.replace("/alumno/inicio");
};
</script>

<style scoped>
.desarrollo-content { display: flex; align-items: center; gap: 16px; color: #475569; line-height: 1.55; }
.desarrollo-content p { margin: 0; }
.desarrollo-icon { display: grid; place-items: center; flex: 0 0 48px; width: 48px; height: 48px; border-radius: 14px; background: #fef2f2; color: #b42318; font-size: 20px; }
.btn-volver { padding: 9px 14px; border: 1px solid #cd322c; border-radius: 8px; background: #cd322c; color: #fff; font: inherit; font-weight: 600; cursor: pointer; }
.btn-volver:focus-visible { outline: 3px solid #fca5a5; outline-offset: 2px; }
@media (max-width: 480px) { .desarrollo-content { align-items: flex-start; } }
</style>
