<template>
  <div class="libreta-admin-wrapper">
    <div class="search-bar-wrapper">
      <div class="search-box">
        <i class="ti ti-search"></i>
        <input v-model="searchText" type="text" placeholder="Buscar alumno por nombre, apellido o DNI..." aria-label="Buscar alumnos" @input="goToPage(1)" />
        <button v-if="searchText" class="search-clear" @click="searchText = ''; goToPage(1)" aria-label="Limpiar búsqueda"><i class="ti ti-x"></i></button>
      </div>
      <select v-model="cursoSeleccionadoId" @change="onCursoChange" class="select-input" aria-label="Seleccionar curso">
        <option value="" disabled>Seleccionar curso...</option>
        <option v-for="c in cursos" :key="c.id_curso" :value="c.id_curso">
          {{ c.nombre_curso }} — {{ c.nivel || "General" }} ({{ c.turno || "Sin turno" }})
        </option>
      </select>
      <label class="toggle-desaprobados" title="Mostrar solo alumnos con promedio menor a 6">
        <input type="checkbox" v-model="soloDesaprobados" @change="goToPage(1)" />
        <span class="toggle-label">Solo desaprobados</span>
      </label>
      <button class="tb-btn sm outline" @click="fetchPlanilla" :disabled="!cursoSeleccionadoId || cargandoPlanilla || cargandoCursos" title="Recargar planilla">
        <i class="ti ti-refresh"></i> Recargar
      </button>
    </div>

    <div v-if="feedbackMsg" :class="['error-banner', feedbackTipo === 'success' ? 'success-banner' : '']" style="margin-bottom: 12px">
      <i :class="feedbackTipo === 'success' ? 'ti ti-check' : 'ti ti-alert-circle'"></i> {{ feedbackMsg }}
    </div>

    <div class="card animate-fade-in">
      <div class="card-header">
        <div class="card-title">
          <i class="ti ti-book-open" aria-hidden="true"></i>
          {{ cursoActual ? `Planilla — ${cursoActual.nombre_curso}` : "Libreta Digital" }}
        </div>
        <div class="card-header-actions" v-if="cursoSeleccionadoId && !cargandoPlanilla">
          <span class="metric-badge badge-gray">{{ alumnosFiltrados.length }} alumnos</span>
          <span class="metric-badge badge-gray">{{ asignaciones.length }} materias</span>
          <span v-if="promedioCurso !== null" class="metric-badge badge-green">Promedio curso: {{ promedioCurso }}</span>
        </div>
      </div>

      <div class="table-responsive">
        <div v-if="cargandoCursos || cargandoPlanilla" class="empty-state">
          <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
          <p>{{ cargandoCursos ? "Cargando cursos..." : "Cargando planilla..." }}</p>
        </div>

        <div v-else-if="errorCarga" class="error-banner" style="margin: 16px">
          <i class="ti ti-alert-circle"></i> {{ errorCarga }}
          <button class="tb-btn sm outline" @click="fetchPlanilla" style="margin-left: auto">Reintentar</button>
        </div>

        <div v-else-if="!cursoSeleccionadoId" class="empty-state">
          <i class="ti ti-book-open" style="font-size: 28px; opacity: 0.4"></i>
          <p>Seleccioná un curso para ver su planilla de calificaciones.</p>
        </div>

        <template v-else-if="alumnosFiltrados.length > 0">
          <table class="mini" aria-label="Planilla de calificaciones">
            <thead>
              <tr>
                <th>Alumno</th>
                <th>DNI</th>
                <th v-for="asig in asignaciones" :key="asig.id_asignacion" class="text-center">
                  {{ asig.materiaAsignacion?.nombre_materia || "Materia" }}
                  <div class="th-sub">{{ asig.profesorAsignacion ? `Prof. ${asig.profesorAsignacion.apellido}` : "Sin profesor" }}</div>
                </th>
                <th class="text-center">Promedio</th>
                <th class="text-center">Historial</th>
                <th class="action-cell">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="alumno in alumnosPaginados" :key="alumno.id_alumno" class="table-row">
                <td style="font-weight: 500">{{ alumno.apellido }}, {{ alumno.nombre }}</td>
                <td>{{ alumno.dni }}</td>
                <td v-for="asig in asignaciones" :key="asig.id_asignacion" class="text-center">
                  <span :class="['grade-badge', claseNota(notaDe(alumno.id_alumno, asig.id_asignacion)?.calificacion)]">
                    {{ textoNota(notaDe(alumno.id_alumno, asig.id_asignacion)?.calificacion) }}
                  </span>
                </td>
                <td class="text-center">
                  <span :class="['grade-badge', 'prom', claseNota(promedioAlumno(alumno.id_alumno))]">{{ textoNota(promedioAlumno(alumno.id_alumno)) }}</span>
                </td>
                <td class="text-center">
                  <button class="icon-btn view" @click="abrirHistorial(alumno)" title="Ver historial" aria-label="Ver historial">
                    <i class="ti ti-history"></i>
                  </button>
                </td>
                <td class="action-cell">
                  <div class="action-buttons">
                    <button
                      v-for="asig in asignaciones" :key="`edit-${asig.id_asignacion}`"
                      class="icon-btn edit" @click="abrirEdicion(alumno, asig)"
                      :title="`Editar nota de ${asig.materiaAsignacion?.nombre_materia || 'materia'}`"
                      aria-label="Editar nota"
                    >
                      <i class="ti ti-edit"></i>
                    </button>
                    <button
                      v-if="alumnoTieneNotas(alumno.id_alumno)"
                      class="icon-btn delete" @click="pedirEliminar(alumno)"
                      title="Eliminar todas las notas del alumno en este curso" aria-label="Eliminar notas"
                    >
                      <i class="ti ti-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </template>

        <div v-else class="empty-state">
          <i class="ti ti-inbox" style="font-size: 28px; opacity: 0.4"></i>
          <p v-if="searchText || soloDesaprobados">Ningún alumno coincide con el filtro aplicado.</p>
          <p v-else>No hay alumnos registrados en este curso.</p>
        </div>
      </div>

      <Pagination
        :current-page="currentPage"
        :total-items="totalItems"
        :page-size="pageSize"
        @page-change="goToPage"
        @page-size-change="setPageSize"
      />
    </div>

    <!-- Modal edición -->
    <Modal v-model="modalEdit.open" :title="`Editar calificación — ${modalEdit.alumno?.apellido}, ${modalEdit.alumno?.nombre}`">
      <p class="modal-sub">
        {{ modalEdit.asignacion?.materiaAsignacion?.nombre_materia || "Materia" }} ·
        {{ cursoActual?.nombre_curso || "" }}
      </p>
      <div class="form-grid">
        <label>Calificación (0 – 10)
          <input type="number" v-model="modalEdit.calificacion" min="0" max="10" step="0.1" class="modal-input" placeholder="Ej. 8.5" />
        </label>
        <label>Observación (opcional)
          <input type="text" v-model="modalEdit.observaciones" class="modal-input" placeholder="Observación..." />
        </label>
      </div>
      <p class="modal-hint">El cambio queda auditado en el historial con tu usuario administrador.</p>
      <template #footer>
        <button class="tb-btn sm outline" @click="modalEdit.open = false">Cancelar</button>
        <button class="tb-btn sm primary" @click="guardarEdicion" :disabled="modalEdit.saving">
          {{ modalEdit.saving ? "Guardando..." : "Guardar" }}
        </button>
      </template>
    </Modal>

    <!-- Modal confirmación eliminar -->
    <Modal v-model="modalDelete.open" title="Eliminar calificaciones">
      <p>
        Se eliminarán <strong>{{ notasAEliminar }}</strong> nota(s) de
        <strong>{{ modalDelete.alumno?.apellido }}, {{ modalDelete.alumno?.nombre }}</strong>
        en este curso. Esta acción no se puede deshacer.
      </p>
      <template #footer>
        <button class="tb-btn sm outline" @click="modalDelete.open = false">Cancelar</button>
        <button class="tb-btn sm danger" @click="confirmarEliminar" :disabled="modalDelete.saving">
          {{ modalDelete.saving ? "Eliminando..." : "Eliminar" }}
        </button>
      </template>
    </Modal>

    <!-- Modal historial -->
    <Modal v-model="modalHist.open" :title="`Historial — ${modalHist.alumno?.apellido}, ${modalHist.alumno?.nombre}`" wide>
      <div v-if="modalHist.loading" class="empty-state">
        <i class="ti ti-loader animate-spin" style="font-size: 22px; color: #cd322c"></i>
        <p>Cargando historial...</p>
      </div>
      <div v-else-if="modalHist.items.length === 0" class="empty-state">
        <i class="ti ti-history" style="font-size: 24px; opacity: 0.4"></i>
        <p>Sin cambios registrados para este alumno.</p>
      </div>
      <div v-else class="hist-timeline">
        <div v-for="item in modalHist.items" :key="item.id_historial" class="hist-item">
          <div class="hist-main">
            <span class="metric-badge badge-gray">{{ item.asignacione?.materiaAsignacion?.nombre_materia || "Materia" }}</span>
            <span class="hist-fecha">{{ formatearFecha(item.fecha_cambio) }}</span>
          </div>
          <div class="hist-cambio">
            <span class="hist-prev">{{ item.calificacion_anterior ?? "Sin nota" }}</span>
            <i class="ti ti-arrow-right"></i>
            <span class="hist-new">{{ item.calificacion_nueva }}</span>
          </div>
          <p class="hist-meta">
            Por {{ item.usuarioModificador ? `${item.usuarioModificador.nombre} ${item.usuarioModificador.apellido}` : "desconocido" }}
            · {{ item.motivo || "Sin motivo" }}
          </p>
        </div>
      </div>
      <template #footer>
        <button class="tb-btn sm outline" @click="modalHist.open = false">Cerrar</button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import Modal from "../../ui/Modal.vue";
