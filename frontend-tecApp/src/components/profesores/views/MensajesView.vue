<template>
  <section class="mensajes-view">
    <div class="page-header">
      <div>
        <h2 class="section-title"><i class="ti ti-brand-whatsapp"></i> WhatsApp</h2>
        <p>Enviá WhatsApp a tutores de tus alumnos y mirá tu historial.</p>
      </div>
      <button class="tb-btn primary sm" :disabled="cargando" @click="cargarTodo">
        <i class="ti ti-refresh" :class="{ 'animate-spin': cargando }"></i>
        {{ cargando ? "Cargando..." : "Actualizar" }}
      </button>
    </div>

    <ComposerWhatsapp
      ref="composer"
      :alumnos="alumnos"
      :cargando-alumnos="cargando"
      :enviando="enviando"
      @enviar="enviar"
    />

    <div class="card animate-fade-in">
      <div class="card-header">
        <div class="card-title">Mi historial ({{ totalItems }})</div>
      </div>
      <div class="toolbar">
        <div class="search-box">
          <i class="ti ti-search"></i>
          <input
            v-model="searchText"
            type="text"
            placeholder="Buscar en mi historial..."
            aria-label="Buscar en mi historial"
          />
          <button v-if="searchText" class="search-clear" aria-label="Limpiar búsqueda" @click="searchText = ''">
            <i class="ti ti-x"></i>
          </button>
        </div>
      </div>
      <div v-if="cargando" class="empty-state">
        <i class="ti ti-loader animate-spin" style="font-size: 24px"></i>
        <p>Cargando historial...</p>
      </div>
      <HistorialMensajes
        v-else
        :mensajes="paginatedData"
        mensaje-vacio="Todavía no enviaste mensajes."
        :ocupado="ocupado"
        @ver="verDetalle"
        @leido="marcarLeido"
      />
      <Pagination
        :current-page="currentPage"
        :total-items="totalItems"
        :page-size="pageSize"
        @page-change="goToPage"
        @page-size-change="setPageSize"
      />
    </div>

    <DetalleMensajeModal v-model="modalDetalle" :mensaje="sel" />
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import Pagination from "@/components/ui/Pagination.vue";
import ComposerWhatsapp from "@/components/whatsapp/ComposerWhatsapp.vue";
import HistorialMensajes from "@/components/whatsapp/HistorialMensajes.vue";
import DetalleMensajeModal from "@/components/whatsapp/DetalleMensajeModal.vue";
import { useTableControls } from "@/composables/useTableControls.js";
import { toast } from "@/services/toast-service.js";
import { obtenerNotasProfesor } from "@/services/academico-service.js";
import {
  enviarWhatsappAAlumno,
  obtenerMisMensajes,
  marcarMensajeLeido,
} from "@/services/mensajes-service.js";

const alumnos = ref([]);
const historial = ref([]);
const cargando = ref(false);
const enviando = ref(false);
const ocupado = ref(null);
const modalDetalle = ref(false);
const sel = ref(null);
const composer = ref(null);

const {
  searchText,
  currentPage,
  pageSize,
  paginatedData,
  totalItems,
  goToPage,
  setPageSize,
} = useTableControls(historial, {
  pageSize: 10,
  filterFn: (m, q) =>
    !q ||
    `${m.nombre_destinatario || ""} ${m.telefono_destino || ""} ${m.cuerpo || ""}`
      .toLowerCase()
      .includes(q),
});

const cargarAlumnos = async () => {
  const res = await obtenerNotasProfesor();
  if (res.success) {
    const data = res.data?.alumnos || res.data?.data?.alumnos || [];
    alumnos.value = Array.isArray(data) ? data : [];
  }
};

const cargarHistorial = async () => {
  const res = await obtenerMisMensajes({ limit: 200 });
  if (res.success) {
    historial.value = res.data;
  } else {
    toast.error(res.message);
  }
};

const cargarTodo = async () => {
  cargando.value = true;
  await Promise.all([cargarAlumnos(), cargarHistorial()]);
  cargando.value = false;
};

const enviar = async ({ id_alumno, cuerpo }) => {
  enviando.value = true;
  const res = await enviarWhatsappAAlumno(id_alumno, cuerpo);
  enviando.value = false;
  if (res.success) {
    toast.success(res.data?.mensaje || "WhatsApp enviado");
    composer.value?.limpiarCuerpo();
    await cargarHistorial();
  } else {
    toast.error(res.message);
  }
};

const verDetalle = (m) => {
  sel.value = m;
  modalDetalle.value = true;
};

const marcarLeido = async (m) => {
  ocupado.value = { id: m.id_mensaje, tipo: "leido" };
  const res = await marcarMensajeLeido(m.id_mensaje);
  ocupado.value = null;
  if (res.success) {
    const idx = historial.value.findIndex((x) => x.id_mensaje === m.id_mensaje);
    if (idx !== -1) {
      historial.value[idx] = { ...historial.value[idx], leido: true, estado: "leido" };
    }
  } else {
    toast.error(res.message);
  }
};

onMounted(cargarTodo);
</script>

<style scoped>
.mensajes-view { display: flex; flex-direction: column; gap: 16px; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}
.section-title { display: flex; align-items: center; gap: 8px; }
.toolbar { padding: 16px 20px 0 20px; }
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
