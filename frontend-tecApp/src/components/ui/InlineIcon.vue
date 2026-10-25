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
    <template v-else-if="name === 'book-open'">
      <path d="M12 7v14" />
      <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H12v18H5.5A2.5 2.5 0 0 0 3 23V5.5ZM21 5.5A2.5 2.5 0 0 0 18.5 3H12v18h6.5A2.5 2.5 0 0 1 21 23V5.5Z" />
    </template>
    <template v-else-if="name === 'shield'">
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </template>
    <template v-else-if="name === 'users'">
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </template>
    <template v-else-if="name === 'school'">
      <path d="m3 10 9-7 9 7" />
      <path d="M5 9v11h14V9M9 20v-6h6v6M3 21h18" />
    </template>
    <template v-else-if="name === 'alert'">
      <path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4m0 4h.01" />
    </template>
    <template v-else-if="name === 'edit'">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </template>
    <template v-else-if="name === 'eye'">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </template>
    <template v-else-if="name === 'student'">
      <path d="m2 9 10-5 10 5-10 5L2 9Z" />
      <path d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v6" />
    </template>
    <template v-else-if="name === 'book'">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22V4.5ZM4 18a2.5 2.5 0 0 1 2.5-2.5H20" />
    </template>
    <template v-else-if="name === 'clipboard-check'">
      <rect x="5" y="4" width="14" height="18" rx="2" />
      <path d="M9 4.5V3h6v1.5M8 13l2.5 2.5L16 10" />
    </template>
    <template v-else-if="name === 'search'">
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 5 5" />
    </template>
    <template v-else-if="name === 'arrow-right'">
      <path d="M5 12h14M13 6l6 6-6 6" />
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
      validator: (value) => [
        "history", "save", "key", "clock", "lock-open", "spinner", "book-open", "shield",
        "users", "school", "alert", "edit", "eye", "student", "book", "clipboard-check",
        "search", "arrow-right",
      ].includes(value),
  },
  size: { type: [Number, String], default: 16 },
});
</script>

<style scoped>
.inline-icon { display: inline-block; flex: 0 0 auto; vertical-align: middle; }
.inline-icon-spinning { animation: inline-icon-spin .8s linear infinite; }
@keyframes inline-icon-spin { to { transform: rotate(360deg); } }
</style>