import Pagination from "../../ui/Pagination.vue";
import {
  obtenerCursos,
  obtenerPlanillaAdmin,
  guardarNota,
  modificarNotaService,
  eliminarNotaService,
  obtenerHistorialNotasAlumno,
} from "@/services/academico-service.js";

const cursos = ref([]);
const cursoSeleccionadoId = ref("");
const alumnos = ref([]);
const asignaciones = ref([]);
const notas = ref([]);

const searchText = ref("");
const soloDesaprobados = ref(false);
const cargandoCursos = ref(false);
const cargandoPlanilla = ref(false);
const errorCarga = ref("");
const feedbackMsg = ref("");
const feedbackTipo = ref("error");

const currentPage = ref(1);
const pageSize = ref(10);

const modalEdit = ref({ open: false, alumno: null, asignacion: null, nota: null, calificacion: "", observaciones: "", saving: false });
const modalDelete = ref({ open: false, alumno: null, saving: false });
const modalHist = ref({ open: false, alumno: null, items: [], loading: false });

const cursoActual = computed(() => cursos.value.find((c) => String(c.id_curso) === String(cursoSeleccionadoId.value)) || null);

const notasMap = computed(() => {
  const map = new Map();
  notas.value.forEach((n) => map.set(`${n.id_alumno}:${n.id_asignacion}`, n));
  return map;
});

