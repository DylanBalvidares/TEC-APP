<template>
  <div class="preceptor-view">
    <div class="boletines-header libreta-intro">
      <div>
        <span class="libreta-eyebrow">Seguimiento académico</span>
        <h1><InlineIcon name="book-open" :size="22" /> Libreta Digital</h1>
        <p>Consultá las calificaciones de tus cursos y solicitá acceso temporal para corregir una planilla.</p>
      </div>
      <div class="libreta-privacy"><InlineIcon name="shield" :size="19" /><span>La edición requiere autorización del profesor titular</span></div>
    </div>

    <!-- ── Selector de Curso ── -->
    <div class="cursos-selector-wrap" v-if="!cargandoCursos && cursos.length > 0">
      <label for="cursoSelect"><InlineIcon name="users" :size="16" /><strong>Curso a consultar</strong></label>
      <select id="cursoSelect" v-model="cursoSeleccionadoId" @change="onCursoChange" class="select-curso">
        <option value="" disabled>Seleccioná un curso...</option>
        <option v-for="c in cursos" :key="c.id_curso" :value="c.id_curso">
          🎓 {{ c.nombre_curso }} — {{ c.nivel || 'General' }} ({{ c.turno || 'Sin turno' }})
        </option>
      </select>
    </div>

    <!-- ── Estados de Carga / Vacio ── -->
    <div v-if="cargandoCursos" class="mensaje-estado">
      <InlineIcon name="spinner" /> Cargando tus cursos...
    </div>

    <div v-else-if="cursos.length === 0" class="mensaje-estado">
      <InlineIcon name="school" /> No tenés cursos asignados a tu cargo.
    </div>

    <div v-else-if="cargandoPlanilla" class="mensaje-estado">
      <InlineIcon name="spinner" /> Cargando planilla de calificaciones...
    </div>

    <div v-else-if="errorPlanilla" class="mensaje-estado error">
      <InlineIcon name="alert" /> {{ errorPlanilla }}
    </div>

    <!-- ── Planilla Consolidada ── -->
    <div v-else-if="cursoSeleccionadoId" class="planilla-container">
      <div class="planilla-header">
        <div>
          <span class="libreta-eyebrow">Planilla del curso</span>
          <h2>{{ cursoActual?.nombre_curso }}</h2>
        </div>
        <span v-if="asignaciones.some((a) => permisoActivo(a.id_asignacion))" class="read-only-badge editing-badge">
          <InlineIcon name="edit" /> Edición temporal habilitada
        </span>
        <span v-else class="read-only-badge"><InlineIcon name="eye" /> Solo lectura</span>
      </div>

      <div class="resumen-libretas" aria-label="Resumen del curso">
        <div class="resumen-card"><InlineIcon name="student" :size="20" /><span><strong>{{ alumnos.length }}</strong><small>Alumnos</small></span></div>
        <div class="resumen-card"><InlineIcon name="book" :size="20" /><span><strong>{{ asignaciones.length }}</strong><small>Materias</small></span></div>
        <div class="resumen-card"><InlineIcon name="clipboard-check" :size="20" /><span><strong>{{ cantidadNotas }}</strong><small>Calificaciones cargadas</small></span></div>
      </div>

      <div class="libreta-table-tools">
        <label class="buscador-alumno" for="buscarAlumnoLibreta">
          <InlineIcon name="search" :size="16" />
          <input id="buscarAlumnoLibreta" v-model="busquedaAlumno" type="search" placeholder="Buscar alumno por nombre o apellido" />
        </label>
        <p>Las calificaciones se editan por materia cuando el profesor habilita el acceso.</p>
      </div>
      <div v-if="mensajeAccion" class="feedback-edicion" :class="{ error: errorAccion }" role="status">{{ mensajeAccion }}</div>

      <div class="table-responsive">
        <table class="planilla-table">
          <thead>
            <tr>
              <th class="sticky-col">Alumno</th>
              <th v-for="asig in asignaciones" :key="asig.id_asignacion" class="materia-heading">
                <span>{{ asig.materiaAsignacion?.nombre_materia || 'Materia' }}</span>
                <span v-if="permisoActivo(asig.id_asignacion)" class="status-chip status-approved">
                  <InlineIcon name="lock-open" :size="13" /> Hasta {{ fechaCorta(solicitudDe(asig.id_asignacion)?.fecha_expiracion) }}
                </span>
                <button
                  v-else
                  type="button"
                  class="btn-request-edit"
                  :disabled="solicitandoId === asig.id_asignacion || solicitudDe(asig.id_asignacion)?.estado === 'pendiente'"
                  @click="solicitarEdicion(asig)"
                >
                  <InlineIcon :name="solicitudDe(asig.id_asignacion)?.estado === 'pendiente' ? 'clock' : 'key'" :size="13" />
                  {{ textoSolicitud(asig.id_asignacion) }}
                </button>
              </th>
              <th class="text-center highlight-col">Promedio General</th>
              <th class="text-center">Historial</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="alumno in alumnosFiltrados" :key="alumno.id_alumno">
              <td class="sticky-col font-bold">
                {{ alumno.apellido }}, {{ alumno.nombre }}
              </td>
              <td v-for="asig in asignaciones" :key="asig.id_asignacion" class="text-center grade-cell">
                <div v-if="permisoActivo(asig.id_asignacion)" class="grade-editor">
                  <input
                    v-model="notasBorrador[claveNota(alumno.id_alumno, asig.id_asignacion)]"
                    type="number"
                    min="0"
                    max="10"
                    step="1"
                    placeholder="Nota entera"
                    :aria-label="`Calificación de ${alumno.apellido}, ${alumno.nombre} en ${asig.materiaAsignacion?.nombre_materia || 'Materia'}`"
                  />
                  <button
                    type="button"
                    class="btn-save-grade-preceptor"
                    :disabled="guardandoClave === claveNota(alumno.id_alumno, asig.id_asignacion)"
                    :aria-label="`Guardar calificación de ${alumno.nombre} ${alumno.apellido}`"
                    @click="guardarNotaPreceptor(alumno, asig)"
                  >
                    <InlineIcon :name="guardandoClave === claveNota(alumno.id_alumno, asig.id_asignacion) ? 'spinner' : 'save'" :size="16" />
                  </button>
                </div>
                <span v-else :class="['grade-badge', getGradeClass(getNotaAlumnoMateria(alumno.id_alumno, asig.id_asignacion))]">
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
                  <InlineIcon name="history" />
                </button>
              </td>
            </tr>
            <tr v-if="alumnosFiltrados.length === 0">
              <td :colspan="asignaciones.length + 3" class="text-center py-4 text-muted">
                {{ alumnos.length === 0 ? 'No hay alumnos registrados en este curso.' : 'No encontramos alumnos con esa búsqueda.' }}
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
          <h3><InlineIcon name="history" /> Historial de Calificaciones</h3>
          <button class="modal-close-btn" @click="modalHistorialOpen = false">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-subtitle">
            Alumno: <strong>{{ alumnoHistorialSeleccionado?.apellido }}, {{ alumnoHistorialSeleccionado?.nombre }}</strong>
          </p>

          <div v-if="cargandoHistorial" class="text-center py-4">
            <InlineIcon name="spinner" /> Cargando historial...
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
                    <InlineIcon name="arrow-right" class="arrow-icon" />
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
import { ref, computed, reactive, onMounted } from "vue";
import InlineIcon from "@/components/ui/InlineIcon.vue";
import {
  obtenerCursosPreceptor,
  obtenerNotasPreceptorCurso,
  obtenerHistorialNotasAlumno,
  guardarNota,
  obtenerSolicitudesEdicionPreceptor,
  solicitarEdicionPlanilla,
} from "@/services/academico-service.js";

