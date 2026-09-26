<template>
  <div class="alumno-libreta-container">
    <!-- ── Header Banner ── -->
    <div class="libreta-header-card">
      <div class="header-main">
        <div class="header-icon">
          <i class="fas fa-graduation-cap"></i>
        </div>
        <div>
          <h1 class="header-title">Mi Libreta Digital</h1>
          <p class="header-sub">
            Alumno: <strong>{{ infoAlumno?.nombre }} {{ infoAlumno?.apellido }}</strong> — Curso: <strong>{{ infoAlumno?.curso }}</strong>
          </p>
        </div>
      </div>

      <div class="promedio-general-card" v-if="promedioGeneral !== null">
        <span class="prom-label">PROMEDIO GENERAL</span>
        <span class="prom-val">{{ promedioGeneral }}</span>
      </div>
    </div>

    <!-- ── Estado de Carga ── -->
    <div v-if="cargando" class="state-card">
      <i class="fas fa-spinner fa-spin state-icon"></i>
      <p>Cargando tus calificaciones...</p>
    </div>

    <div v-else-if="errorMsg" class="state-card error">
      <i class="fas fa-circle-exclamation state-icon"></i>
      <p>{{ errorMsg }}</p>
    </div>

    <!-- ── Tarjetas / Tabla de Materias ── -->
    <div v-else class="materias-grid">
      <div
        v-for="asig in asignaciones"
        :key="asig.id_asignacion"
        class="materia-card"
      >
        <div class="materia-card-header">
          <h3 class="materia-nombre">
            {{ asig.materiaAsignacion?.nombre_materia || 'Materia' }}
          </h3>
          <span class="prof-name">
            <i class="fas fa-chalkboard-user"></i>
            {{ asig.profesorAsignacion ? `Prof. ${asig.profesorAsignacion.apellido}` : 'Sin profesor' }}
          </span>
        </div>

        <div class="materia-card-body">
          <div class="notas-list">
            <span class="notas-label">Notas registradas:</span>
            <div class="notas-chips">
              <span
                v-for="(n, idx) in getNotasDeAsignacion(asig.id_asignacion)"
                :key="idx"
                :class="['nota-chip', getNotaChipClass(n.calificacion)]"
              >
                {{ parseFloat(n.calificacion).toFixed(1) }}
              </span>
              <span v-if="getNotasDeAsignacion(asig.id_asignacion).length === 0" class="no-notas">
                Sin notas aún
              </span>
            </div>
          </div>
        </div>

        <div class="materia-card-footer">
          <span class="prom-materia-label">Promedio de materia:</span>
          <span :class="['prom-materia-val', getNotaChipClass(getPromedioMateria(asig.id_asignacion))]">
            {{ getPromedioMateriaFormatted(asig.id_asignacion) }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Sección Historial de Cambios ── -->
    <div class="historial-section" v-if="!cargando && !errorMsg">
      <div class="section-title-wrap">
        <h2><i class="fas fa-clock-rotate-left"></i> Historial de Cambios</h2>
        <button class="btn-toggle-historial" @click="toggleHistorial">
          {{ mostrarHistorial ? 'Ocultar historial' : 'Ver mi historial de modificaciones' }}
        </button>
      </div>

      <div v-if="mostrarHistorial" class="historial-content">
        <div v-if="cargandoHistorial" class="py-4 text-center">
          <i class="fas fa-spinner fa-spin"></i> Cargando historial...
        </div>
        <div v-else-if="historialItems.length === 0" class="empty-historial">
          No hay registros de modificaciones anteriores en tus calificaciones.
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
                <p class="mod-by">Actualizado por docente/preceptor</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  obtenerMisNotasAlumno,
  obtenerHistorialNotasAlumno,
} from "@/services/academico-service.js";

const infoAlumno = ref(null);
const asignaciones = ref([]);
const notas = ref([]);
const promediosMaterias = ref({});
const promedioGeneral = ref(null);

const cargando = ref(true);
const errorMsg = ref("");

const mostrarHistorial = ref(false);
const historialItems = ref([]);
const cargandoHistorial = ref(false);