const notaDe = (idAlumno, idAsignacion) => notasMap.value.get(`${idAlumno}:${idAsignacion}`) || null;

const promedioAlumno = (idAlumno) => {
  const vals = asignaciones.value
    .map((a) => notaDe(idAlumno, a.id_asignacion)?.calificacion)
    .filter((v) => v !== undefined && v !== null)
    .map((v) => parseFloat(v));
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
};

const promedioCurso = computed(() => {
  const vals = alumnos.value.map((a) => promedioAlumno(a.id_alumno)).filter((v) => v !== null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
});

const alumnoTieneNotas = (idAlumno) => asignaciones.value.some((a) => notaDe(idAlumno, a.id_asignacion));

const alumnosFiltrados = computed(() => {
  const q = searchText.value.trim().toLowerCase();
  return alumnos.value.filter((a) => {
    if (q && !`${a.apellido} ${a.nombre} ${a.dni}`.toLowerCase().includes(q)) return false;
    if (soloDesaprobados.value) {
      const prom = promedioAlumno(a.id_alumno);
      if (prom === null || prom >= 6) return false;
    }
    return true;
  });
});

const totalItems = computed(() => alumnosFiltrados.value.length);
const alumnosPaginados = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return alumnosFiltrados.value.slice(start, start + pageSize.value);
});

