<template>
  <section class="tab-panel active">
    <!-- ── Toolbar ── -->
    <div class="tab-toolbar">
      <div class="tab-toolbar-left">
        <h2 class="section-title">
          <i class="fas fa-book-open"></i> Libreta Digital — Calificaciones
        </h2>
      </div>
      <div class="libreta-toolbar-right" v-if="!cargando && asignaciones.length > 0">
        <div class="filter-group">
          <span>Curso:</span>
          <select v-model="cursoSeleccionadoId" @change="onCursoChange" class="select-input">
            <option value="" disabled>Seleccionar curso...</option>
            <option v-for="c in cursosUnicos" :key="c.id" :value="c.id">
              {{ c.nombre }}
            </option>
          </select>
        </div>

        <div class="filter-group" v-if="cursoSeleccionadoId">
          <span>Materia:</span>
          <select v-model="asignacionSeleccionadaId" class="select-input">
            <option value="" disabled>Seleccionar materia...</option>
            <option v-for="a in materiasDelCurso" :key="a.id_asignacion" :value="a.id_asignacion">
              {{ a.materiaAsignacion?.nombre_materia }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- ── Feedback Messages ── -->
    <div v-if="feedbackMsg" :class="['feedback-banner', feedbackTipo === 'error' ? 'feedback-error' : 'feedback-success']">
      <i :class="feedbackTipo === 'error' ? 'fas fa-circle-exclamation' : 'fas fa-circle-check'"></i>
      {{ feedbackMsg }}
    </div>

    <!-- ── Estado de Carga / Vacio ── -->
    <div v-if="cargando" class="empty-state">
      <i class="fas fa-spinner fa-spin empty-icon"></i>
      <p>Cargando asignaciones y alumnos...</p>
    </div>

    <div v-else-if="asignaciones.length === 0" class="empty-state">
      <i class="fas fa-folder-open empty-icon"></i>
      <p>No tenés materias ni cursos asignados actualmente.</p>
    </div>

    <div v-else-if="!asignacionSeleccionadaId" class="empty-state">
      <i class="fas fa-hand-pointer empty-icon"></i>
      <p>Seleccioná un curso y una materia para ingresar calificaciones.</p>
    </div>

    <!-- ── Planilla de Calificaciones ── -->
    <div v-else class="table-container">
      <div class="table-header-info">
        <h3>
          <i class="fas fa-graduation-cap"></i> Alumnos de {{ cursoActualNombre }} — 
          <span class="highlight-materia">{{ materiaActualNombre }}</span>
        </h3>
      </div>

      <table class="notas-table">
        <thead>
          <tr>
            <th>Alumno</th>
            <th>DNI</th>
            <th>Calificación (0 - 10)</th>
            <th>Observación</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="alumno in alumnosDelCurso" :key="alumno.id_alumno">
            <td>
              <strong>{{ alumno.apellido }}, {{ alumno.nombre }}</strong>
            </td>
            <td>{{ alumno.dni }}</td>
            <td>
              <div class="grade-input-wrap">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  v-model="calificacionesState[alumno.id_alumno]"
                  placeholder="Nota (ej. 8.5)"
                  class="grade-input"
                />
              </div>
            </td>
            <td>
              <input
                type="text"
                v-model="observacionesState[alumno.id_alumno]"
                placeholder="Observación opcional..."
                class="obs-input"
              />
            </td>
            <td class="text-center actions-cell">
              <button
                class="btn-save-grade"
                @click="guardarCalificacionAlumno(alumno)"
                :disabled="guardandoId === alumno.id_alumno"
                title="Guardar calificación"
              >
                <i v-if="guardandoId === alumno.id_alumno" class="fas fa-spinner fa-spin"></i>
                <i v-else class="fas fa-floppy-disk"></i> Guardar
              </button>
              <button
                class="btn-history"
                @click="abrirHistorialModal(alumno)"
                title="Ver historial de cambios"
              >
                <i class="fas fa-clock-rotate-left"></i>
              </button>
            </td>
          </tr>
          <tr v-if="alumnosDelCurso.length === 0">
            <td colspan="5" class="text-center py-4 text-muted">
              No hay alumnos registrados en este curso.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ── Modal Historial ── -->
    <div v-if="modalHistorialOpen" class="modal-backdrop" @click.self="modalHistorialOpen = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3>
            <i class="fas fa-history"></i> Historial de Calificaciones
          </h3>
          <button class="modal-close-btn" @click="modalHistorialOpen = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">
            Alumno: <strong>{{ alumnoHistorialSeleccionado?.apellido }}, {{ alumnoHistorialSeleccionado?.nombre }}</strong>
          </p>

          <div v-if="cargandoHistorial" class="text-center py-4">
            <i class="fas fa-spinner fa-spin text-primary"></i> Cargando historial...
          </div>
          <div v-else-if="historialItems.length === 0" class="empty-historial">
            Sin cambios de calificaciones registrados para este alumno.
          </div>
          <div v-else class="timeline">
            <div v-for="item in historialItems" :key="item.id_historial" class="timeline-item">
              <div class="timeline-badge"></div>
              <div class="timeline-content">
                <div class="timeline-head">
                  <span class="materia-tag">{{ item.asignacione?.materiaAsignacion?.nombre_materia || "Materia" }}</span>
                  <span class="fecha-tag">{{ formatearFechaHora(item.fecha_cambio) }}</span>
                </div>
                <div class="timeline-body">
                  <span class="calif-change">
                    <span v-if="item.calificacion_anterior !== null" class="prev-val">{{ item.calificacion_anterior }}</span>
                    <span v-else class="prev-val text-muted">Sin nota</span>
                    <i class="fas fa-arrow-right arrow-icon"></i>
                    <span class="new-val">{{ item.calificacion_nueva }}</span>
                  </span>
                  <p class="mod-by">Modificado por: <strong>{{ item.usuarioModificador ? `${item.usuarioModificador.nombre} ${item.usuarioModificador.apellido}` : 'Sistema' }}</strong></p>
                  <p v-if="item.motivo" class="motivo-text"><em>"{{ item.motivo }}"</em></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="modalHistorialOpen = false">Cerrar</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from "vue";
import {
  obtenerNotasProfesor,
  guardarNota,
  obtenerHistorialNotasAlumno,
} from "@/services/academico-service.js";

const asignaciones = ref([]);
const alumnos = ref([]);
const notas = ref([]);
const cargando = ref(true);

const cursoSeleccionadoId = ref("");
const asignacionSeleccionadaId = ref("");

const calificacionesState = reactive({});
const observacionesState = reactive({});

const feedbackMsg = ref("");
const feedbackTipo = ref(""); // "success" o "error"
const guardandoId = ref(null);

// Modal Historial
const modalHistorialOpen = ref(false);
const alumnoHistorialSeleccionado = ref(null);
const historialItems = ref([]);
const cargandoHistorial = ref(false);

const setFeedback = (msg, tipo = "success") => {
  feedbackMsg.value = msg;
  feedbackTipo.value = tipo;
  setTimeout(() => {
    feedbackMsg.value = "";
  }, 4000);
};

const cargarDatosProfesor = async () => {
  cargando.value = true;
  try {
    const res = await obtenerNotasProfesor();
    if (res.success && res.data) {
      asignaciones.value = res.data.asignaciones || [];
      alumnos.value = res.data.alumnos || [];
      notas.value = res.data.notas || [];

      // Auto seleccionar primer curso y materia si existen
      if (cursosUnicos.value.length > 0) {
        cursoSeleccionadoId.value = cursosUnicos.value[0].id;
        if (materiasDelCurso.value.length > 0) {
          asignacionSeleccionadaId.value = materiasDelCurso.value[0].id_asignacion;
          sincronizarNotasState();
        }
      }
    } else {
      setFeedback(res.message || "Error al obtener calificaciones del docente.", "error");
    }
  } catch (e) {
    setFeedback("Error al conectar con el servidor.", "error");
  } finally {
    cargando.value = false;
  }
};

const cursosUnicos = computed(() => {
  const map = new Map();
  asignaciones.value.forEach((asig) => {
    if (asig.cursoAsignacion) {
      map.set(asig.cursoAsignacion.id_curso, {
        id: asig.cursoAsignacion.id_curso,
        nombre: asig.cursoAsignacion.nombre_curso,
      });
    }
  });
  return Array.from(map.values());
});

const materiasDelCurso = computed(() => {
  if (!cursoSeleccionadoId.value) return [];
  return asignaciones.value.filter(
    (a) => a.id_curso === parseInt(cursoSeleccionadoId.value)
  );
});

const alumnosDelCurso = computed(() => {
  if (!cursoSeleccionadoId.value) return [];
  return alumnos.value.filter(
    (al) => al.id_curso === parseInt(cursoSeleccionadoId.value)
  );
});

const cursoActualNombre = computed(() => {
  const c = cursosUnicos.value.find((x) => x.id === parseInt(cursoSeleccionadoId.value));
  return c ? c.nombre : "Curso";
});

const materiaActualNombre = computed(() => {
  const m = materiasDelCurso.value.find(
    (x) => x.id_asignacion === parseInt(asignacionSeleccionadaId.value)
  );
  return m?.materiaAsignacion?.nombre_materia || "Materia";
});

const onCursoChange = () => {
  if (materiasDelCurso.value.length > 0) {
    asignacionSeleccionadaId.value = materiasDelCurso.value[0].id_asignacion;
  } else {
    asignacionSeleccionadaId.value = "";
  }
  sincronizarNotasState();
};

const sincronizarNotasState = () => {
  if (!asignacionSeleccionadaId.value) return;
  const asigId = parseInt(asignacionSeleccionadaId.value);

  alumnosDelCurso.value.forEach((al) => {
    const notaFound = notas.value.find(
      (n) => n.id_alumno === al.id_alumno && n.id_asignacion === asigId
    );
    calificacionesState[al.id_alumno] = notaFound ? notaFound.calificacion : "";
    observacionesState[al.id_alumno] = notaFound ? notaFound.observaciones || "" : "";
  });
};

const guardarCalificacionAlumno = async (alumno) => {
  const rawNota = calificacionesState[alumno.id_alumno];
  if (rawNota === "" || rawNota === null || rawNota === undefined) {
    setFeedback("Ingresá un valor numérico de calificación.", "error");
    return;
  }

  const num = parseFloat(rawNota);
  if (isNaN(num) || num < 0 || num > 10) {
    setFeedback("La calificación debe estar entre 0.0 y 10.0.", "error");
    return;
  }

  guardandoId.value = alumno.id_alumno;
  try {
    const payload = {
      id_alumno: alumno.id_alumno,
      id_asignacion: parseInt(asignacionSeleccionadaId.value),
      calificacion: num,
      observaciones: observacionesState[alumno.id_alumno] || null,
    };

    const res = await guardarNota(payload);
    if (res.success) {
      setFeedback(`Calificación de ${alumno.nombre} ${alumno.apellido} guardada correctamente.`);
      // Actualizar lista local de notas
      const index = notas.value.findIndex(
        (n) => n.id_alumno === alumno.id_alumno && n.id_asignacion === payload.id_asignacion
      );
      if (index !== -1) {
        notas.value[index] = res.data;
      } else {
        notas.value.push(res.data);
      }
    } else {
      setFeedback(res.message || "Error al guardar calificación.", "error");
    }
  } catch (e) {
    setFeedback("Error al procesar la solicitud.", "error");
  } finally {
    guardandoId.value = null;
  }
};

const abrirHistorialModal = async (alumno) => {
  alumnoHistorialSeleccionado.value = alumno;
  modalHistorialOpen.value = true;
  cargandoHistorial.value = true;
  historialItems.value = [];

  try {
    const res = await obtenerHistorialNotasAlumno(alumno.id_alumno);
    if (res.success && res.data) {
      historialItems.value = res.data;
    } else {
      setFeedback(res.message || "No se pudo cargar el historial", "error");
    }
  } catch (e) {
    console.error(e);
  } finally {
    cargandoHistorial.value = false;
  }
};

const formatearFechaHora = (str) => {
  if (!str) return "";
  const d = new Date(str);
  return d.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  cargarDatosProfesor();
});
</script>

