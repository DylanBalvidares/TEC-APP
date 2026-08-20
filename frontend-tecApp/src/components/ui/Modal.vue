<template>
  <div v-if="modelValue" class="modal-overlay active" @click.self="close">
    <div class="modal-content" :class="{ 'modal-wide': wide }" role="dialog" :aria-modal="true" :aria-label="title || 'Dialog'" tabindex="-1" ref="container">
      <div class="modal-header" v-if="$slots.header || title">
        <h3>{{ title }}</h3>
        <button class="close-modal" @click="close" aria-label="Cerrar">&times;</button>
      </div>
      <div class="modal-body">
        <slot />
      </div>
      <div class="modal-footer" v-if="$slots.footer">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, watch, ref } from 'vue';
const props = defineProps({ modelValue: Boolean, title: { type: String, default: '' }, wide: Boolean });
const emit = defineEmits(['update:modelValue']);
const container = ref(null);

const close = () => emit('update:modelValue', false);

const handleKey = (e) => { if (e.key === 'Escape') close(); };

watch(() => props.modelValue, (open) => {
  if (open) {
    // focus first focusable
    setTimeout(() => {
      const el = container.value?.querySelector('input,button,textarea,a,[tabindex]');
      if (el) el.focus();
    }, 10);
  }
});

onMounted(() => window.addEventListener('keydown', handleKey));
onUnmounted(() => window.removeEventListener('keydown', handleKey));
</script>

<style scoped>
.modal-overlay.active { background: rgba(0,0,0,0.45); position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; z-index:1200; }
.modal-content { background: var(--card-bg, #fff); border-radius:8px; width:720px; max-width:95%; max-height:80vh; overflow:auto; box-shadow:0 10px 30px rgba(0,0,0,0.15); }
.modal-wide { width:900px; }
.modal-header { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #eee; }
.modal-body { padding:18px 20px; }
.modal-footer { padding:12px 20px; border-top:1px solid #eee; display:flex; gap:8px; justify-content:flex-end; }
.close-modal { background:transparent;border:0;font-size:20px;cursor:pointer; }
</style>
