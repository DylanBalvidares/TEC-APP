<template>
  <AppTopbar
    :current-page="currentPage"
    :sidebar-abierto="sidebarAbierto"
    @toggle-sidebar="$emit('toggle-sidebar')"
    @ir-inicio="$emit('ir-inicio')"
    @ver-perfil="$emit('ver-perfil')"
  />
</template>

<script setup>
import AppTopbar from '../../ui/AppTopbar.vue';
defineProps({ currentPage: { type: String, default: 'Inicio' }, sidebarAbierto: Boolean });
defineEmits(['toggle-sidebar', 'ir-inicio', 'ver-perfil']);
</script>
