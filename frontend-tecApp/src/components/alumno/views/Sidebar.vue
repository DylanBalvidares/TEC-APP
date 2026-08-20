<template>
  <aside class="sidebar" :class="{ open: abierto }" id="sidebar-alumno">
    <div class="sidebar-inner">
      <!-- Mobile close button -->
      <button class="sidebar-close" @click="$emit('close')" aria-label="Cerrar menú">
        <i class="fas fa-times"></i>
      </button>

      <nav class="sidebar-nav">
        <ul>
        <li>
          <RouterLink to="/alumno/inicio" active-class="active" @click="$emit('close')">
            <div class="nav-icon"><i class="fas fa-home"></i></div>
            <span>Inicio</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/alumno/noticias" active-class="active" @click="$emit('close')">
            <div class="nav-icon"><i class="fas fa-newspaper"></i></div>
            <span>Noticias</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/alumno/cursos" active-class="active" @click="$emit('close')">
            <div class="nav-icon"><i class="fas fa-graduation-cap"></i></div>
            <span>Cursos</span>
          </RouterLink>
        </li>
        <li>
          <RouterLink to="/alumno/objetos-perdidos" active-class="active" @click="$emit('close')">
            <div class="nav-icon"><i class="fas fa-box"></i></div>
            <span>Objetos Perdidos</span>
          </RouterLink>
        </li>
      </ul>
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-help" id="sidebar-help-btn">
          <div class="help-icon">
            <i class="fas fa-question-circle"></i>
          </div>
          <div class="help-text">
            <p class="help-title">¿Necesitás ayuda?</p>
            <p class="help-sub">Pixelina resolverá tu consulta.</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  abierto: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close"]);
</script>

<style scoped>
.sidebar {
  width: 250px;
  min-width: 250px;
  background: linear-gradient(180deg, #b01020 0%, #7a0a18 45%, #3a0008 100%);
  color: white;
  flex-shrink: 0;
  position: sticky;
  top: 70px;
  height: calc(100vh - 70px);
  z-index: 100;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 4px 0 16px rgba(0,0,0,0.08);
}

.sidebar-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 12px;
}

.sidebar-close {
  display: none;
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.sidebar-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.sidebar-nav {
  flex: 1;
  margin-top: 8px;
}

.sidebar-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sidebar-nav a {
  text-decoration: none;
  color: inherit;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
}

.sidebar-nav li {
  border-radius: 12px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 0.93rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.sidebar-nav li:hover {
  background: rgba(255, 255, 255, 0.12);
}

.nav-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.sidebar-nav a:hover {
  color: #fff;
}

.sidebar-nav a:hover .nav-icon {
  background: rgba(255, 255, 255, 0.22);
}

.sidebar-nav a.active {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-weight: 700;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255,255,255,0.12);
}

.sidebar-nav a.active .nav-icon {
  background: rgba(255, 255, 255, 0.32);
  box-shadow: 0 0 12px rgba(255,255,255,0.15);
}

/* Footer help card */
.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid rgba(255,255,255,0.08);
  margin-top: 8px;
}

.sidebar-help {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  padding: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sidebar-help:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.22);
}

.help-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.75);
  flex-shrink: 0;
}

.help-title {
  font-size: 0.82rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.help-sub {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 3px 0 0 0;
}

/* Responsive */
@media (max-width: 900px) {
  .sidebar {
    position: fixed;
    left: 0;
    top: 0;
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
    z-index: 200;
  }

  .sidebar.open {
    transform: translateX(0);
    box-shadow: 6px 0 32px rgba(0, 0, 0, 0.3);
  }

  .sidebar-close {
    display: flex;
  }

  .sidebar-inner {
    padding-top: 56px;
  }
}
</style>
