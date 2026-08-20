<template>
  <div class="ui-card">
    <slot />
  </div>
</template>

<script setup>
</script>

<style scoped>
.ui-card { background: var(--card-bg,#fff); border-radius:8px; padding:14px; box-shadow:0 6px 18px rgba(0,0,0,0.06); }
</style>
