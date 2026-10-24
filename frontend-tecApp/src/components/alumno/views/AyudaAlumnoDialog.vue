<template>
  <Teleport to="body">
    <div v-if="modelValue" class="ayuda-overlay" @click.self="cerrar" @keydown.esc="cerrar">
      <section
        class="ayuda-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ayuda-titulo"
      >
        <header class="ayuda-header">
          <div>
            <span class="ayuda-eyebrow">GUÍA RÁPIDA</span>
            <h2 id="ayuda-titulo">¿En qué necesitás ayuda?</h2>
          </div>
          <button class="ayuda-cerrar" type="button" aria-label="Cerrar ayuda" @click="cerrar">
            <i class="fas fa-times" aria-hidden="true"></i>
          </button>
        </header>

        <nav class="ayuda-links" aria-label="Secciones de ayuda">
          <RouterLink to="/alumno/noticias" @click="navegar">
            <i class="fas fa-bullhorn" aria-hidden="true"></i>
            <span><strong>Noticias y comunicados</strong><small>Revisá avisos de la escuela y tu curso.</small></span>
            <i class="fas fa-chevron-right flecha" aria-hidden="true"></i>
          </RouterLink>
          <RouterLink to="/alumno/cursos" @click="navegar">
            <i class="fas fa-users" aria-hidden="true"></i>
            <span><strong>Mi curso</strong><small>Consultá materias, profesores y compañeros.</small></span>
            <i class="fas fa-chevron-right flecha" aria-hidden="true"></i>
          </RouterLink>
          <RouterLink to="/alumno/libreta" @click="navegar">
            <i class="fas fa-book-open" aria-hidden="true"></i>
            <span><strong>Libreta digital</strong><small>Revisá tus calificaciones e historial.</small></span>
            <i class="fas fa-chevron-right flecha" aria-hidden="true"></i>
          </RouterLink>
          <RouterLink to="/alumno/objetos-perdidos" @click="navegar">
            <i class="fas fa-box" aria-hidden="true"></i>
            <span><strong>Objetos perdidos</strong><small>Buscá o reportá un objeto.</small></span>
            <i class="fas fa-chevron-right flecha" aria-hidden="true"></i>
          </RouterLink>
        </nav>

        <p class="ayuda-contacto">
          Para consultas sobre notas, asistencia u otros trámites, acercate a preceptoría.
        </p>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({ modelValue: { type: Boolean, default: false } });
const emit = defineEmits(["update:modelValue", "navigate"]);
const cerrar = () => emit("update:modelValue", false);
const navegar = () => { cerrar(); emit("navigate"); };
</script>

<style scoped>
.ayuda-overlay { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 18px; background: rgb(15 23 42 / 55%); }
.ayuda-dialog { width: min(100%, 520px); padding: 24px; border: 1px solid #e2e8f0; border-radius: 18px; background: #fff; box-shadow: 0 24px 70px rgb(15 23 42 / 28%); }
.ayuda-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }
.ayuda-eyebrow { color: #b01020; font-size: .7rem; font-weight: 800; letter-spacing: .09em; }
.ayuda-header h2 { margin: 5px 0 0; color: #0f172a; font-size: 1.35rem; }
.ayuda-cerrar { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 9px; background: #f1f5f9; color: #334155; cursor: pointer; }
.ayuda-links { display: grid; gap: 8px; }
.ayuda-links a { display: flex; align-items: center; gap: 13px; padding: 12px; border: 1px solid #e2e8f0; border-radius: 12px; color: #b01020; text-decoration: none; }
.ayuda-links a:hover, .ayuda-links a:focus-visible { border-color: #e6a9af; background: #fff8f8; outline: none; }
.ayuda-links a > span { display: grid; flex: 1; gap: 3px; color: #0f172a; }
.ayuda-links strong { font-size: .9rem; }
.ayuda-links small { color: #64748b; font-size: .78rem; }
.ayuda-links .flecha { color: #94a3b8; font-size: .75rem; }
.ayuda-contacto { margin: 16px 0 0; padding: 12px; border-radius: 10px; background: #f8fafc; color: #475569; font-size: .85rem; line-height: 1.5; }
@media (max-width: 480px) { .ayuda-dialog { padding: 18px; } .ayuda-header h2 { font-size: 1.15rem; } }
</style>