const cargarNotasAlumno = async () => {
  cargando.value = true;
  errorMsg.value = "";

  try {
    const res = await obtenerMisNotasAlumno();
    if (res.success && res.data) {
      infoAlumno.value = res.data.alumno;
      asignaciones.value = res.data.asignaciones || [];
      notas.value = res.data.notas || [];
      promediosMaterias.value = res.data.promedios?.por_materia || {};
      promedioGeneral.value = res.data.promedios?.general ?? null;
    } else {
      errorMsg.value = res.message || "No se pudieron obtener tus calificaciones.";
    }
  } catch (e) {
    errorMsg.value = "Error al conectar con el servidor.";
  } finally {
    cargando.value = false;
  }
};

const getNotasDeAsignacion = (idAsig) => {
  return notas.value.filter((n) => n.id_asignacion === idAsig);
};

const getPromedioMateria = (idAsig) => {
  return promediosMaterias.value[idAsig] ?? null;
};

const getPromedioMateriaFormatted = (idAsig) => {
  const prom = getPromedioMateria(idAsig);
  return prom !== null ? parseFloat(prom).toFixed(1) : "—";
};

const getNotaChipClass = (val) => {
  if (val === null || val === undefined || val === "—") return "chip-none";
  const num = parseFloat(val);
  if (num >= 7.0) return "chip-pass";
  if (num >= 4.0) return "chip-warning";
  return "chip-fail";
};

const toggleHistorial = async () => {
  mostrarHistorial.value = !mostrarHistorial.value;
  if (mostrarHistorial.value && historialItems.value.length === 0 && infoAlumno.value?.id_alumno) {
    cargandoHistorial.value = true;
    try {
      const res = await obtenerHistorialNotasAlumno(infoAlumno.value.id_alumno);
      if (res.success && res.data) {
        historialItems.value = res.data;
      }
    } catch (e) {
      console.error(e);
    } finally {
      cargandoHistorial.value = false;
    }
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
  cargarNotasAlumno();
});
</script>

<style scoped src="../alumno.css"></style>
<style scoped>
.alumno-libreta-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.libreta-header-card {
  background: linear-gradient(135deg, #b01020 0%, #7a0a18 100%);
  color: white;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 8px 24px rgba(176, 16, 32, 0.2);
  margin-bottom: 24px;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

.header-title {
  margin: 0 0 4px 0;
  font-size: 1.6rem;
  font-weight: 800;
}

.header-sub {
  margin: 0;
  font-size: 0.95rem;
  opacity: 0.9;
}

.promedio-general-card {
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(8px);
  padding: 12px 20px;
  border-radius: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
}

.prom-label {
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.05em;
}

.prom-val {
  font-size: 1.8rem;
  font-weight: 900;
}

.state-card {
  background: white;
  border-radius: 16px;
  padding: 50px;
  text-align: center;
  color: #64748b;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.state-icon {
  font-size: 2rem;
  margin-bottom: 12px;
}

.state-card.error {
  color: #c0152a;
}

.materias-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.materia-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.materia-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.materia-card-header {
  padding: 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.materia-nombre {
  margin: 0 0 6px 0;
  font-size: 1.1rem;
  color: #0f172a;

}

.prof-name {
  font-size: 0.85rem;
  color: #64748b;

}

.materia-card-body {
  padding: 16px;
  flex: 1;
}

.notas-label {
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  display: block;
  margin-bottom: 8px;

}

.notas-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.nota-chip {
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 800;
  font-size: 0.9rem;
}

.chip-pass {
  background: #dcfce7;
  color: #15803d;
}

.chip-warning {
  background: #fef9c3;
  color: #a16207;
}

.chip-fail {
  background: #fee2e2;
  color: #b91c1c;
}

.chip-none {
  background: #f1f5f9;
  color: #94a3b8;
}

.no-notas {
  font-size: 0.85rem;
  color: #94a3b8;
  font-style: italic;
}

.materia-card-footer {
  padding: 12px 16px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.prom-materia-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #475569;
}

.prom-materia-val {
  padding: 4px 12px;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1rem;
}

/* Historial */
.historial-section {
  margin-top: 36px;
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.section-title-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title-wrap h2 {
  font-size: 1.2rem;
  color: #0f172a;
  margin: 0;

}

.btn-toggle-historial {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #cbd5e1;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;

}

.btn-toggle-historial:hover {
  background: #e2e8f0;
}

.historial-content {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
}

.empty-historial {
  color: #64748b;
  font-size: 0.9rem;
  text-align: center;
  padding: 16px;
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
  background: #b01020;
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
  color: #64748b;
}
</style>
