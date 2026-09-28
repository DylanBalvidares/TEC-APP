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
import { onMounted, onUnmounted, watch, ref } from 'vue';
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
let contadorTitulo = 0;
const tituloId = `modal-titulo-${++contadorTitulo}`;

const close = () => emit('update:modelValue', false);

const intentarCerrar = () => {
  if (props.bloquearCierre) {
    emit('cierre-bloqueado');
    return;
  }
  close();
};

const handleKey = (e) => { if (e.key === 'Escape') intentarCerrar(); };

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
      const el = container.value?.querySelector('input,button,textarea,a,[tabindex]');
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

onUnmounted(() => { document.body.style.overflow = ''; });

onMounted(() => window.addEventListener('keydown', handleKey));
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>

<style scoped>
.modal-overlay.active { background: rgba(0,0,0,0.45); position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; z-index:1200; }
.modal-content { background: var(--card-bg, #fff); border-radius:8px; width:720px; max-width:95%; max-height:80vh; overflow:auto; box-shadow:0 10px 30px rgba(0,0,0,0.15); }
.modal-wide { width:900px; }
.modal-danger .modal-header h3 { color:#b91c1c; }
.modal-danger .close-modal { color:#b91c1c; }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #eee; }
.modal-body { padding:18px 20px; }
.modal-footer { padding:12px 20px; border-top:1px solid #eee; display:flex; gap:8px; justify-content:flex-end; }
.close-modal { background:transparent;border:0;font-size:20px;cursor:pointer; }
</style>
