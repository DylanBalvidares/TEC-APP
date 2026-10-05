<template>
  <div class="preceptor-view">
    <div class="boletines-header">
      <h1><i class="fas fa-file-invoice"></i> Boletines Cuatrimestrales</h1>
      <p>Planillas de materias finalizadas y boletín consolidado del curso (solo lectura).</p>
    </div>

    <div v-if="cargandoCatalogos" class="mensaje-estado">
      <i class="fas fa-spinner fa-spin"></i> Cargando cursos y períodos...
    </div>
    <div v-else-if="errorCatalogos" class="mensaje-estado error">
      <i class="fas fa-circle-exclamation"></i> {{ errorCatalogos }}
    </div>
    <div v-else-if="cursos.length === 0" class="mensaje-estado">
      <i class="fas fa-school"></i> No tenés cursos asignados a tu cargo.
    </div>
    <div v-else-if="periodos.length === 0" class="mensaje-estado">
      <i class="fas fa-calendar-xmark"></i> Administración todavía no creó períodos de boletín.
    </div>

    <div class="cursos-selector-wrap" v-if="!cargandoCatalogos && cursos.length > 0 && periodos.length > 0">
      <label for="cursoSelect"><strong>Curso:</strong></label>
      <select id="cursoSelect" v-model="cursoId" @change="cargar" class="select-curso">
        <option value="" disabled>Seleccioná un curso...</option>
        <option v-for="c in cursos" :key="c.id_curso" :value="c.id_curso">
          🎓 {{ c.nombre_curso }} ({{ c.turno || "Sin turno" }})
        </option>
      </select>
      <label for="periodoSelect"><strong>Período:</strong></label>
      <select id="periodoSelect" v-model="periodoId" @change="cargar" class="select-curso">
        <option v-for="p in periodos" :key="p.id_periodo" :value="p.id_periodo">
          Ciclo {{ p.ciclo_lectivo }} — {{ p.cuatrimestre }}º cuatrimestre
        </option>
      </select>
    </div>

    <div v-if="!cargandoCatalogos && cargando" class="mensaje-estado">
      <i class="fas fa-spinner fa-spin"></i> Cargando boletín...
    </div>
    <div v-else-if="error && !planilla" class="mensaje-estado error">
      <i class="fas fa-circle-exclamation"></i> {{ error }}
    </div>

    <div v-if="planilla" class="planilla-container">
      <div class="planilla-header">
        <h2>
          Planillas — <span>{{ planilla.curso?.nombre_curso }}</span>
        </h2>
        <span class="read-only-badge"><i class="fas fa-eye"></i> Solo Lectura</span>
      </div>

      <div v-for="m in planilla.materias" :key="m.asignacion.id_asignacion" class="materia-bloque">
        <h3>
          {{ m.asignacion.materiaAsignacion?.nombre_materia || "Materia" }}
          <small v-if="!m.finalizada" class="text-muted">(aún no finalizada — sin acceso)</small>
        </h3>
        <div v-if="m.finalizada" class="table-responsive">
          <table class="planilla-table">
            <thead>
              <tr>
                <th>Alumno</th>
                <th class="text-center">Calificación</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="al in planilla.alumnos" :key="al.id_alumno">
                <td class="font-bold">{{ al.apellido }}, {{ al.nombre }}</td>
                <td class="text-center">
                  <span class="grade-badge">{{ etiquetaDe(m, al.id_alumno) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="consolidado" class="planilla-container">
      <div class="planilla-header">
        <h2>Boletín Consolidado</h2>
        <span class="read-only-badge"><i class="fas fa-eye"></i> Solo Lectura</span>
      </div>
      <div class="table-responsive">
        <table class="planilla-table">
          <thead>
            <tr>
              <th class="sticky-col">Alumno</th>
              <th v-for="a in consolidado.asignaciones" :key="a.id_asignacion" class="text-center">
                {{ a.materiaAsignacion?.nombre_materia || "Materia" }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="al in consolidado.alumnos" :key="al.id_alumno">
              <td class="sticky-col font-bold">{{ al.apellido }}, {{ al.nombre }}</td>
              <td v-for="a in consolidado.asignaciones" :key="a.id_asignacion" class="text-center">
                <span class="grade-badge">{{ celdaConsolidado(al.id_alumno, a.id_asignacion) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div v-else-if="cursoId && periodoId && !cargando && consolidadoError" class="mensaje-estado">
      <i class="fas fa-hourglass-half"></i> {{ consolidadoError }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { obtenerCursos } from "@/services/academico-service.js";
import {
  obtenerPeriodosBoletin,
  obtenerPlanillaBoletin,
  obtenerConsolidadoBoletin,
  etiquetaCalificacion,
} from "@/services/boletines-service.js";

const cursos = ref([]);
const periodos = ref([]);
const cursoId = ref("");
const periodoId = ref(null);
const planilla = ref(null);
const consolidado = ref(null);
const consolidadoError = ref("");
const cargando = ref(false);
const cargandoCatalogos = ref(true);
const errorCatalogos = ref("");
const error = ref("");

const etiquetaDe = (materia, idAlumno) => {
  const c = materia.calificaciones.find((x) => x.id_alumno === idAlumno);
  return c ? etiquetaCalificacion(c.tipo, c.valor) : "Pendiente";
};

const celdaConsolidado = (idAlumno, idAsig) => {
  const c = consolidado.value?.calificaciones?.[idAlumno]?.[idAsig];
  return c ? c.muestra : "—";
};

const cargar = async () => {
  if (!cursoId.value || !periodoId.value) return;
  cargando.value = true;
  error.value = "";
  consolidado.value = null;
  planilla.value = null;
  consolidadoError.value = "";
  const res = await obtenerPlanillaBoletin(cursoId.value, periodoId.value);
  cargando.value = false;
  if (!res.success) {
    planilla.value = null;
    error.value = res.message;
    return;
  }
  planilla.value = res.data;
  const cons = await obtenerConsolidadoBoletin(cursoId.value, periodoId.value);
  if (cons.success) {
    consolidado.value = cons.data;
  } else {
    consolidadoError.value = cons.message;
  }
};

onMounted(async () => {
  cargandoCatalogos.value = true;
  try {
    const [rc, rp] = await Promise.all([obtenerCursos(), obtenerPeriodosBoletin()]);
    cursos.value = rc.success ? rc.data || [] : [];
    if (!rc.success) errorCatalogos.value = rc.message;
    if (rp.success) {
      periodos.value = rp.data || [];
      if (periodos.value.length) periodoId.value = periodos.value[0].id_periodo;
    } else {
      errorCatalogos.value = rp.message;
    }
    if (cursos.value.length && periodos.value.length) {
      cursoId.value = cursos.value[0].id_curso;
      cargandoCatalogos.value = false;
      await cargar();
    }
  } catch {
    errorCatalogos.value = "No se pudieron cargar cursos y períodos.";
  } finally {
    cargandoCatalogos.value = false;
  }
});
</script>

<style scoped>
.materia-bloque { margin-bottom: 1.5rem; }
.materia-bloque h3 { margin: 0.75rem 0 0.5rem; }
.grade-badge { display: inline-block; min-width: 2.2rem; padding: 0.15rem 0.5rem; border-radius: 999px; background: #eef2ff; font-weight: 700; }
.cursos-selector-wrap { display: flex; flex-wrap: wrap; gap: 0.5rem 1rem; align-items: center; }
</style>
