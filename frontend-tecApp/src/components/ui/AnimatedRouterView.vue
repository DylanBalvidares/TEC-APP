<template>
  <RouterView :depth="depth" v-slot="{ Component, route }">
    <Transition name="route-fade" mode="out-in">
      <component :is="Component" :key="route.matched[depth]?.path || route.fullPath" />
    </Transition>
  </RouterView>
</template>

<script setup>
defineProps({ depth: { type: Number, default: 0 } });
</script>
