<template>
  <div class="loading-skeleton" role="status" aria-live="polite" aria-busy="true">
    <span class="sr-only">{{ label }}</span>
    <div class="skeleton-lines" aria-hidden="true">
      <div v-for="row in rows" :key="row" class="skeleton-row">
        <span v-for="column in columns" :key="column" class="skeleton-cell" :class="`cell-${column}`"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: "Cargando…" },
  rows: { type: Number, default: 4 },
  columns: { type: Number, default: 3 },
});
</script>

<style scoped>
.loading-skeleton { width: 100%; padding: 18px 16px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.skeleton-lines { display: grid; gap: 13px; }
.skeleton-row { display: flex; align-items: center; gap: 16px; }
.skeleton-cell { display: block; flex: 1 1 0; height: 13px; border-radius: 8px; background: linear-gradient(90deg, #edf0f3 20%, #f8f9fa 40%, #edf0f3 60%); background-size: 220% 100%; animation: skeleton-shimmer 1.35s ease-in-out infinite; }
.skeleton-cell.cell-1 { flex: 1.5 1 0; }
.skeleton-cell:last-child:not(:first-child) { max-width: 24%; }
@keyframes skeleton-shimmer { to { background-position-x: -220%; } }
@media (prefers-reduced-motion: reduce) { .skeleton-cell { animation: none; background: #edf0f3; } }
</style>
