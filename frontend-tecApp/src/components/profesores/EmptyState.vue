<template>
  <div class="empty-state empty-state--centered" role="status">
    <div class="empty-icon" aria-hidden="true">
      <slot name="icon">
        <i :class="icon"></i>
      </slot>
    </div>
    <div class="empty-text">
      <slot>{{ message }}</slot>
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'fas fa-inbox' },
  message: { type: String, default: '' }
});
</script>

<style scoped>
.empty-state {
  text-align: center;
  color: var(--muted);
}
.empty-icon i,
.empty-icon {
  font-size: 2rem;
  color: #cbd5e1;
  margin-bottom: 10px;
}
.empty-text p,
.empty-text {
  font-size: 0.95rem;
}
</style>