const cursos = ref([]);
const cargandoCursos = ref(true);

const cursoSeleccionadoId = ref("");
const cursoActual = ref(null);
const alumnos = ref([]);
const asignaciones = ref([]);
const notas = ref([]);
const solicitudes = ref([]);
const notasBorrador = reactive({});
const busquedaAlumno = ref("");
const solicitandoId = ref(null);
const guardandoClave = ref(null);
const mensajeAccion = ref("");
const errorAccion = ref(false);

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
    const res = await obtenerCursosPreceptor();
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
      Object.keys(notasBorrador).forEach((clave) => delete notasBorrador[clave]);
      for (const alumno of alumnos.value) {
        for (const asignacion of asignaciones.value) {
          const clave = claveNota(alumno.id_alumno, asignacion.id_asignacion);
          const existente = notas.value.find((nota) =>
            Number(nota.id_alumno) === Number(alumno.id_alumno)
            && Number(nota.id_asignacion) === Number(asignacion.id_asignacion),
          );
          notasBorrador[clave] = existente?.calificacion ?? "";
        }
      }
      await cargarSolicitudesEdicion();
    } else {
      errorPlanilla.value = res.message || "No se pudo obtener la planilla del curso.";
    }
  } catch (e) {
    errorPlanilla.value = "Error al conectar con el servidor.";
  } finally {
    cargandoPlanilla.value = false;
  }
};