const claseNota = (val) => {
  if (val === null || val === undefined) return "na";
  const n = parseFloat(val);
  if (n >= 6) return "ok";
  if (n >= 4) return "mid";
  return "bad";
};
const textoNota = (val) => (val === null || val === undefined ? "—" : parseFloat(val).toFixed(1));

const mostrarFeedback = (msg, tipo = "error") => {
  feedbackMsg.value = msg;
  feedbackTipo.value = tipo;
  setTimeout(() => { feedbackMsg.value = ""; }, 6000);
};

const goToPage = (p) => { currentPage.value = p; };
const setPageSize = (s) => { pageSize.value = s; currentPage.value = 1; };

const fetchCursos = async () => {
  cargandoCursos.value = true;
  try {
    const res = await obtenerCursos();
    if (res.success) {
      cursos.value = Array.isArray(res.data) ? res.data : res.data?.cursos || [];
    }
  } finally {
    cargandoCursos.value = false;
  }
};

const onCursoChange = () => {
  currentPage.value = 1;
  errorCarga.value = "";
  fetchPlanilla();
};

const fetchPlanilla = async () => {
  if (!cursoSeleccionadoId.value) return;
  cargandoPlanilla.value = true;
  errorCarga.value = "";
  try {
    const res = await obtenerPlanillaAdmin(cursoSeleccionadoId.value);
    if (res.success) {
      alumnos.value = res.data.alumnos || [];
      asignaciones.value = res.data.asignaciones || [];
      notas.value = res.data.notas || [];
      currentPage.value = 1;
    } else {
      errorCarga.value = res.message || "No se pudo cargar la planilla.";
      alumnos.value = [];
      asignaciones.value = [];
      notas.value = [];
    }
  } catch (e) {
    errorCarga.value = "No se pudo cargar la planilla.";
  } finally {
    cargandoPlanilla.value = false;
  }
};

const abrirEdicion = (alumno, asig) => {
  const existente = notaDe(alumno.id_alumno, asig.id_asignacion);
  modalEdit.value = {
    open: true,
    alumno,
    asignacion: asig,
    nota: existente,
    calificacion: existente ? parseFloat(existente.calificacion).toFixed(1) : "",
    observaciones: existente?.observaciones || "",
    saving: false,
  };
};

const guardarEdicion = async () => {
  const m = modalEdit.value;
  const num = parseFloat(m.calificacion);
  if (isNaN(num) || num < 0 || num > 10) {
    mostrarFeedback("La calificación debe ser un número entre 0 y 10.");
    return;
  }
  m.saving = true;
  try {
    let res;
    if (m.nota) {
      res = await modificarNotaService({
        id_nota: m.nota.id_nota,
        calificacion: Math.round(num * 10) / 10,
        observaciones: m.observaciones,
      });
    } else {
      res = await guardarNota({
        id_alumno: m.alumno.id_alumno,
        id_asignacion: m.asignacion.id_asignacion,
        calificacion: Math.round(num * 10) / 10,
        observaciones: m.observaciones || null,
      });
    }
    if (res.success) {
      m.open = false;
      mostrarFeedback("Calificación guardada correctamente.", "success");
      await fetchPlanilla();
    } else {
      mostrarFeedback(res.message || "No se pudo guardar la calificación.");
    }
  } finally {
    m.saving = false;
  }
};

