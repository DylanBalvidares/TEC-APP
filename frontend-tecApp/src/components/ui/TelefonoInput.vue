<template>
  <div class="telefono-input">
    <input
      :id="id"
      :value="modelValue"
      type="tel"
      inputmode="tel"
      autocomplete="tel"
      :placeholder="placeholder"
      :required="requerido"
      :class="{ 'input-error': errorExterno }"
      @input="onInput"
      @blur="onBlur"
    />
    <small v-if="vistaPrevia" class="telefono-preview" :class="`telefono-${vistaPrevia.estado}`">
      <i class="ti" :class="vistaPrevia.estado === 'ok' ? 'ti-check' : 'ti-alert-triangle'"></i>
      {{ vistaPrevia.texto }}
    </small>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { analizarTelefono, formatearTelefonoAR, filtrarEntradaTelefono } from "@/utils/telefonos.js";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  id: { type: String, default: undefined },
  placeholder: { type: String, default: "Ej: 2364 71-5375" },
  requerido: { type: Boolean, default: false },
  errorExterno: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "blur"]);

const vistaPrevia = ref(null);

const onInput = (e) => {
  emit("update:modelValue", filtrarEntradaTelefono(e.target.value));
};

const onBlur = () => {
  const v = String(props.modelValue ?? "").trim();
  if (!v) {
    vistaPrevia.value = null;
  } else {
    const r = analizarTelefono(v);
    vistaPrevia.value =
      r.estado === "ok"
        ? { estado: "ok", texto: `Se enviará al ${formatearTelefonoAR(r.normalizado)}` }
        : { estado: "error", texto: r.mensaje };
  }
  emit("blur");
};

watch(
  () => props.modelValue,
  () => {
    vistaPrevia.value = null;
  },
);
</script>

<style scoped>
.telefono-input { display: flex; flex-direction: column; gap: 4px; }
.telefono-preview { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.telefono-ok { color: #137333; }
.telefono-error { color: #a50e0e; }
</style>
