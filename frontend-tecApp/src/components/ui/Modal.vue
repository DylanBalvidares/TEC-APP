<template>
  <Teleport to="body">
    <div v-if="modelValue" class="modal-overlay active" @click.self="intentarCerrar">
      <div class="modal-content" :class="{ 'modal-wide': wide, 'modal-danger': variante === 'danger' }" role="dialog" :aria-modal="true" :aria-labelledby="tituloId" tabindex="-1" ref="container" @keydown="encerrarFoco">
        <div class="modal-header" v-if="$slots.header || title">
          <h3 :id="tituloId">{{ title }}</h3>
          <button class="close-modal" @click="intentarCerrar" aria-label="Cerrar">&times;</button>
        </div>
        <div class="modal-body">
          <slot />
        </div>
        <div class="modal-footer" v-if="$slots.footer">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, watch, ref, useId } from 'vue';
const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: '' },
  wide: Boolean,
  variante: { type: String, default: 'default' },
  // Cuando hay cambios sin guardar, el overlay y Escape no cierran.
  bloquearCierre: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'cierre-bloqueado']);
const container = ref(null);
let focoPrevio = null;
const tituloId = `modal-titulo-${useId()}`;

const close = () => emit('update:modelValue', false);

const intentarCerrar = () => {
  if (props.bloquearCierre) {
    emit('cierre-bloqueado');
    return;
  }
  close();
};

const handleKey = (e) => {
  if (props.modelValue && e.key === 'Escape') intentarCerrar();
};

// Focus trap: Tab circular dentro del diálogo.
const SELECTORES_FOCO = 'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])';
const encerrarFoco = (e) => {
  if (e.key !== 'Tab' || !container.value) return;
  const focos = [...container.value.querySelectorAll(SELECTORES_FOCO)].filter(
    (el) => !el.disabled,
  );
  if (focos.length === 0) {
    e.preventDefault();
    return;
  }
  const primero = focos[0];
  const ultimo = focos[focos.length - 1];
  if (e.shiftKey && document.activeElement === primero) {
    e.preventDefault();
    ultimo.focus();
  } else if (!e.shiftKey && document.activeElement === ultimo) {
    e.preventDefault();
    primero.focus();
  }
};

watch(() => props.modelValue, (open) => {
  if (open) {
    focoPrevio = document.activeElement;
    document.body.style.overflow = 'hidden';
    // focus first focusable
    setTimeout(() => {
      const el = container.value?.querySelector('[autofocus], input:not([type="hidden"]), select, textarea, button:not(.close-modal), a[href], [tabindex]:not([tabindex="-1"])');
      if (el) el.focus();
    }, 10);
  } else {
    document.body.style.overflow = '';
    // Restaura el foco al elemento que abrió el modal.
    if (focoPrevio && typeof focoPrevio.focus === 'function') {
      focoPrevio.focus();
    }
    focoPrevio = null;
  }
});

onUnmounted(() => {
  document.body.style.overflow = '';
  if (focoPrevio && typeof focoPrevio.focus === 'function') focoPrevio.focus();
});

onMounted(() => window.addEventListener('keydown', handleKey));
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>

<style scoped>
.modal-overlay.active { background: rgba(0,0,0,0.45); position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; z-index:1200; padding:16px; }
.modal-content { background: var(--card-bg, #fff); border:1px solid var(--color-border-tertiary, #e5e7eb); border-radius:12px; width:min(720px, 100%); max-height:min(84vh, 900px); overflow:auto; overscroll-behavior:contain; box-shadow:0 20px 50px rgba(0,0,0,0.22); }
.modal-wide { width:900px; }
.modal-danger .modal-header h3 { color:#b91c1c; }
.modal-danger .close-modal { color:#b91c1c; }
.modal-header { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px 20px; border-bottom:1px solid var(--color-border-tertiary, #e5e7eb); }
.modal-body { padding:18px 20px; }
.modal-footer { padding:12px 20px; border-top:1px solid var(--color-border-tertiary, #e5e7eb); display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap; }
.close-modal { background:transparent;border:0;font-size:20px;cursor:pointer; }
.close-modal:focus-visible { outline:3px solid rgba(205,50,44,.3); outline-offset:2px; border-radius:5px; }
@media (max-width: 640px) {
  .modal-overlay.active { align-items:flex-end; padding:8px; }
  .modal-content { width:100%; max-width:none; max-height:90vh; border-radius:14px 14px 10px 10px; }
  .modal-header, .modal-body { padding:15px 16px; }
  .modal-footer { padding:12px 16px; }
  .modal-footer > .tb-btn { flex:1 1 auto; }
}
</style>
