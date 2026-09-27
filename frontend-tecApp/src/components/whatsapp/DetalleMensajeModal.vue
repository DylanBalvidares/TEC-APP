<template>
  <Modal :model-value="modelValue" title="Detalle del mensaje" @update:model-value="$emit('update:modelValue', $event)">
    <div v-if="mensaje" class="detalle">
      <div class="detalle-meta">
        <div class="meta-item">
          <span class="meta-label">Fecha</span>
          <span>{{ formatoFechaHora(mensaje.fecha_envio) }}</span>
        </div>
        <div v-if="mensaje.id_remitente != null" class="meta-item">
          <span class="meta-label">Remitente (ID)</span>
          <span class="mono">#{{ mensaje.id_remitente }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Destinatario</span>
          <span>{{ mensaje.nombre_destinatario || `#${mensaje.id_destinatario}` }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Teléfono</span>
          <span class="mono">{{ mensaje.telefono_destino }}</span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Estado</span>
          <span><EstadoWhatsapp :estado="mensaje.estado" /></span>
        </div>
        <div class="meta-item">
          <span class="meta-label">Lectura</span>
          <span>{{ mensaje.leido ? `Leído (${formatoFechaHora(mensaje.fecha_lectura)})` : "Pendiente" }}</span>
        </div>
        <div v-if="mensaje.waba_message_id" class="meta-item">
          <span class="meta-label">ID proveedor</span>
          <span class="mono">{{ mensaje.waba_message_id }}</span>
        </div>
      </div>
      <div class="detalle-cuerpo">
        <span class="meta-label">Mensaje</span>
        <p class="cuerpo-texto">{{ mensaje.cuerpo }}</p>
      </div>
      <div v-if="mensaje.error_detalle" class="detalle-error">
        <span class="meta-label">Detalle del error</span>
        <p class="error-texto">{{ mensaje.error_detalle }}</p>
      </div>
    </div>
    <template #footer>
      <button class="tb-btn outline" @click="$emit('update:modelValue', false)">Cerrar</button>
    </template>
  </Modal>
</template>

<script setup>
import Modal from "@/components/ui/Modal.vue";
import EstadoWhatsapp from "./EstadoWhatsapp.vue";
import { formatoFechaHora } from "@/composables/useFechaHora.js";

defineProps({
  modelValue: { type: Boolean, default: false },
  mensaje: { type: Object, default: null },
});

defineEmits(["update:modelValue"]);
</script>

<style scoped>
.detalle { display: flex; flex-direction: column; gap: 16px; }
.detalle-meta {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px 16px;
}
.meta-item { display: flex; flex-direction: column; gap: 2px; font-size: 13px; }
.meta-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-tertiary, #6b7280);
  font-weight: 600;
}
.mono { font-family: monospace; font-size: 12px; color: #4b5563; }
.cuerpo-texto {
  margin: 4px 0 0;
  white-space: pre-wrap;
  word-break: break-word;
  background: #f0f2e5;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13.5px;
  line-height: 1.5;
}
.detalle-error .error-texto {
  margin: 4px 0 0;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
