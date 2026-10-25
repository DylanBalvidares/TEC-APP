<template>
  <span ref="wrapperRef" class="help-popover-wrapper">
    <button
      type="button"
      class="help-popover-btn"
      :class="{ active: isOpen, 'popover-mode': tipo === 'popover' }"
      :aria-label="ariaLabel || 'Información de ayuda'"
      :aria-expanded="isOpen"
      @click.stop="toggle"
    >
      <i :class="icono"></i>
    </button>

    <Transition name="popover-fade">
      <div
        v-if="isOpen"
        class="help-popover-panel"
        :class="[tipo, posicion, { 'has-title': !!titulo }]"
        role="dialog"
        @click.stop
      >
        <div v-if="titulo" class="help-popover-header">
          <span class="help-popover-title">
            <i v-if="iconoTitulo" :class="iconoTitulo"></i>
            {{ titulo }}
          </span>
          <button
            type="button"
            class="help-popover-close"
            aria-label="Cerrar ayuda"
            @click.stop="close"
          >
            ×
          </button>
        </div>

        <div class="help-popover-body">
          <slot>{{ texto }}</slot>
        </div>
      </div>
    </Transition>
  </span>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const props = defineProps({
  tipo: {
    type: String,
    default: "tooltip", // 'tooltip' | 'popover'
  },
  texto: {
    type: String,
    default: "",
  },
  titulo: {
    type: String,
    default: "",
  },
  icono: {
    type: String,
    default: "fas fa-question",
  },
  iconoTitulo: {
    type: String,
    default: "",
  },
  posicion: {
    type: String,
    default: "top", // 'top' | 'bottom' | 'right' | 'left'
  },
  ariaLabel: {
    type: String,
    default: "",
  },
});

const isOpen = ref(false);
const wrapperRef = ref(null);

const toggle = () => {
  isOpen.value = !isOpen.value;
};

const close = () => {
  isOpen.value = false;
};

const handleClickOutside = (event) => {
  if (wrapperRef.value && !wrapperRef.value.contains(event.target)) {
    close();
  }
};

const handleKeydown = (event) => {
  if (event.key === "Escape" && isOpen.value) {
    close();
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
  document.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
.help-popover-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  margin-left: 6px;
  line-height: 1;
}

.help-popover-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 50%;
  background: #f1f5f9;
  color: #475569;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.help-popover-btn:hover {
  background: #e2e8f0;
  color: #0284c7;
  border-color: #94a3b8;
}

.help-popover-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.2);
}

.help-popover-panel {
  position: absolute;
  z-index: 2000;
  box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.18), 0 4px 8px -2px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  line-height: 1.45;
  text-align: left;
}

/* Tooltip (fondo oscuro, breve) */
.help-popover-panel.tooltip {
  background: #0f172a;
  color: #f8fafc;
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 400;
  width: max-content;
  max-width: 260px;
  border: 1px solid #334155;
}

/* Popover (fondo blanco, estructurado con título o contenido rico) */
.help-popover-panel.popover {
  background: #ffffff;
  color: #1e293b;
  padding: 12px 14px;
  font-size: 12.5px;
  width: 290px;
  max-width: 90vw;
  border: 1px solid #cbd5e1;
}

/* Posición TOP */
.help-popover-panel.top {
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
}
.help-popover-panel.tooltip.top::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 5px;
  border-style: solid;
  border-color: #0f172a transparent transparent transparent;
}
.help-popover-panel.popover.top::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border-width: 6px;
  border-style: solid;
  border-color: #ffffff transparent transparent transparent;
}

/* Posición BOTTOM */
.help-popover-panel.bottom {
  top: calc(100% + 8px);
  left: 0;
}
.help-popover-panel.tooltip.bottom::after {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 10px;
  border-width: 5px;
  border-style: solid;
  border-color: transparent transparent #0f172a transparent;
}
.help-popover-panel.popover.bottom::after {
  content: "";
  position: absolute;
  bottom: 100%;
  left: 10px;
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent #ffffff transparent;
}

/* Posición BOTTOM RIGHT (para inputs cerca del borde derecho) */
.help-popover-panel.bottom-right {
  top: calc(100% + 8px);
  right: 0;
  left: auto;
}
.help-popover-panel.popover.bottom-right::after {
  content: "";
  position: absolute;
  bottom: 100%;
  right: 10px;
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent #ffffff transparent;
}

.help-popover-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #f1f5f9;
}

.help-popover-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
  color: #0f172a;
}

.help-popover-title i {
  color: #0284c7;
}

.help-popover-close {
  background: transparent;
  border: none;
  font-size: 18px;
  line-height: 1;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 4px;
}

.help-popover-close:hover {
  color: #0f172a;
}

.help-popover-body {
  color: #334155;
}

.help-popover-panel.tooltip .help-popover-body {
  color: #f8fafc;
}

/* Animaciones */
.popover-fade-enter-active,
.popover-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.popover-fade-enter-from,
.popover-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
.help-popover-panel.top.popover-fade-enter-from,
.help-popover-panel.top.popover-fade-leave-to {
  transform: translateX(-50%) translateY(4px);
}
</style>