const cargarSolicitudesEdicion = async () => {
  const res = await obtenerSolicitudesEdicionPreceptor(cursoSeleccionadoId.value);
  solicitudes.value = res.success && Array.isArray(res.data) ? res.data : [];
};

const claveNota = (idAlumno, idAsignacion) => `${idAlumno}:${idAsignacion}`;

const solicitudDe = (idAsignacion) => solicitudes.value.find(
  (solicitud) => Number(solicitud.id_asignacion) === Number(idAsignacion),
);

const permisoActivo = (idAsignacion) => {
  const solicitud = solicitudDe(idAsignacion);
  return solicitud?.estado === "aprobada"
    && new Date(solicitud.fecha_expiracion).getTime() > Date.now();
};

const textoSolicitud = (idAsignacion) => {
  const solicitud = solicitudDe(idAsignacion);
  if (solicitud?.estado === "pendiente") return "Solicitud enviada";
  if (solicitud?.estado === "rechazada") return "Solicitar nuevamente";
  if (solicitud?.estado === "aprobada") return "Solicitar nuevamente";
  return "Solicitar edición";
};

const solicitarEdicion = async (asignacion) => {
  solicitandoId.value = asignacion.id_asignacion;
  mensajeAccion.value = "";
  errorAccion.value = false;
  const res = await solicitarEdicionPlanilla(asignacion.id_asignacion);
  if (res.success) {
    mensajeAccion.value = `Solicitud enviada al profesor de ${asignacion.materiaAsignacion?.nombre_materia || "la materia"}.`;
    await cargarSolicitudesEdicion();
  } else {
    mensajeAccion.value = res.message || "No se pudo enviar la solicitud.";
    errorAccion.value = true;
  }
  solicitandoId.value = null;
};

