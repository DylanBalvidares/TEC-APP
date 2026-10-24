<template>
  <div class="campanita" ref="contenedor">
    <button
      type="button"
      class="campanita-btn"
      :aria-label="ariaBoton"
      aria-haspopup="true"
      :aria-expanded="abierto"
      @click.stop="alternar"
    >
      <i :class="icono" aria-hidden="true"></i>
      <span v-if="noLeidas > 0" class="campanita-badge">{{ etiquetaBadge }}</span>
    </button>

    <transition name="campanita-fade">
      <div v-if="abierto" class="campanita-panel" role="dialog" aria-label="Notificaciones">
        <div class="campanita-cabecera">
          <span class="campanita-titulo">
            <i class="ti ti-bell" aria-hidden="true"></i>
            Notificaciones
            <span v-if="noLeidas > 0" class="campanita-contador">{{ noLeidas }} sin leer</span>
          </span>
          <button
            v-if="noLeidas > 0"
            type="button"
            class="campanita-marcar-todas"
            :disabled="marcandoTodas"
            @click="marcarTodas"
          >
            {{ marcandoTodas ? "Marcando…" : "Marcar todas" }}
          </button>
        </div>

        <div v-if="cargando" class="campanita-vacia" role="status">
          <i class="ti ti-loader-2 animate-spin"></i>
          <p>Cargando notificaciones…</p>
        </div>

        <div v-else-if="error" class="campanita-vacia">
          <i class="ti ti-alert-circle"></i>
          <p>{{ error }}</p>
          <button type="button" class="campanita-reintentar" @click="cargar">Reintentar</button>
        </div>

        <div v-else-if="notificaciones.length === 0" class="campanita-vacia">
          <i class="ti ti-bell-off"></i>
          <p>No tenés notificaciones.</p>
        </div>

        <ul v-else class="campanita-lista">
          <li
            v-for="n in notificaciones"
            :key="n.id_notificacion"
            class="campanita-item"
            :class="{ leida: n.leida }"
          >
            <span class="campanita-punto" aria-hidden="true"></span>
            <button
              type="button"
              class="campanita-item-btn"
              :aria-label="`${n.leida ? 'Leída' : 'Sin leer'}: ${n.titulo}. ${n.cuerpo || ''}`"
              @click="abrir(n)"
            >
              <span class="campanita-item-titulo">
                {{ n.titulo }}
                <span class="campanita-tipo">{{ n.tipo }}</span>
                <span class="campanita-estado" :class="{ nueva: !n.leida }">{{ n.leida ? "Leída" : "Nueva" }}</span>
              </span>
              <span class="campanita-item-meta">
                {{ n.cuerpo || "" }}
              </span>
              <span class="campanita-fecha">{{ formatearFecha(n.fecha) }}</span>
            </button>
          </li>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";

import {
  obtenerMisNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from "../../services/notificaciones-service.js";
import { marcarComunicadoLeido } from "../../services/comunidad-service.js";
import { toast } from "../../services/toast-service.js";
import { usarEventos } from "../../composables/useEventos.js";
import { useAuthStore } from "../../stores/auth.js";

// Icono configurable: los paneles de alumno/preceptor/profesor usan Font
// Awesome (fas) y el administrador Tabler (ti).
const props = defineProps({
  icono: { type: String, default: "fas fa-bell" },
});
const authStore = useAuthStore();
const router = useRouter();

const noLeidas = ref(0);
const notificaciones = ref([]);
const abierto = ref(false);
const cargando = ref(false);
const marcandoTodas = ref(false);
const error = ref("");
const contenedor = ref(null);

const etiquetaBadge = computed(() => (noLeidas.value > 9 ? "9+" : String(noLeidas.value)));

const ariaBoton = computed(() =>
  noLeidas.value > 0
    ? `Notificaciones (${noLeidas.value} sin leer)`
    : "Notificaciones",
);

function formatearFecha(iso) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function cargar() {
  cargando.value = notificaciones.value.length === 0;
  error.value = "";
  try {
    const resultado = await obtenerMisNotificaciones(false);
    if (!resultado.success) throw new Error(resultado.message);
    notificaciones.value = resultado.data || [];
    noLeidas.value = notificaciones.value.filter((n) => !n.leida).length;
  } catch (e) {
    error.value = e?.message || "No se pudieron cargar las notificaciones.";
  } finally {
    cargando.value = false;
  }
}

function alternar() {
  if (abierto.value) {
    abierto.value = false;
    return;
  }
  abierto.value = true;
  cargar();
}

// Click en una notificación: la marca como leída sin cerrar el panel.
async function abrir(notificacion) {
  // La notificación del panel y la confirmación del comunicado son marcas
  // distintas. Abrir un aviso de comunicado registra ambas.
  if (notificacion.tipo === "comunicado" && notificacion.id_comunicado) {
    const lectura = await marcarComunicadoLeido(notificacion.id_comunicado);
    if (!lectura.success) {
      toast.error(lectura.message || "No se pudo confirmar la lectura del comunicado.");
      return;
    }
  }
  if (!notificacion.leida) {
    const resultado = await marcarNotificacionLeida(notificacion.id_notificacion);
    if (!resultado.success) {
      toast.error(resultado.message || "No se pudo marcar como leída.");
      return;
    }
  }
  await cargar();
  abierto.value = false;
  if (authStore.rol === "alumno") {
    if (notificacion.tipo === "comunicado" && notificacion.id_comunicado) {
      await router.push({ path: "/alumno/cursos", query: { comunicado: notificacion.id_comunicado } });
    } else if (notificacion.tipo === "noticia") {
      await router.push("/alumno/noticias");
    }
  }
}

async function marcarTodas() {
  marcandoTodas.value = true;
  try {
    const resultado = await marcarTodasLeidas();
    if (!resultado.success) throw new Error(resultado.message);
    await cargar();
    toast.success("Todas las notificaciones fueron marcadas como leídas.");
  } catch (e) {
    toast.error(e?.message || "No se pudieron marcar las notificaciones.");
  } finally {
    marcandoTodas.value = false;
  }
}

const cerrarSiClickAfuera = (evento) => {
  if (abierto.value && contenedor.value && !contenedor.value.contains(evento.target)) {
    abierto.value = false;
  }
};
onMounted(() => document.addEventListener("click", cerrarSiClickAfuera));
onUnmounted(() => document.removeEventListener("click", cerrarSiClickAfuera));

// Tiempo real: con el backend ahora, los eventos de notificación viajan solo
// al dueño; el filtro por id queda como red de seguridad (y cubre la
// conexión única compartida con otras pantallas del panel).
const { conectar } = usarEventos({
  alEvento: async (evento) => {
    if (evento?.tipo !== "notificacion") return;
    const idPropio = Number(authStore.usuario?.id_usuario ?? authStore.usuario?.id);
    const idDestinatario = Number(evento.datos?.id_usuario);
    if (idPropio && idDestinatario && idPropio !== idDestinatario) return;
    // El backend dirige el evento al dueño de la notificación.
    const titulo = evento.datos?.titulo || "Nueva notificación.";
    const cuerpo = evento.datos?.cuerpo;
    toast.info(cuerpo ? `${titulo}: ${cuerpo}` : titulo);
    await cargar();
  },
});

onMounted(() => {
  cargar();
  conectar();
});
</script>

<style scoped>
.campanita {
  position: relative;
  display: inline-flex;
}

.campanita-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: none;
  background: transparent;
  border-radius: 10px;
  font-size: 17px;
  color: #334155;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.campanita-btn:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.campanita-badge {
  position: absolute;
  top: 2px;
  right: 0px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #cd322c;
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
  line-height: 16px;
  text-align: center;
}