<style scoped src="../profesores.css"></style>
<style scoped>
.libreta-toolbar-right {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--text, #334155);
}

.select-input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 12px;
  background: #f8fafc;
  color: #0f172a;
  font-family: inherit;
  font-weight: 600;
}

.feedback-banner {
  padding: 12px 16px;
  border-radius: 10px;
  margin-top: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.feedback-success {
  background: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.feedback-error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.table-container {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 6px 18px rgba(2, 6, 23, 0.06);
  border: 1px solid #e5e7eb;
  padding: 20px;
  margin-top: 16px;
  overflow-x: auto;
}

.table-header-info {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
}

.table-header-info h3 {
  font-size: 1.15rem;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.highlight-materia {
  color: var(--primary, #c0152a);
  font-weight: 800;
}

.notas-table {
  width: 100%;
  border-collapse: collapse;
}

.notas-table th {
  text-align: left;
  padding: 12px 14px;
  color: #64748b;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e2e8f0;
}

.notas-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  font-size: 0.92rem;
}

.grade-input {
  width: 110px;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 700;
  color: #0f172a;
}

.grade-input:focus {
  border-color: #c0152a;
  outline: none;
  box-shadow: 0 0 0 3px rgba(192, 21, 42, 0.15);
}

.obs-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  font-size: 0.88rem;
}

.actions-cell {
  white-space: nowrap;
}

.btn-save-grade {
  background: var(--primary, #c0152a);
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-right: 6px;
  transition: background 0.2s;
}

.btn-save-grade:hover:not(:disabled) {
  background: #960f20;
}

.btn-save-grade:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-history {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-history:hover {
  background: #e2e8f0;
  color: #0f172a;
}

/* Modal styles */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-card {
  background: #fff;
  border-radius: 16px;
  max-width: 550px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.modal-header {
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #64748b;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.modal-subtitle {
  margin-top: 0;
  margin-bottom: 16px;
  color: #475569;
  font-size: 0.95rem;
}

.modal-footer {
  padding: 12px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.btn-secondary {
  background: #e2e8f0;
  color: #334155;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
  padding-left: 20px;
  border-left: 2px solid #e2e8f0;
}

.timeline-item {
  position: relative;
}

.timeline-badge {
  position: absolute;
  left: -26px;
  top: 4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #c0152a;
  box-shadow: 0 0 0 3px #fee2e2;
}

.timeline-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 12px;
}

.timeline-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.82rem;
  margin-bottom: 6px;
}

.materia-tag {
  font-weight: 700;
  color: #0f172a;
}

.fecha-tag {
  color: #64748b;
}

.calif-change {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 1rem;
  font-weight: 800;
}

.prev-val {
  color: #64748b;
  text-decoration: line-through;
}

.new-val {
  color: #16a34a;
}

.arrow-icon {
  font-size: 0.8rem;
  color: #94a3b8;
}

.mod-by {
  margin: 6px 0 0 0;
  font-size: 0.82rem;
  color: #475569;
}

.motivo-text {
  margin: 4px 0 0 0;
  font-size: 0.8rem;
  color: #64748b;
}
</style>
