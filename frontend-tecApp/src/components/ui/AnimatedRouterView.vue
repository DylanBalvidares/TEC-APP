<template>
  <RouterView v-slot="{ Component, route }">
    <Transition name="route-fade" mode="out-in">
      <div :key="route.matched[depth]?.path || route.fullPath" class="route-transition-shell">
        <component :is="Component" />
      </div>
    </Transition>
  </RouterView>
</template>

<script setup>
defineProps({ depth: { type: Number, default: 0 } });
</script>