/* ── Panel desplegable ────────────────────────────────────────────────────── */
.campanita-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 2100;
  width: min(340px, calc(100vw - 16px));
  max-height: 420px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 0.5px solid #e5e7eb;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}

.campanita-cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  border-bottom: 1px solid #f1f5f9;
}

.campanita-titulo {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12.5px;
  font-weight: 700;
  color: #111827;
}

.campanita-titulo i {
  color: #cd322c;
  font-size: 15px;
}

.campanita-contador {
  font-size: 10.5px;
  font-weight: 600;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 1px 7px;
  border-radius: 999px;
}

.campanita-marcar-todas {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #4b5563;
  font-size: 10.5px;
  font-weight: 600;
  padding: 4px 9px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.12s;
}

.campanita-marcar-todas:hover:not(:disabled) {
  background: #f9fafb;
  color: #111827;
}

.campanita-marcar-todas:disabled {
  opacity: 0.6;
  cursor: wait;
}

/* ── Estados vacíos ───────────────────────────────────────────────────────── */
.campanita-vacia {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 16px;
  color: #6b7280;
  font-size: 12px;
}

.campanita-vacia i {
  font-size: 26px;
  opacity: 0.45;
}

.campanita-vacia p {
  margin: 0;
}

.campanita-reintentar {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #4b5563;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
}

/* ── Lista ────────────────────────────────────────────────────────────────── */
.campanita-lista {
  list-style: none;
  margin: 0;
  padding: 4px 0;
  overflow-y: auto;
}

.campanita-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 2px 10px;
}

.campanita-item + .campanita-item {
  border-top: 0.5px solid #f3f4f6;
}

/* El punto rojo marca lo no leído (la fila leída lo colapsa). */
.campanita-punto {
  width: 7px;
  height: 7px;
  margin-top: 8px;
  border-radius: 999px;
  background: #cd322c;
  flex: none;
  opacity: 0;
}

.campanita-item:not(.leida) .campanita-punto {
  opacity: 1;
}

.campanita-item-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 4px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-family: inherit;
}

.campanita-item.leida {
  background: #f8fafc;
}

.campanita-item-titulo {
  font-size: 12.5px;
  font-weight: 650;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 7px;
}

.campanita-tipo {
  font-size: 9px;
  font-weight: 600;
  text-transform: capitalize;
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #fde68a;
  padding: 1px 6px;
  border-radius: 999px;
  flex: none;
}

.campanita-estado { flex: none; padding: 1px 6px; border: 1px solid #e2e8f0; border-radius: 999px; color: #475569; font-size: 9px; font-weight: 700; }
.campanita-estado.nueva { border-color: #fecaca; background: #fff1f2; color: #b42318; }
.campanita-item-btn:focus-visible { border-radius: 7px; outline: 2px solid #cd322c; outline-offset: 1px; }

.campanita-item-meta {
  font-size: 11.5px;
  color: #6b7280;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.campanita-fecha {
  font-size: 10px;
  color: #9ca3af;
}

/* ── Animación ────────────────────────────────────────────────────────────── */
.campanita-fade-enter-active,
.campanita-fade-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}

.campanita-fade-enter-from,
.campanita-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
