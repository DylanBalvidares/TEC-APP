<template>
  <svg
    class="inline-icon"
    :class="{ 'inline-icon-spinning': name === 'spinner' }"
    :data-icon="name"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'history'">
      <path d="M3 12a9 9 0 1 0 2.64-6.36L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </template>
    <template v-else-if="name === 'save'">
      <path d="M5 3h12l4 4v14H3V3h2Z" />
      <path d="M7 3v6h10V3M7 21v-8h10v8" />
    </template>
    <template v-else-if="name === 'key'">
      <circle cx="8" cy="15" r="5" />
      <path d="m11.5 11.5 9-9M17 6l3 3M14 9l3 3" />
    </template>
    <template v-else-if="name === 'clock'">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </template>
    <template v-else-if="name === 'lock-open'">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 7.7-1.5M12 14v3" />
    </template>
    <template v-else-if="name === 'spinner'">
      <circle cx="12" cy="12" r="9" stroke-dasharray="42 16" />
    </template>
  </svg>
</template>

<script setup>
defineProps({
  name: {
    type: String,
    required: true,
    validator: (value) => ["history", "save", "key", "clock", "lock-open", "spinner"].includes(value),
  },
  size: { type: [Number, String], default: 16 },
});
</script>

<style scoped>
.inline-icon { display: inline-block; flex: 0 0 auto; vertical-align: middle; }
.inline-icon-spinning { animation: inline-icon-spin .8s linear infinite; }
@keyframes inline-icon-spin { to { transform: rotate(360deg); } }
</style>
