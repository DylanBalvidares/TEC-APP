<template>
  <div class="preceptor-view">
    <div class="boletines-header">
      <h1><i class="fas fa-file-invoice"></i> Libreta Digital (Vista Preceptor)</h1>
      <p>Consultá las calificaciones y promedios de los alumnos de tus cursos a cargo.</p>
    </div>

    <!-- ── Selector de Curso ── -->
    <div class="cursos-selector-wrap" v-if="!cargandoCursos && cursos.length > 0">
      <label for="cursoSelect"><strong>Curso a consultar:</strong></label>
      <select id="cursoSelect" v-model="cursoSeleccionadoId" @change="onCursoChange" class="select-curso">
        <option value="" disabled>Seleccioná un curso...</option>
        <option v-for="c in cursos" :key="c.id_curso" :value="c.id_curso">
          🎓 {{ c.nombre_curso }} — {{ c.nivel || 'General' }} ({{ c.turno || 'Sin turno' }})
        </option>
      </select>
    </div>

    <!-- ── Estados de Carga / Vacio ── -->
    <div v-if="cargandoCursos" class="mensaje-estado">
      <i class="fas fa-spinner fa-spin"></i> Cargando tus cursos...
    </div>

    <div v-else-if="cursos.length === 0" class="mensaje-estado">
      <i class="fas fa-school"></i> No tenés cursos asignados a tu cargo.
    </div>

    <div v-else-if="cargandoPlanilla" class="mensaje-estado">
      <i class="fas fa-spinner fa-spin"></i> Cargando planilla de calificaciones...
    </div>

    <div v-else-if="errorPlanilla" class="mensaje-estado error">
      <i class="fas fa-circle-exclamation"></i> {{ errorPlanilla }}
    </div>

    <!-- ── Planilla Consolidada ── -->
    <div v-else-if="cursoSeleccionadoId" class="planilla-container">
      <div class="planilla-header">
        <h2>
          Planilla Consolidada — <span>{{ cursoActual?.nombre_curso }}</span>
        </h2>
        <span class="read-only-badge"><i class="fas fa-eye"></i> Solo Lectura</span>
      </div>

      <div class="table-responsive">
        <table class="planilla-table">
          <thead>
            <tr>
              <th class="sticky-col">Alumno</th>
              <th v-for="asig in asignaciones" :key="asig.id_asignacion">
                {{ asig.materiaAsignacion?.nombre_materia || 'Materia' }}
              </th>
              <th class="text-center highlight-col">Promedio General</th>
              <th class="text-center">Historial</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alumno in alumnos" :key="alumno.id_alumno">
              <td class="sticky-col font-bold">
                {{ alumno.apellido }}, {{ alumno.nombre }}
              </td>
              <td v-for="asig in asignaciones" :key="asig.id_asignacion" class="text-center">
                <span :class="['grade-badge', getGradeClass(getNotaAlumnoMateria(alumno.id_alumno, asig.id_asignacion))]">
                  {{ getNotaAlumnoMateria(alumno.id_alumno, asig.id_asignacion) }}
                </span>
              </td>
              <td class="text-center highlight-col">
                <span class="promedio-badge font-bold">
                  {{ calcularPromedioAlumno(alumno.id_alumno) }}
                </span>
              </td>
              <td class="text-center">
                <button class="btn-history-icon" @click="abrirHistorialModal(alumno)" title="Consultar historial">
                  <i class="fas fa-clock-rotate-left"></i>
                </button>
              </td>
            </tr>
            <tr v-if="alumnos.length === 0">
              <td :colspan="asignaciones.length + 3" class="text-center py-4 text-muted">
                No hay alumnos registrados en este curso.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Modal Historial ── -->
    <div v-if="modalHistorialOpen" class="modal-backdrop" @click.self="modalHistorialOpen = false">
      <div class="modal-card">
        <div class="modal-header">
          <h3><i class="fas fa-history"></i> Historial de Calificaciones</h3>
          <button class="modal-close-btn" @click="modalHistorialOpen = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">
            Alumno: <strong>{{ alumnoHistorialSeleccionado?.apellido }}, {{ alumnoHistorialSeleccionado?.nombre }}</strong>
          </p>

          <div v-if="cargandoHistorial" class="text-center py-4">
            <i class="fas fa-spinner fa-spin"></i> Cargando historial...
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
                  <p class="mod-by">Modificado por: <strong>{{ item.usuarioModificador ? `${item.usuarioModificador.nombre} ${item.usuarioModificador.apellido}` : 'Profesor' }}</strong></p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cerrar-modal" @click="modalHistorialOpen = false">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  obtenerCursos,
  obtenerNotasPreceptorCurso,
  obtenerHistorialNotasAlumno,
} from "@/services/academico-service.js";

const cursos = ref([]);
const cargandoCursos = ref(true);

const cursoSeleccionadoId = ref("");
const cursoActual = ref(null);
const alumnos = ref([]);
const asignaciones = ref([]);
const notas = ref([]);

const cargandoPlanilla = ref(false);
const errorPlanilla = ref("");