const guardarNotaPreceptor = async (alumno, asignacion) => {
  const clave = claveNota(alumno.id_alumno, asignacion.id_asignacion);
  const valorOriginal = notasBorrador[clave];
  const valor = Number(valorOriginal);
  if (valorOriginal === "" || valorOriginal === null || valorOriginal === undefined
    || !Number.isInteger(valor) || valor < 0 || valor > 10) {
    mensajeAccion.value = "Ingresá una calificación entera entre 0 y 10.";
    errorAccion.value = true;
    return;
  }
  guardandoClave.value = clave;
  mensajeAccion.value = "";
  errorAccion.value = false;
  const res = await guardarNota({
    id_alumno: alumno.id_alumno,
    id_asignacion: asignacion.id_asignacion,
    calificacion: valor,
  });
  if (res.success) {
    const indice = notas.value.findIndex((nota) =>
      Number(nota.id_alumno) === Number(alumno.id_alumno)
      && Number(nota.id_asignacion) === Number(asignacion.id_asignacion),
    );
    if (indice < 0) notas.value.push(res.data);
    else notas.value[indice] = res.data;
    mensajeAccion.value = `Calificación de ${alumno.nombre} ${alumno.apellido} guardada.`;
  } else {
    mensajeAccion.value = res.message || "No se pudo guardar la calificación.";
    errorAccion.value = true;
  }
  guardandoClave.value = null;
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

const alumnosFiltrados = computed(() => {
  const busqueda = busquedaAlumno.value.trim().toLocaleLowerCase("es-AR");
  if (!busqueda) return alumnos.value;
  return alumnos.value.filter((alumno) =>
    `${alumno.nombre || ""} ${alumno.apellido || ""}`.toLocaleLowerCase("es-AR").includes(busqueda),
  );
});

const cantidadNotas = computed(() => notas.value.filter((nota) => nota.calificacion !== null && nota.calificacion !== undefined).length);

const fechaCorta = (fecha) => fecha
  ? new Date(fecha).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
  : "";

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

.libreta-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  background: linear-gradient(125deg, #fff 35%, #fff7f7);
  box-shadow: 0 8px 24px rgba(15, 23, 42, .05);
}

.libreta-eyebrow { display: block; margin-bottom: 5px; color: #9f1239; font-size: .72rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
.libreta-intro h1 { margin: 0 0 5px; color: #172033; font-size: clamp(1.5rem, 2.6vw, 2rem); }
.libreta-intro h1 .inline-icon { margin-right: 8px; color: #b42335; }
.libreta-intro p { max-width: 680px; margin: 0; color: #64748b; }
.libreta-privacy { display: flex; align-items: center; gap: 10px; max-width: 265px; padding: 12px 14px; border: 1px solid #fecdd3; border-radius: 12px; background: #fff; color: #7f1d1d; font-size: .82rem; font-weight: 700; }
.libreta-privacy .inline-icon { flex: 0 0 auto; }

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

.cursos-selector-wrap label { display: inline-flex; align-items: center; gap: 8px; color: #334155; }
.cursos-selector-wrap label .inline-icon { color: #b42335; }

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

.read-only-badge {
  background: #f1f5f9;
  color: #475569;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.82rem;
  font-weight: 700;
}

.editing-badge { background: #ecfdf5; color: #047857; }
.resumen-libretas { display: grid; grid-template-columns: repeat(3, minmax(140px, 1fr)); gap: 12px; margin: 18px 0; }
.resumen-card { display: flex; align-items: center; gap: 12px; min-height: 72px; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fbfdff; }
.resumen-card > .inline-icon { box-sizing: border-box; width: 38px; height: 38px; padding: 9px; border-radius: 11px; background: #fff1f2; color: #b42335; }
.resumen-card span { display: grid; gap: 2px; }
.resumen-card strong { color: #172033; font-size: 1.12rem; }
.resumen-card small { color: #64748b; font-size: .75rem; }
.libreta-table-tools { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 18px 0 12px; }
.libreta-table-tools p { margin: 0; color: #64748b; font-size: .82rem; }
.buscador-alumno { display: flex; align-items: center; gap: 9px; width: min(380px, 100%); padding: 0 12px; border: 1px solid #cbd5e1; border-radius: 9px; background: #fff; color: #64748b; }
.buscador-alumno:focus-within { border-color: #b42335; box-shadow: 0 0 0 3px rgba(180,35,53,.12); }
.buscador-alumno input { width: 100%; min-width: 0; padding: 10px 0; border: 0; outline: 0; background: transparent; color: #172033; font: inherit; }
.feedback-edicion { margin: 0 0 12px; padding: 10px 13px; border: 1px solid #a7f3d0; border-radius: 9px; background: #ecfdf5; color: #047857; font-size: .88rem; }
.feedback-edicion.error { border-color: #fecaca; background: #fef2f2; color: #b91c1c; }

.table-responsive {
  overflow-x: auto;
}

.planilla-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.materia-heading { min-width: 160px; }
.materia-heading > span:first-child { color: #334155; }
.materia-heading .status-chip, .materia-heading .btn-request-edit { display: inline-flex; align-items: center; justify-content: center; gap: 5px; width: max-content; max-width: 100%; margin-top: 7px; white-space: normal; }
.status-chip { padding: 5px 8px; border-radius: 999px; font-size: .68rem; font-weight: 750; }
.status-approved { background: #dcfce7; color: #166534; }
.btn-request-edit { padding: 6px 8px; border: 1px solid #fecdd3; border-radius: 7px; background: #fff; color: #9f1239; font: inherit; font-size: .7rem; font-weight: 750; cursor: pointer; }
.btn-request-edit:hover:not(:disabled) { background: #fff1f2; }
.btn-request-edit:disabled { border-color: #e2e8f0; background: #f1f5f9; color: #64748b; cursor: not-allowed; }
.grade-editor { display: inline-flex; align-items: center; gap: 5px; }
.grade-editor input { width: 66px; min-height: 34px; padding: 5px 7px; border: 1px solid #cbd5e1; border-radius: 7px; text-align: center; font: inherit; font-weight: 700; }
.grade-editor input:focus-visible, .btn-save-grade-preceptor:focus-visible, .btn-request-edit:focus-visible, .btn-history-icon:focus-visible { outline: 2px solid #b42335; outline-offset: 2px; }
.btn-save-grade-preceptor { display: grid; place-items: center; width: 34px; height: 34px; border: 0; border-radius: 7px; background: #b42335; color: #fff; cursor: pointer; }
.btn-save-grade-preceptor:hover:not(:disabled) { background: #8f1728; }
.btn-save-grade-preceptor:disabled { opacity: .65; cursor: wait; }
.grade-cell { min-width: 94px; }

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

@media (max-width: 760px) {
  .libreta-intro { align-items: flex-start; flex-direction: column; padding: 20px; }
  .libreta-privacy { max-width: none; }
  .resumen-libretas { grid-template-columns: 1fr; }
  .libreta-table-tools { align-items: stretch; flex-direction: column; }
  .buscador-alumno { width: 100%; }
  .planilla-container { padding: 14px; }
  .planilla-header { align-items: flex-start; flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  .btn-request-edit, .btn-save-grade-preceptor, .btn-history-icon { transition: none; }
}
</style>
