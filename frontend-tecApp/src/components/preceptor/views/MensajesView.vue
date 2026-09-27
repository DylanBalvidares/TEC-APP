<template>
  <section class="mensajes-view">
    <div class="boletines-header">
      <h1><i class="ti ti-brand-whatsapp"></i> WhatsApp</h1>
      <p>Enviá WhatsApp a tutores de tus cursos y mirá tu historial.</p>
    </div>

    <ComposerWhatsapp
      ref="composer"
      :alumnos="alumnos"
      :cargando-alumnos="cargandoCursos"
      :enviando="enviando"
      @enviar="enviar"
    >
      <template #filtros-extra>
        <div class="form-row">
          <div class="form-group">
            <label for="wpp-curso">Curso</label>
            <select id="wpp-curso" v-model="cursoId" @change="cargarAlumnosCurso">
              <option value="" disabled>Seleccioná un curso</option>
              <option v-for="c in cursos" :key="c.id_curso" :value="c.id_curso">
                {{ c.nombre_curso }}
              </option>
            </select>
          </div>
        </div>
      </template>
    </ComposerWhatsapp>

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
      <HistorialMensajes
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
import { obtenerCursos, obtenerAlumnosCurso } from "@/services/academico-service.js";
import {
  enviarWhatsappAAlumno,
  obtenerMisMensajes,
  marcarMensajeLeido,
} from "@/services/mensajes-service.js";

const cursos = ref([]);
const alumnos = ref([]);
const cursoId = ref("");
const historial = ref([]);
const cargandoCursos = ref(false);
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

const cargarCursos = async () => {
  cargandoCursos.value = true;
  const res = await obtenerCursos();
  cargandoCursos.value = false;
  if (res.success) {
    cursos.value = Array.isArray(res.data) ? res.data : res.data?.cursos || [];
  }
};

const cargarAlumnosCurso = async () => {
  if (!cursoId.value) return;
  const res = await obtenerAlumnosCurso(cursoId.value);
  const data = res.success ? res.data : res;
  alumnos.value = Array.isArray(data) ? data : data?.alumnos || data?.data || [];
};

const cargarHistorial = async () => {
  const res = await obtenerMisMensajes({ limit: 200 });
  if (res.success) {
    historial.value = res.data;
  } else {
    toast.error(res.message);
  }
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

onMounted(async () => {
  await cargarCursos();
  await cargarHistorial();
});
</script>

<style scoped>
.mensajes-view { display: flex; flex-direction: column; gap: 16px; }
.toolbar { padding: 16px 20px 0 20px; }
</style>