const notasAEliminar = computed(() => {
  const a = modalDelete.value.alumno;
  if (!a) return 0;
  return asignaciones.value.filter((as) => notaDe(a.id_alumno, as.id_asignacion)).length;
});

const pedirEliminar = (alumno) => {
  modalDelete.value = { open: true, alumno, saving: false };
};

const confirmarEliminar = async () => {
  const a = modalDelete.value.alumno;
  const lista = asignaciones.value
    .map((as) => notaDe(a.id_alumno, as.id_asignacion))
    .filter(Boolean);
  modalDelete.value.saving = true;
  try {
    for (const n of lista) {
      const res = await eliminarNotaService(n.id_nota);
      if (!res.success) {
        mostrarFeedback(res.message || "No se pudieron eliminar todas las notas.");
        modalDelete.value.saving = false;
        return;
      }
    }
    modalDelete.value.open = false;
    mostrarFeedback("Notas eliminadas correctamente.", "success");
    await fetchPlanilla();
  } finally {
    modalDelete.value.saving = false;
  }
};

const abrirHistorial = async (alumno) => {
  modalHist.value = { open: true, alumno, items: [], loading: true };
  const res = await obtenerHistorialNotasAlumno(alumno.id_alumno);
  modalHist.value.loading = false;
  if (res.success) {
    modalHist.value.items = Array.isArray(res.data) ? res.data : [];
  } else {
    mostrarFeedback(res.message || "No se pudo consultar el historial.");
    modalHist.value.open = false;
  }
};

const formatearFecha = (f) => {
  try {
    return new Date(f).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return f;
  }
};

onMounted(fetchCursos);
</script>

<style scoped>
.libreta-admin-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.search-bar-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.search-bar-wrapper .search-box { flex: 1 1 260px; }
.select-input {
  padding: 8px 10px;
  border: 1px solid var(--color-border-tertiary, #e5e7eb);
  border-radius: 8px;
  font-size: 13px;
  background: #fff;
  max-width: 320px;
}
.toggle-desaprobados {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--color-text-secondary, #4b5563);
  cursor: pointer;
  white-space: nowrap;
}
.search-clear {
  background: transparent;
  border: 0;
  cursor: pointer;
  color: #6b7280;
}
.success-banner {
  background: #eaf7ec;
  border: 1px solid #bfe3c6;
  color: #1e6b2e;
}
.th-sub {
  font-weight: 400;
  font-size: 11px;
  color: #6b7280;
}
.text-center { text-align: center; }
.grade-badge {
  display: inline-block;
  min-width: 44px;
  padding: 2px 10px;
  border-radius: 999px;
  font-weight: 700;
  font-size: 12.5px;
  background: #f3f4f6;
  color: #4b5563;
}
.grade-badge.ok { background: #eaf3de; color: #3b6d11; }
.grade-badge.mid { background: #fef3c7; color: #92400e; }
.grade-badge.bad { background: #fde8e8; color: #a52420; }
.grade-badge.na { background: #f3f4f6; color: #9ca3af; }
.grade-badge.prom { border: 1px solid #e5e7eb; }
.modal-sub { color: #6b7280; margin: 0 0 12px; font-size: 13px; }
.form-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
}
.form-grid label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; }
.modal-input {
  padding: 8px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
}
.modal-hint { color: #6b7280; font-size: 12px; margin-top: 10px; }
.hist-timeline { display: flex; flex-direction: column; gap: 10px; }
.hist-item {
  border: 1px solid #eef0f2;
  border-radius: 8px;
  padding: 10px 12px;
  background: #fafbfc;
}
.hist-main { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.hist-fecha { font-size: 12px; color: #6b7280; }
.hist-cambio { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; }
.hist-prev { color: #6b7280; }
.hist-new { color: #a52420; }
.hist-meta { font-size: 12px; color: #6b7280; margin: 4px 0 0; }
@media (max-width: 700px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>
