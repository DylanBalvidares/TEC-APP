<template>
  <div class="conf-lectura">
    <div class="conf-lectura-header">
      <span class="conf-lectura-titulo">
        <i class="ti ti-checkbox" aria-hidden="true"></i>
        Confirmaciones de lectura
      </span>
      <button
        type="button"
        class="conf-refrescar"
        title="Actualizar confirmaciones"
        @click="cargar"
      >
        <i class="ti ti-refresh"></i>
      </button>
    </div>

    <div v-if="cargando" class="conf-estado" role="status">
      <i class="ti ti-loader-2 animate-spin"></i>
      <span>Cargando confirmaciones…</span>
    </div>

    <div v-else-if="error" class="conf-estado conf-error">
      <i class="ti ti-alert-circle"></i>
      <span>{{ error }}</span>
    </div>

    <template v-else>
      <div class="conf-resumen">
        <div class="conf-barra-contenedor">
          <div class="conf-barra" :style="{ width: porcentaje + '%' }"></div>
        </div>
        <div class="conf-totales">
          <strong>
            {{ confirmaciones.leidos }} de {{ confirmaciones.total }} leyeron
          </strong>
          <span v-if="confirmaciones.sinCuenta > 0" class="conf-sin-cuenta">
            + {{ confirmaciones.sinCuenta }} sin cuenta (no pueden confirmar)
          </span>
        </div>
      </div>

      <div class="conf-tabs">
        <button
          type="button"
          :class="{ activo: filtro === 'leidos' }"
          @click="filtro = 'leidos'"
        >
          Leídos ({{ confirmaciones.leidos }})
        </button>
        <button
          type="button"
          :class="{ activo: filtro === 'pendientes' }"
          @click="filtro = 'pendientes'"
        >
          Pendientes ({{ confirmaciones.pendientes }})
        </button>
      </div>

      <div class="conf-lista">
        <div
          v-for="d in filtrados"
          :key="d.id_usuario"
          class="conf-fila"
          :class="{ leido: d.leida }"
        >
          <span class="conf-punto" aria-hidden="true"></span>
          <span class="conf-nombre">{{ d.apellido }}, {{ d.nombre }}</span>
          <span class="conf-rol">{{ etiquetaRol(d.id_rol) }}</span>
          <span class="conf-fecha">
            {{ d.leida ? formatearFecha(d.leida_en) : "—" }}
          </span>
        </div>
        <div v-if="filtrados.length === 0" class="conf-vacio">
          Nada por acá.
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

import { obtenerConfirmacionesLectura } from "../../services/comunidad-service.js";

const props = defineProps({
  idComunicado: { type: [Number, String], required: true },
});

const ETIQUETAS_ROL = {
  1: "Alumno",
  2: "Delegado",
  3: "Profesor",
  4: "Preceptor",
  5: "Bibliotecario",
  6: "Tutor",
  7: "Administrativo",
  8: "Root",
};

const cargando = ref(false);
const error = ref("");
const confirmaciones = ref(null);
const filtro = ref("leidos");

const porcentaje = computed(() => {
  if (!confirmaciones.value || !confirmaciones.value.total) return 0;
  return Math.round((confirmaciones.value.leidos / confirmaciones.value.total) * 100);
});

const filtrados = computed(() => {
  if (!confirmaciones.value) return [];
  return confirmaciones.value.destinatarios.filter((d) =>
    filtro.value === "leidos" ? d.leida : !d.leida,
  );
});

const etiquetaRol = (idRol) => ETIQUETAS_ROL[idRol] || `Rol ${idRol}`;

const formatearFecha = (iso) => {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

async function cargar() {
  cargando.value = confirmaciones.value === null;
  error.value = "";
  try {
    const resultado = await obtenerConfirmacionesLectura(props.idComunicado);
    if (!resultado.success) throw new Error(resultado.message);
    confirmaciones.value = resultado.data;
  } catch (e) {
    error.value = e?.message || "No se pudieron cargar las confirmaciones.";
  } finally {
    cargando.value = false;
  }
}

// Cambiando de comunicado en el detalle, se recarga el padrón.
watch(
  () => props.idComunicado,
  () => {
    filtro.value = "leidos";
    cargar();
  },
  { immediate: true },
);
</script>

<style scoped>
.conf-lectura {
  margin-top: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}

.conf-lectura-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  background: #f8fafc;
  border-bottom: 1px solid #eef2f7;
}

.conf-lectura-titulo {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 700;
  color: #111827;
}

.conf-lectura-titulo i {
  color: #1a7f4b;
}

.conf-refrescar {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #4b5563;
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  cursor: pointer;
}

.conf-refrescar:hover {
  background: #f9fafb;
}

.conf-estado {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 12px;
  color: #6b7280;
  font-size: 12.5px;
}

.conf-error {
  color: #b91c1c;
}

/* ── Resumen ─────────────────────────────────────────────────────────────── */
.conf-resumen {
  padding: 12px 14px 10px;
}

.conf-barra-contenedor {
  height: 8px;
  border-radius: 999px;
  background: #eef2f7;
  overflow: hidden;
}

.conf-barra {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #1a7f4b, #22a35d);
  transition: width 0.3s ease;
}

.conf-totales {
  margin-top: 8px;
  font-size: 12.5px;
  color: #111827;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: baseline;
}

.conf-sin-cuenta {
  font-size: 11px;
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 999px;
  padding: 1px 8px;
}

/* ── Tabs ────────────────────────────────────────────────────────────────── */
.conf-tabs {
  display: flex;
  gap: 6px;
  padding: 0 14px;
}

.conf-tabs button {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #4b5563;
  font-size: 11.5px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 999px;
  cursor: pointer;
}

.conf-tabs button.activo {
  background: #eef6f1;
  border-color: #1a7f4b;
  color: #14603a;
}

/* ── Lista ───────────────────────────────────────────────────────────────── */
.conf-lista {
  margin-top: 8px;
  max-height: 260px;
  overflow-y: auto;
}

.conf-fila {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  font-size: 12.5px;
  border-top: 1px solid #f3f4f6;
}

.conf-punto {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #d1d5db;
  flex: none;
}

.conf-fila.leido .conf-punto {
  background: #22a35d;
}

.conf-nombre {
  flex: 1;
  font-weight: 600;
  color: #111827;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conf-rol {
  color: #6b7280;
  font-size: 11px;
  background: #f3f4f6;
  border-radius: 999px;
  padding: 1px 8px;
}

.conf-fecha {
  color: #9ca3af;
  font-size: 11px;
  min-width: 84px;
  text-align: right;
}

.conf-vacio {
  padding: 16px;
  text-align: center;
  color: #6b7280;
  font-size: 12px;
}
</style>
