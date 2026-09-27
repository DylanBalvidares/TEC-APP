<template>
  <span class="status-pill" :class="claseEstado" :title="title">{{ etiqueta }}</span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  // 'pendiente' | 'enviado' | 'fallido' | 'leido'
  estado: { type: String, default: "pendiente" },
});

const MAPA = {
  enviado: { clase: "sp-activo", texto: "Enviado" },
  fallido: { clase: "sp-baja", texto: "Fallido" },
  pendiente: { clase: "sp-pendiente", texto: "Pendiente" },
  leido: { clase: "sp-leido", texto: "Leído" },
};

const claseEstado = computed(() => MAPA[props.estado]?.clase || "sp-pendiente");
const etiqueta = computed(() => MAPA[props.estado]?.texto || props.estado || "—");
const title = computed(() =>
  props.estado === "fallido" ? "El envío falló (ver detalle)" : undefined,
);
</script>

<style scoped>
.status-pill {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
  display: inline-block;
  text-transform: capitalize;
  white-space: nowrap;
}
.sp-activo { background: #eaf3de; color: #3b6d11; }
.sp-baja { background: #fee2e2; color: #991b1b; }
.sp-pendiente { background: #fef3c7; color: #92400e; }
.sp-leido { background: #f3f4f6; color: #4b5563; }
</style>
