<template>
  <div class="preceptor-view boletines-preceptor">
    <header class="boletines-header">
      <h1><i class="fas fa-file-invoice" aria-hidden="true"></i> Boletines Cuatrimestrales</h1>
      <p>Consultá las calificaciones finales por período. Las planillas y el consolidado son de solo lectura.</p>
    </header>

    <!-- Banner informativo de Boletines Cuatrimestrales -->
    <div class="preceptor-info-banner">
      <i class="fas fa-circle-info" aria-hidden="true"></i>
      <div>
        <strong>Boletines Oficiales por Cuatrimestre:</strong> En esta sección podés supervisar el estado de cierre de cada materia. Cuando todas las asignaturas estén finalizadas por los docentes, el consolidado general se generará automáticamente para la entrega y consulta formal.
      </div>
    </div>

    <div v-if="cargandoCatalogos" class="mensaje-estado" role="status" aria-live="polite">
      <i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Cargando cursos y períodos...
    </div>
    <div v-else-if="errorCatalogos" class="mensaje-estado error" role="alert">
      <i class="fas fa-circle-exclamation" aria-hidden="true"></i> {{ errorCatalogos }}
      <button class="btn-reintentar" type="button" @click="cargarCatalogos">Reintentar</button>
    </div>
    <div v-else-if="cursos.length === 0" class="mensaje-estado">
      <i class="fas fa-school" aria-hidden="true"></i> No tenés cursos asignados a tu cargo.
    </div>
    <div v-else-if="periodos.length === 0" class="mensaje-estado">
      <i class="fas fa-calendar-xmark" aria-hidden="true"></i> Administración todavía no creó períodos de boletín.
    </div>

    <template v-if="!cargandoCatalogos && !errorCatalogos && cursos.length > 0 && periodos.length > 0">
      <div class="cursos-selector-wrap">
        <label for="boletin-curso"><strong>Curso:</strong></label>
        <select id="boletin-curso" v-model="cursoId" class="select-curso" @change="cargar">
          <option v-for="curso in cursos" :key="curso.id_curso" :value="String(curso.id_curso)">
            {{ curso.nombre_curso }} ({{ curso.turno || "Sin turno" }})
          </option>
        </select>

        <label for="boletin-periodo"><strong>Período:</strong></label>
        <select id="boletin-periodo" v-model="periodoId" class="select-curso" @change="cargar">
          <option v-for="periodo in periodos" :key="periodo.id_periodo" :value="String(periodo.id_periodo)">
            Ciclo {{ periodo.ciclo_lectivo }} — {{ periodo.cuatrimestre }}º cuatrimestre
          </option>
        </select>
      </div>

      <p v-if="cursoSeleccionado && periodoSeleccionado" class="boletines-contexto">
        {{ cursoSeleccionado.nombre_curso }} · Ciclo {{ periodoSeleccionado.ciclo_lectivo }} ·
        {{ periodoSeleccionado.cuatrimestre }}º cuatrimestre
      </p>

      <div v-if="cargandoPlanilla" class="mensaje-estado" role="status" aria-live="polite">
        <i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Cargando planillas del curso...
      </div>
      <div v-else-if="errorPlanilla" class="mensaje-estado error" role="alert">
        <i class="fas fa-circle-exclamation" aria-hidden="true"></i> {{ errorPlanilla }}
        <button class="btn-reintentar" type="button" @click="cargar">Reintentar consulta</button>
      </div>

      <template v-if="planilla">
        <section class="planilla-container" aria-labelledby="planillas-titulo">
          <div class="planilla-header">
            <h2 id="planillas-titulo">Planillas — <span>{{ planilla.curso?.nombre_curso || cursoSeleccionado?.nombre_curso }}</span></h2>
            <span class="read-only-badge"><i class="fas fa-eye" aria-hidden="true"></i> Solo lectura</span>
          </div>

          <div v-if="materiasFinalizadas.length || materiasPendientes.length" class="disponibilidad" role="status">
            <span>{{ materiasFinalizadas.length }} {{ materiasFinalizadas.length === 1 ? "materia finalizada" : "materias finalizadas" }}</span>
            <span v-if="materiasPendientes.length">{{ materiasPendientes.length }} {{ materiasPendientes.length === 1 ? "pendiente" : "pendientes" }}</span>
          </div>

          <p v-if="planilla.materias?.length === 0" class="mensaje-estado">
            No hay materias preparadas para este curso y período.
          </p>

          <article v-for="materia in materiasFinalizadas" :key="materia.asignacion.id_asignacion" class="materia-bloque">
            <h3>{{ nombreMateria(materia) }} <span class="estado-materia estado-finalizada">Finalizada</span></h3>
            <div class="table-responsive">
              <table class="planilla-table">
                <thead>
                  <tr><th scope="col">Alumno</th><th scope="col" class="text-center">Calificación</th></tr>
                </thead>
                <tbody>
                  <tr v-for="alumno in planilla.alumnos" :key="alumno.id_alumno">
                    <td class="font-bold">{{ alumno.apellido }}, {{ alumno.nombre }}</td>
                    <td class="text-center"><span class="grade-badge">{{ etiquetaDe(materia, alumno.id_alumno) }}</span></td>
                  </tr>
                  <tr v-if="planilla.alumnos?.length === 0">
                    <td colspan="2" class="sin-alumnos">No hay alumnos activos en este curso.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>

          <ul v-if="materiasPendientes.length" class="materias-pendientes" aria-label="Materias que todavía no están finalizadas">
            <li v-for="materia in materiasPendientes" :key="materia.asignacion.id_asignacion">
              <span class="estado-materia estado-pendiente">{{ textoEstado(materia.estado) }}</span>
              {{ nombreMateria(materia) }}
            </li>
          </ul>
        </section>

        <section v-if="cargandoConsolidado" class="mensaje-estado" role="status" aria-live="polite">
          <i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Consultando disponibilidad del boletín consolidado...
        </section>
        <section v-else-if="consolidadoError" class="mensaje-estado" :class="{ error: consolidadoError.tipo === 'error' }" :role="consolidadoError.tipo === 'error' ? 'alert' : 'status'" aria-live="polite">
          <i :class="consolidadoError.tipo === 'pendiente' ? 'fas fa-hourglass-half' : 'fas fa-circle-exclamation'" aria-hidden="true"></i>
          {{ consolidadoError.mensaje }}
          <button v-if="consolidadoError.tipo === 'error'" class="btn-reintentar" type="button" @click="cargarConsolidado">Reintentar consolidado</button>
        </section>

        <section v-if="consolidado" class="planilla-container" aria-labelledby="consolidado-titulo">
          <div class="planilla-header">
            <h2 id="consolidado-titulo">Boletín Consolidado</h2>
            <span class="read-only-badge"><i class="fas fa-eye" aria-hidden="true"></i> Solo lectura</span>
          </div>
          <div class="table-responsive">
            <table class="planilla-table">
              <thead>
                <tr>
                  <th class="sticky-col" scope="col">Alumno</th>
                  <th v-for="asignacion in consolidado.asignaciones" :key="asignacion.id_asignacion" scope="col" class="text-center">
                    {{ asignacion.materiaAsignacion?.nombre_materia || "Materia" }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="alumno in consolidado.alumnos" :key="alumno.id_alumno">
                  <td class="sticky-col font-bold">{{ alumno.apellido }}, {{ alumno.nombre }}</td>
                  <td v-for="asignacion in consolidado.asignaciones" :key="asignacion.id_asignacion" class="text-center">
                    <span class="grade-badge">{{ celdaConsolidado(alumno.id_alumno, asignacion.id_asignacion) }}</span>
                  </td>
                </tr>
                <tr v-if="consolidado.alumnos?.length === 0">
                  <td :colspan="(consolidado.asignaciones?.length || 0) + 1" class="sin-alumnos">No hay alumnos activos en este curso.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
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
const periodoId = ref("");
const planilla = ref(null);
const consolidado = ref(null);
const consolidadoError = ref(null);
const cargandoCatalogos = ref(true);
const cargandoPlanilla = ref(false);
const cargandoConsolidado = ref(false);
const errorCatalogos = ref("");
const errorPlanilla = ref("");
let solicitudPlanilla = 0;
let solicitudConsolidado = 0;

const cursoSeleccionado = computed(() => cursos.value.find((curso) => String(curso.id_curso) === cursoId.value));
const periodoSeleccionado = computed(() => periodos.value.find((periodo) => String(periodo.id_periodo) === periodoId.value));
const materiasFinalizadas = computed(() => (planilla.value?.materias || []).filter((materia) => materia.finalizada));
const materiasPendientes = computed(() => (planilla.value?.materias || []).filter((materia) => !materia.finalizada));

const mensajeError = (resultado, respaldo) => {
  if (!resultado?.status || resultado.status < 500) return resultado?.message || respaldo;
  return respaldo;
};

const ordenarPeriodos = (lista) => [...lista].sort((a, b) =>
  Number(b.ciclo_lectivo) - Number(a.ciclo_lectivo) || Number(b.cuatrimestre) - Number(a.cuatrimestre),
);

const invalidarConsultas = () => {
  solicitudPlanilla += 1;
  solicitudConsolidado += 1;
  cargandoPlanilla.value = false;
  cargandoConsolidado.value = false;
};

const cargarCatalogos = async () => {
  invalidarConsultas();
  cargandoCatalogos.value = true;
  errorCatalogos.value = "";
  errorPlanilla.value = "";
  planilla.value = null;
  consolidado.value = null;
  consolidadoError.value = null;
  try {
    const [respuestaCursos, respuestaPeriodos] = await Promise.all([
      obtenerCursos(),
      obtenerPeriodosBoletin(),
    ]);
    const errores = [];
    if (respuestaCursos.success) {
      cursos.value = respuestaCursos.data || [];
    } else {
      cursos.value = [];
      errores.push(mensajeError(respuestaCursos, "No se pudieron cargar los cursos."));
    }
    if (respuestaPeriodos.success) {
      periodos.value = ordenarPeriodos(respuestaPeriodos.data || []);
    } else {
      periodos.value = [];
      errores.push(mensajeError(respuestaPeriodos, "No se pudieron cargar los períodos."));
    }
    if (errores.length) {
      errorCatalogos.value = errores.join(" ");
      return;
    }
    cursoId.value = cursos.value.length ? String(cursos.value[0].id_curso) : "";
    periodoId.value = periodos.value.length ? String(periodos.value[0].id_periodo) : "";
  } catch {
    errorCatalogos.value = "No se pudieron cargar cursos y períodos. Revisá tu conexión e intentá nuevamente.";
  } finally {
    cargandoCatalogos.value = false;
  }
  if (cursoId.value && periodoId.value) await cargar();
};

const cargar = async () => {
  invalidarConsultas();
  planilla.value = null;
  consolidado.value = null;
  consolidadoError.value = null;
  errorPlanilla.value = "";
  if (!cursoId.value || !periodoId.value) return;

  const version = ++solicitudPlanilla;
  const cursoActivo = cursoId.value;
  const periodoActivo = periodoId.value;
  cargandoPlanilla.value = true;
  try {
    const respuesta = await obtenerPlanillaBoletin(cursoActivo, periodoActivo);
    if (version !== solicitudPlanilla) return;
    if (!respuesta.success) {
      errorPlanilla.value = mensajeError(respuesta, "No se pudo cargar la planilla. Intentá nuevamente.");
      return;
    }
    planilla.value = respuesta.data;
  } catch {
    if (version === solicitudPlanilla) errorPlanilla.value = "No se pudo cargar la planilla. Revisá tu conexión e intentá nuevamente.";
  } finally {
    if (version === solicitudPlanilla) cargandoPlanilla.value = false;
  }
  if (version === solicitudPlanilla && planilla.value) await cargarConsolidado(version, cursoActivo, periodoActivo);
};

const cargarConsolidado = async (versionPlanilla = solicitudPlanilla, cursoActivo = cursoId.value, periodoActivo = periodoId.value) => {
  const version = ++solicitudConsolidado;
  consolidado.value = null;
  consolidadoError.value = null;
  cargandoConsolidado.value = true;
  try {
    const respuesta = await obtenerConsolidadoBoletin(cursoActivo, periodoActivo);
    if (version !== solicitudConsolidado || versionPlanilla !== solicitudPlanilla) return;
    if (respuesta.success) {
      consolidado.value = respuesta.data;
    } else if (respuesta.status === 409) {
      consolidadoError.value = { tipo: "pendiente", mensaje: respuesta.message || "El consolidado estará disponible cuando todas las materias estén finalizadas." };
    } else {
      consolidadoError.value = { tipo: "error", mensaje: mensajeError(respuesta, "No se pudo consultar el consolidado. Intentá nuevamente.") };
    }
  } catch {
    if (version === solicitudConsolidado && versionPlanilla === solicitudPlanilla) {
      consolidadoError.value = { tipo: "error", mensaje: "No se pudo consultar el consolidado. Revisá tu conexión e intentá nuevamente." };
    }
  } finally {
    if (version === solicitudConsolidado && versionPlanilla === solicitudPlanilla) cargandoConsolidado.value = false;
  }
};

const etiquetaDe = (materia, idAlumno) => {
  const calificacion = (materia.calificaciones || []).find((item) => Number(item.id_alumno) === Number(idAlumno));
  return calificacion ? etiquetaCalificacion(calificacion.tipo, calificacion.valor) : "Pendiente";
};

const celdaConsolidado = (idAlumno, idAsignacion) =>
  consolidado.value?.calificaciones?.[idAlumno]?.[idAsignacion]?.muestra ?? "—";

const nombreMateria = (materia) => materia.asignacion?.materiaAsignacion?.nombre_materia || "Materia";
const textoEstado = (estado) => ({
  pendiente: "Pendiente",
  en_progreso: "En curso",
}[estado] || "Pendiente");

onMounted(cargarCatalogos);
</script>

<style scoped>
.boletines-preceptor { padding: 10px 0; }
.boletines-header { margin-bottom: 20px; }
.boletines-header h1 { margin: 0 0 6px; color: #1e293b; font-size: 1.6rem; }
.boletines-header p, .boletines-contexto { color: #64748b; }
.cursos-selector-wrap { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; margin: 20px 0 10px; padding: 14px 20px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #0000000d; }
.select-curso { min-height: 42px; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; color: #0f172a; font-size: .95rem; }
.select-curso:focus-visible, .btn-reintentar:focus-visible { outline: 3px solid #2563eb; outline-offset: 2px; }
.boletines-contexto { margin: 0 0 14px; font-size: .9rem; }
.mensaje-estado { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; padding: 24px 16px; color: #64748b; text-align: center; }
.mensaje-estado.error { color: #b42323; }
.btn-reintentar { padding: 8px 12px; border: 1px solid currentColor; border-radius: 8px; background: #fff; color: inherit; font: inherit; font-weight: 600; cursor: pointer; }
.planilla-container { margin-top: 16px; padding: 20px; border-radius: 16px; background: #fff; box-shadow: 0 4px 16px #0000000f; }
.planilla-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 16px; }
.planilla-header h2 { margin: 0; color: #0f172a; font-size: 1.2rem; }
.read-only-badge { padding: 6px 12px; border-radius: 20px; background: #f1f5f9; color: #475569; font-size: .82rem; font-weight: 700; }
.disponibilidad { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 12px; color: #475569; font-size: .88rem; }
.disponibilidad span { padding: 5px 9px; border-radius: 999px; background: #f1f5f9; }
.materia-bloque { margin-bottom: 1.5rem; }
.materia-bloque h3 { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: .75rem 0 .5rem; color: #0f172a; }
.estado-materia { display: inline-flex; padding: 4px 9px; border-radius: 999px; font-size: .75rem; font-weight: 700; }
.estado-finalizada { background: #dcfce7; color: #15803d; }
.estado-pendiente { background: #fef3c7; color: #92400e; }
.materias-pendientes { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.materias-pendientes li { display: flex; align-items: center; gap: 8px; color: #334155; }
.table-responsive { overflow-x: auto; }
.planilla-table { width: 100%; border-collapse: collapse; font-size: .9rem; }
.planilla-table th { padding: 12px 14px; border-bottom: 2px solid #e2e8f0; background: #f8fafc; color: #475569; text-align: left; white-space: nowrap; }
.planilla-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; }
.planilla-table .text-center { text-align: center; }
.sticky-col { position: sticky; left: 0; z-index: 1; background: #fff; }
.planilla-table th.sticky-col { background: #f8fafc; }
.font-bold { font-weight: 700; }
.grade-badge { display: inline-block; min-width: 2.2rem; padding: .2rem .55rem; border-radius: 999px; background: #eef2ff; color: #1e293b; font-weight: 700; }
.sin-alumnos { color: #64748b; text-align: center; }
@media (max-width: 600px) {
  .cursos-selector-wrap { align-items: stretch; padding: 14px; }
  .cursos-selector-wrap label { width: 100%; }
  .select-curso { width: 100%; }
  .planilla-container { padding: 14px; }
  .planilla-table th, .planilla-table td { padding: 10px; }
}
</style>
