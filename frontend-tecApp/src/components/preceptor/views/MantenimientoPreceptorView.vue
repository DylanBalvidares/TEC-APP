<template>
  <section class="maintenance-page" aria-labelledby="maintenance-title">
    <div class="maintenance-card">
      <div class="maintenance-illustration" aria-hidden="true">
        <i class="fas fa-screwdriver-wrench"></i>
      </div>

      <p class="maintenance-eyebrow">PANEL PRECEPTOR</p>
      <h1 id="maintenance-title">{{ sectionTitle }} en mantenimiento</h1>
      <p class="maintenance-copy">
        Estamos trabajando en esta sección para que pronto puedas usarla desde
        el panel de preceptor.
      </p>

      <div class="maintenance-status">
        <span class="status-dot" aria-hidden="true"></span>
        <span>Sección en preparación</span>
      </div>

      <RouterLink class="back-link" to="/preceptor/cursos">
        <i class="fas fa-arrow-left" aria-hidden="true"></i>
        Volver a cursos
      </RouterLink>
    </div>
  </section>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const sectionTitle = computed(() => {
  if (route.meta.maintenanceTitle && route.meta.maintenanceTitle !== "Sección") {
    return route.meta.maintenanceTitle;
  }

  const segment = route.path.split("/").filter(Boolean).at(-1) || "Sección";
  return segment
    .split("-")
    .map((word) => word.charAt(0).toLocaleUpperCase("es") + word.slice(1))
    .join(" ");
});
</script>

<style scoped>
.maintenance-page {
  display: grid;
  min-height: 100%;
  place-items: center;
  padding: 24px;
}

.maintenance-card {
  width: min(100%, 680px);
  padding: clamp(28px, 6vw, 56px);
  border: 1px solid #e2e8f0;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.1);
  text-align: center;
}

.maintenance-illustration {
  display: grid;
  width: 88px;
  height: 88px;
  margin: 0 auto 26px;
  place-items: center;
  border-radius: 26px;
  background: #fff1ed;
  color: #c2412d;
  font-size: 36px;
}

.maintenance-eyebrow {
  margin: 0 0 10px;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

h1 {
  margin: 0;
  color: #172033;
  font-size: clamp(25px, 4vw, 34px);
  line-height: 1.2;
}

.maintenance-copy {
  max-width: 470px;
  margin: 16px auto 0;
  color: #64748b;
  font-size: 16px;
  line-height: 1.65;
}

.maintenance-status {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  margin-top: 24px;
  padding: 9px 13px;
  border-radius: 999px;
  background: #f1f5f9;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f59e0b;
  box-shadow: 0 0 0 3px #fef3c7;
}

.back-link {
  display: flex;
  width: fit-content;
  align-items: center;
  justify-content: center;
  gap: 9px;
  margin: 30px auto 0;
  padding: 12px 18px;
  border-radius: 12px;
  background: #b42318;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: background 150ms ease, transform 150ms ease;
}

.back-link:hover {
  transform: translateY(-1px);
  background: #941d14;
}

.back-link:focus-visible {
  outline: 3px solid #fca5a5;
  outline-offset: 3px;
}

@media (max-width: 540px) {
  .maintenance-page {
    padding: 8px;
  }

  .maintenance-card {
    border-radius: 18px;
  }
}
</style>
