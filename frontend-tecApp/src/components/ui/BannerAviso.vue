<template>
    <div
        v-if="mensaje"
        :class="variante === 'exito' ? 'exito-banner' : 'error-banner'"
        :role="variante === 'exito' ? 'status' : 'alert'"
        aria-live="polite"
    >
        <i class="ti" :class="variante === 'exito' ? 'ti-check-circle' : 'ti-alert-circle'"></i>
        {{ mensaje }}
        <slot />
    </div>
</template>

<script setup>
// Banner de aviso accesible: los lectores de pantalla anuncian el mensaje
// (aria-live polite) sin mover el foco.
defineProps({
    mensaje: { type: String, default: "" },
    variante: { type: String, default: "error" },
});
</script>