// Modal Historial
const modalHistorialOpen = ref(false);
const alumnoHistorialSeleccionado = ref(null);
const historialItems = ref([]);
const cargandoHistorial = ref(false);

const cargarCursosPreceptor = async () => {
  cargandoCursos.value = true;
  try {
    const res = await obtenerCursos();
    if (res.success && res.data) {
      cursos.value = res.data || [];
      if (cursos.value.length > 0) {
        cursoSeleccionadoId.value = cursos.value[0].id_curso;
        await cargarPlanillaCurso();
      }
    }
  } catch (e) {
    console.error("Error al cargar cursos:", e);
  } finally {
    cargandoCursos.value = false;
  }
};

const onCursoChange = async () => {
  await cargarPlanillaCurso();
};

const cargarPlanillaCurso = async () => {
  if (!cursoSeleccionadoId.value) return;
  cargandoPlanilla.value = true;
  errorPlanilla.value = "";

  try {
    const res = await obtenerNotasPreceptorCurso(cursoSeleccionadoId.value);
    if (res.success && res.data) {
      cursoActual.value = res.data.curso;
      alumnos.value = res.data.alumnos || [];
      asignaciones.value = res.data.asignaciones || [];
      notas.value = res.data.notas || [];
    } else {
      errorPlanilla.value = res.message || "No se pudo obtener la planilla del curso.";
    }
  } catch (e) {
    errorPlanilla.value = "Error al conectar con el servidor.";
  } finally {
    cargandoPlanilla.value = false;
  }
};

const getNotaAlumnoMateria = (idAlumno, idAsignacion) => {
  const notaObj = notas.value.find(
    (n) => n.id_alumno === idAlumno && n.id_asignacion === idAsignacion
  );
  return notaObj ? parseFloat(notaObj.calificacion).toFixed(1) : "—";
};

const getGradeClass = (valStr) => {
  if (valStr === "—") return "grade-none";
  const val = parseFloat(valStr);
  if (val >= 7.0) return "grade-pass";
  if (val >= 4.0) return "grade-warning";
  return "grade-fail";
};

const calcularPromedioAlumno = (idAlumno) => {
  const notasAlumno = notas.value.filter((n) => n.id_alumno === idAlumno);
  if (notasAlumno.length === 0) return "—";
  const suma = notasAlumno.reduce((acc, curr) => acc + parseFloat(curr.calificacion), 0);
  return (suma / notasAlumno.length).toFixed(1);
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
  cargarCursosPreceptor();
});
</script>

<style scoped src="../preceptores.css"></style>
<style scoped>
.preceptor-view {
  padding: 10px 0;
}

.boletines-header h1 {
  font-size: 1.6rem;
  color: #1e293b;
  margin-bottom: 6px;
}

.boletines-header p {
  color: #64748b;
  font-size: 0.95rem;
}

.cursos-selector-wrap {
  margin: 20px 0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  padding: 14px 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.select-curso {
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  font-size: 0.95rem;
  font-weight: 600;
  color: #0f172a;
}

.mensaje-estado {
  padding: 40px;
  text-align: center;
  color: #64748b;
  font-size: 1.05rem;
}

.mensaje-estado.error {
  color: #c0152a;
}

.planilla-container {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  padding: 20px;
  margin-top: 10px;
}

.planilla-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.planilla-header h2 {
  font-size: 1.25rem;
  color: #0f172a;
  margin: 0;
}

.planilla-header span {
  color: #c0152a;
}

.read-only-badge {
  background: #f1f5f9;
  color: #475569;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
}

.table-responsive {
  overflow-x: auto;
}

.planilla-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.planilla-table th {
  background: #f8fafc;
  padding: 12px 14px;
  color: #475569;
  font-weight: 700;
  border-bottom: 2px solid #e2e8f0;
  white-space: nowrap;
}

.planilla-table td {
  padding: 12px 14px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.sticky-col {
  position: sticky;
  left: 0;
  background: #fff;
  z-index: 2;
}

.font-bold {
  font-weight: 700;
}

.grade-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.88rem;
}

.grade-pass {
  background: #dcfce7;
  color: #15803d;
}

.grade-warning {
  background: #fef9c3;
  color: #a16207;
}

.grade-fail {
  background: #fee2e2;
  color: #b91c1c;
}

.grade-none {
  color: #94a3b8;
}

.promedio-badge {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 6px 12px;
  border-radius: 8px;

}

.btn-history-icon {
  background: none;
  border: 1px solid #cbd5e1;
  color: #64748b;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-history-icon:hover {
  background: #f1f5f9;
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
  max-width: 500px;
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
}

.modal-footer {
  padding: 12px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
}

.btn-cerrar-modal {
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
  gap: 14px;
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
}

.timeline-content {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 10px 14px;
}

.timeline-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
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
  font-weight: 800;
  margin-top: 4px;
}

.prev-val {
  color: #64748b;
  text-decoration: line-through;
}

.new-val {
  color: #16a34a;
}

.mod-by {
  margin: 4px 0 0 0;
  font-size: 0.8rem;
  color: #475569;
}
</style>
