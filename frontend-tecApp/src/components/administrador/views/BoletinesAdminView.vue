<template>
  <main class="boletines-admin">
    <header class="boletines-hero">
      <div>
        <p class="boletines-eyebrow">Gestión académica</p>
        <h1>Boletines cuatrimestrales</h1>
        <p class="boletines-intro">Organizá los períodos, prepará las materias y seguí la carga de cada curso.</p>
      </div>
      <div class="hero-note"><i class="ti ti-shield-check" aria-hidden="true"></i><span>Las calificaciones de la libreta digital no se modifican.</span></div>
    </header>

    <div class="boletin-metricas" aria-label="Resumen de boletines">
      <article class="boletin-metrica">
        <span class="metrica-icono"><i class="ti ti-calendar-event" aria-hidden="true"></i></span>
        <div><span class="metrica-etiqueta">Períodos creados</span><strong>{{ periodos.length }}</strong></div>
      </article>
      <article class="boletin-metrica">
        <span class="metrica-icono is-green"><i class="ti ti-lock-open" aria-hidden="true"></i></span>
        <div><span class="metrica-etiqueta">Carga habilitada</span><strong>{{ periodosVigentes }}</strong></div>
      </article>
      <article class="boletin-metrica">
        <span class="metrica-icono is-amber"><i class="ti ti-refresh-alert" aria-hidden="true"></i></span>
        <div><span class="metrica-etiqueta">Reaperturas pendientes</span><strong>{{ reaperturasPendientes }}</strong></div>
      </article>
    </div>

    <section class="boletin-panel" aria-labelledby="periodos-title">
      <div class="panel-heading">
        <div>
          <p class="panel-kicker">Configuración</p>
          <h2 id="periodos-title">Períodos de carga</h2>
          <p>Definí las fechas y el estado que habilitan la carga docente.</p>
        </div>
        <span class="panel-count">{{ periodos.length }} {{ periodos.length === 1 ? "período" : "períodos" }}</span>
      </div>

      <div v-if="errorPeriodos" class="boletin-alert is-error" role="alert">
        <i class="ti ti-alert-circle" aria-hidden="true"></i><span>{{ errorPeriodos }}</span>
      </div>
      <div v-else-if="cargandoPeriodos" class="boletin-empty compact" role="status"><i class="ti ti-loader-2 animate-spin" aria-hidden="true"></i><span>Cargando períodos…</span></div>
      <div v-else-if="periodos.length === 0" class="boletin-empty" role="status">
        <span class="empty-icon"><i class="ti ti-calendar-plus" aria-hidden="true"></i></span>
        <strong>Todavía no hay períodos</strong>
        <p>Creá el período del ciclo lectivo para empezar a organizar los boletines.</p>
      </div>
      <div v-else class="boletin-table-wrap">
        <table class="boletin-table" aria-label="Períodos de carga de boletines">
          <thead><tr><th>Período</th><th>Vigencia</th><th>Estado de carga</th><th class="actions-col">Acción</th></tr></thead>
          <tbody>
            <tr v-for="p in periodos" :key="p.id_periodo">
              <td>
                <strong>Ciclo {{ p.ciclo_lectivo }}</strong>
                <span class="cell-secondary">{{ p.cuatrimestre }}º cuatrimestre</span>
              </td>
              <td>
                <span class="date-range"><i class="ti ti-calendar" aria-hidden="true"></i>{{ mostrarFecha(p.fecha_inicio) }} <span aria-hidden="true">→</span> {{ mostrarFecha(p.fecha_cierre) }}</span>
              </td>
              <td>
                <div class="state-control">
                  <span :class="['state-dot', `dot-${p.estado}`]" aria-hidden="true"></span>
                  <select v-model="p.estado" :disabled="guardandoEstado[p.id_periodo]" :aria-label="`Estado del período ${p.ciclo_lectivo}, cuatrimestre ${p.cuatrimestre}`" @change="cambiarEstado(p)">
                    <option value="programado">Programado</option>
                    <option value="abierto">Abierto</option>
                    <option value="cerrado">Cerrado</option>
                  </select>
                  <span v-if="p.vigente" class="vigente-tag">En fecha</span>
                </div>
              </td>
              <td class="actions-col">
                <button class="link-action" type="button" @click="seleccionarPeriodo(p)">
                  Preparar curso <i class="ti ti-arrow-down-right" aria-hidden="true"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <details class="nuevo-periodo">
        <summary><span class="summary-plus"><i class="ti ti-plus" aria-hidden="true"></i></span><span><strong>Crear período</strong><small>Agregar otro cuatrimestre al calendario</small></span><i class="ti ti-chevron-down summary-chevron" aria-hidden="true"></i></summary>
        <div class="nuevo-periodo-body">
          <div class="periodo-form-grid">
            <label for="nuevo-ciclo">Ciclo lectivo<input id="nuevo-ciclo" v-model.number="nuevo.ciclo_lectivo" type="number" min="2000" max="2100" placeholder="Ej. 2026" /></label>
            <label for="nuevo-cuatri">Cuatrimestre<select id="nuevo-cuatri" v-model="nuevo.cuatrimestre"><option value="1">1º cuatrimestre</option><option value="2">2º cuatrimestre</option></select></label>
            <label for="nuevo-inicio">Inicio de carga<input id="nuevo-inicio" v-model="nuevo.fecha_inicio" type="date" /></label>
            <label for="nuevo-cierre">Cierre de carga<input id="nuevo-cierre" v-model="nuevo.fecha_cierre" type="date" /></label>
          </div>
          <div class="form-bottom">
            <p v-if="fechasInvalidas" class="inline-message is-error" role="alert"><i class="ti ti-alert-circle" aria-hidden="true"></i> El inicio no puede ser posterior al cierre.</p>
            <p v-else-if="!formularioValido" class="inline-message">Completá ciclo, cuatrimestre, inicio y cierre para habilitar la creación.</p>
            <p v-else class="inline-message is-success"><i class="ti ti-check" aria-hidden="true"></i> Fechas válidas para el nuevo período.</p>
            <button class="tb-btn primary" :disabled="!formularioValido || fechasInvalidas || creando" @click="crear">
              <i :class="creando ? 'ti ti-loader-2 animate-spin' : 'ti ti-plus'" aria-hidden="true"></i>{{ creando ? "Creando…" : "Crear período" }}
            </button>
          </div>
        </div>
      </details>
    </section>

    <div class="boletin-work-grid">
      <section id="preparar-curso" class="boletin-panel" aria-labelledby="preparar-title">
        <div class="panel-heading">
          <div><p class="panel-kicker">Paso 1 · Configuración</p><h2 id="preparar-title">Preparar un curso</h2><p>Fijá las materias y responsables para este boletín.</p></div>
          <span class="step-mark">01</span>
        </div>
        <div class="panel-body">
          <label class="field-label" for="preparar-periodo">Período</label>
          <select id="preparar-periodo" v-model="prepararForm.id_periodo" class="boletin-select" @change="prepararForm.id_plan = null">
            <option :value="null" disabled>Elegí un período</option>
            <option v-for="p in periodos" :key="p.id_periodo" :value="p.id_periodo">{{ p.ciclo_lectivo }} · {{ p.cuatrimestre }}º cuatrimestre</option>
          </select>

          <label class="field-label" for="preparar-curso">Curso</label>
          <select id="preparar-curso" v-model="prepararForm.id_curso" class="boletin-select" @change="prepararForm.id_plan = null">
            <option :value="null" disabled>Elegí un curso</option>
            <option v-for="c in cursos" :key="c.id_curso" :value="c.id_curso">{{ c.nombre_curso }} · Año {{ c.anio || "sin asignar" }}</option>
          </select>

          <label class="field-label" for="preparar-plan">Plan de estudios</label>
          <select id="preparar-plan" v-model="prepararForm.id_plan" class="boletin-select" :disabled="!planesAplicables.length">
            <option :value="null" disabled>{{ planesAplicables.length ? "Elegí el plan aplicable" : "Seleccioná período y curso primero" }}</option>
            <option v-for="plan in planesAplicables" :key="plan.id_plan" :value="plan.id_plan">{{ plan.nombre }} · {{ plan.orientacion }}</option>
          </select>

          <div v-if="prepararForm.id_curso && prepararForm.id_periodo && planes.length > 0 && planesAplicables.length === 0" class="boletin-alert is-warning" role="status">
            <i class="ti ti-info-circle" aria-hidden="true"></i><span>No hay un plan vigente con materias para este año y cuatrimestre. Revisá el año del curso y las fechas del plan.</span>
          </div>
          <div v-else-if="!planes.length" class="boletin-alert is-warning" role="status">
            <i class="ti ti-info-circle" aria-hidden="true"></i><span>No hay planes disponibles para preparar boletines.</span>
          </div>
          <div class="helper-note"><i class="ti ti-lock-check" aria-hidden="true"></i><span>La preparación requiere una asignación docente para cada materia del plan.</span></div>
          <button class="tb-btn primary full-action" :disabled="!prepararForm.id_periodo || !prepararForm.id_curso || !prepararForm.id_plan || preparando" @click="preparar">
            <i :class="preparando ? 'ti ti-loader-2 animate-spin' : 'ti ti-check'" aria-hidden="true"></i>{{ preparando ? "Preparando…" : "Fijar materias del curso" }}
          </button>
          <p v-if="resumenPreparacion" class="inline-message is-success" role="status"><i class="ti ti-circle-check" aria-hidden="true"></i>{{ resumenPreparacion }}</p>
        </div>
      </section>

      <section class="boletin-panel seguimiento-panel" aria-labelledby="seguimiento-title">
        <div class="panel-heading">
          <div><p class="panel-kicker">Paso 2 · Supervisión</p><h2 id="seguimiento-title">Avance de carga</h2><p>Revisá el progreso de cada materia y quién debe completarla.</p></div>
          <span class="step-mark">02</span>
        </div>
        <div class="panel-body">
          <div class="seguimiento-filtros">
            <label for="seguimiento-periodo"><span class="field-label">Período</span><select id="seguimiento-periodo" v-model="seguimiento.id_periodo" class="boletin-select"><option :value="null" disabled>Elegí período</option><option v-for="p in periodos" :key="p.id_periodo" :value="p.id_periodo">{{ p.ciclo_lectivo }} · {{ p.cuatrimestre }}º</option></select></label>
            <label for="seguimiento-curso"><span class="field-label">Curso</span><select id="seguimiento-curso" v-model="seguimiento.id_curso" class="boletin-select"><option :value="null" disabled>Elegí curso</option><option v-for="c in cursos" :key="c.id_curso" :value="c.id_curso">{{ c.nombre_curso }}</option></select></label>
            <button class="tb-btn outline" :disabled="!seguimiento.id_periodo || !seguimiento.id_curso || cargandoSeguimiento" @click="cargarSeguimiento">
              <i :class="cargandoSeguimiento ? 'ti ti-loader-2 animate-spin' : 'ti ti-search'" aria-hidden="true"></i>{{ cargandoSeguimiento ? "Consultando…" : "Consultar" }}
            </button>
          </div>
          <div v-if="errorSeguimiento" class="boletin-alert is-error" role="alert"><i class="ti ti-alert-circle" aria-hidden="true"></i><span>{{ errorSeguimiento }}</span></div>
          <div v-else-if="cargandoSeguimiento" class="boletin-empty compact" role="status"><i class="ti ti-loader-2 animate-spin" aria-hidden="true"></i><span>Consultando avance del curso…</span></div>
          <div v-else-if="seguimientoData" class="avance-resultado">
            <div class="avance-resumen"><span><strong>{{ seguimientoData.alumnos.length }}</strong> alumnos</span><span><strong>{{ materiasFinalizadas }}</strong> de {{ seguimientoData.materias.length }} materias finalizadas</span></div>
            <div v-if="seguimientoData.materias.length" class="materias-avance">
              <article v-for="m in seguimientoData.materias" :key="m.asignacion.id_asignacion" class="materia-avance">
                <div class="materia-avance-top">
                  <div><strong>{{ m.asignacion.materiaAsignacion?.nombre_materia || "Materia" }}</strong><span>{{ m.responsable ? `${m.responsable.nombre} ${m.responsable.apellido}` : "Sin responsable" }}</span></div>
                  <span :class="['status-pill', `status-${m.estado}`]">{{ etiquetaEstado(m.estado) }}</span>
                </div>
                <div class="avance-barra" role="progressbar" :aria-valuenow="porcentajeMateria(m)" aria-valuemin="0" aria-valuemax="100" :aria-label="`Avance de ${m.asignacion.materiaAsignacion?.nombre_materia || 'la materia'}`">
                  <span :class="{ 'is-done': m.finalizada }" :style="{ width: `${porcentajeMateria(m)}%` }"></span>
                </div>
                <div class="avance-meta"><span>{{ m.calificacionesCargadas }} cargadas</span><span>{{ pendientesMateria(m) }} pendientes</span><strong>{{ porcentajeMateria(m) }}%</strong></div>
              </article>
            </div>
            <div v-else class="boletin-empty compact"><strong>Curso sin preparar</strong><span>Primero fijá las materias del curso para este período.</span></div>
          </div>
          <div v-else class="boletin-empty compact"><span class="empty-icon"><i class="ti ti-chart-dots" aria-hidden="true"></i></span><strong>Elegí un curso y período</strong><p>El avance por materia aparecerá acá.</p></div>
        </div>
      </section>
    </div>

    <section class="boletin-panel reaperturas-panel" aria-labelledby="reaperturas-title">
      <div class="panel-heading">
        <div><p class="panel-kicker">Revisión administrativa</p><h2 id="reaperturas-title">Solicitudes de reapertura</h2><p>Revisá el motivo docente y registrá una decisión.</p></div>
        <span :class="['panel-count', { 'count-attention': reaperturasPendientes > 0 }]">{{ reaperturasPendientes }} pendientes</span>
      </div>
      <div class="reaperturas-toolbar">
        <label for="filtro-reaperturas" class="filter-label">Mostrar
          <select id="filtro-reaperturas" v-model="filtroEstado" class="boletin-select">
            <option value="pendiente">Pendientes</option><option value="">Todas</option><option value="aprobada">Aprobadas</option><option value="rechazada">Rechazadas</option>
          </select>
        </label>
        <button class="tb-btn outline" :disabled="cargandoReaperturas" @click="cargarReaperturas"><i :class="cargandoReaperturas ? 'ti ti-loader-2 animate-spin' : 'ti ti-refresh'" aria-hidden="true"></i>{{ cargandoReaperturas ? "Actualizando…" : "Actualizar" }}</button>
      </div>
      <div v-if="errorReaperturas" class="boletin-alert is-error" role="alert"><i class="ti ti-alert-circle" aria-hidden="true"></i><span>{{ errorReaperturas }}</span></div>
      <div v-else-if="cargandoReaperturas" class="boletin-empty compact" role="status"><i class="ti ti-loader-2 animate-spin" aria-hidden="true"></i><span>Cargando solicitudes…</span></div>
      <div v-else-if="reaperturasFiltradas.length === 0" class="boletin-empty compact" role="status">
        <span class="empty-icon"><i class="ti ti-inbox" aria-hidden="true"></i></span><strong>No hay solicitudes para mostrar</strong><p>Cuando un docente solicite reabrir una materia, aparecerá en esta bandeja.</p>
      </div>
      <div v-else class="boletin-table-wrap">
        <table class="boletin-table reapertura-table" aria-label="Solicitudes de reapertura de boletines">
          <thead><tr><th>Curso y materia</th><th>Período</th><th>Motivo de solicitud</th><th>Estado</th><th>Decisión</th></tr></thead>
          <tbody>
            <tr v-for="r in reaperturasFiltradas" :key="r.id_reapertura">
              <td><strong>{{ r.Asignacion?.cursoAsignacion?.nombre_curso || "Curso" }}</strong><span class="cell-secondary">{{ r.Asignacion?.materiaAsignacion?.nombre_materia || "Materia" }}</span></td>
              <td>{{ r.PeriodoBoletin?.ciclo_lectivo }} · {{ r.PeriodoBoletin?.cuatrimestre }}º cuatrimestre</td>
              <td class="reason-cell">{{ r.motivo_solicitud }}</td>
              <td><span :class="['status-pill', `status-${r.estado}`]">{{ etiquetaEstado(r.estado) }}</span></td>
              <td>
                <div v-if="r.estado === 'pendiente'" class="decision-form">
                  <label class="sr-only" :for="`motivo-decision-${r.id_reapertura}`">Motivo de la decisión</label>
                  <input :id="`motivo-decision-${r.id_reapertura}`" v-model="decisiones[r.id_reapertura]" type="text" placeholder="Motivo (opcional)" />
                  <div class="decision-buttons">
                    <button class="tb-btn approve" :disabled="decidiendo[r.id_reapertura]" @click="decidir(r.id_reapertura, 'aprobada')"><i class="ti ti-check" aria-hidden="true"></i>Aprobar</button>
                    <button class="tb-btn reject" :disabled="decidiendo[r.id_reapertura]" @click="decidir(r.id_reapertura, 'rechazada')"><i class="ti ti-x" aria-hidden="true"></i>Rechazar</button>
                  </div>
                </div>
                <span v-else class="decision-note">{{ r.motivo_decision || "Sin observaciones" }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
  obtenerPeriodosBoletin,
  crearPeriodoBoletin,
  actualizarPeriodoBoletin,
  prepararCursoBoletin,
  obtenerReaperturasBoletin,
  decidirReaperturaBoletin,
  obtenerPlanillaBoletin,
} from "@/services/boletines-service.js";
import { obtenerCursos, obtenerPlanes } from "@/services/academico-service.js";
import { toast } from "@/services/toast-service.js";

const cursos = ref([]);

const periodos = ref([]);
const errorPeriodos = ref("");
const cargandoPeriodos = ref(true);
const guardandoEstado = ref({});
const creando = ref(false);
const preparando = ref(false);
const nuevo = ref({ ciclo_lectivo: new Date().getFullYear(), cuatrimestre: "1", fecha_inicio: "", fecha_cierre: "" });
const formularioValido = computed(() =>
  Boolean(nuevo.value.ciclo_lectivo && nuevo.value.cuatrimestre && nuevo.value.fecha_inicio && nuevo.value.fecha_cierre),
);
const fechasInvalidas = computed(() =>
  Boolean(nuevo.value.fecha_inicio && nuevo.value.fecha_cierre && nuevo.value.fecha_inicio > nuevo.value.fecha_cierre),
);
const resetNuevo = () => {
  nuevo.value = { ciclo_lectivo: new Date().getFullYear(), cuatrimestre: "1", fecha_inicio: "", fecha_cierre: "" };
};
const planes = ref([]);
const prepararForm = ref({ id_periodo: null, id_curso: null, id_plan: null });
const planesAplicables = computed(() => {
  const curso = cursos.value.find((c) => Number(c.id_curso) === Number(prepararForm.value.id_curso));
  const periodo = periodos.value.find((p) => Number(p.id_periodo) === Number(prepararForm.value.id_periodo));
  if (!curso?.anio || !periodo) return [];
  const inicio = `${periodo.ciclo_lectivo}-01-01`;
  const cierre = `${periodo.ciclo_lectivo}-12-31`;
  return planes.value.filter((plan) =>
    plan.estado !== "borrador" &&
    (!plan.fecha_vigencia_desde || plan.fecha_vigencia_desde <= cierre) &&
    (!plan.fecha_vigencia_hasta || plan.fecha_vigencia_hasta >= inicio) &&
    (plan.materiasPlan || []).some((m) =>
      Number(m.anio) === Number(curso.anio) && ["anual", String(periodo.cuatrimestre)].includes(String(m.cuatrimestre)),
    ),
  );
});
const resumenPreparacion = ref("");
const seguimiento = ref({ id_periodo: null, id_curso: null });
const seguimientoData = ref(null);
const errorSeguimiento = ref("");
const cargandoSeguimiento = ref(false);
const materiasFinalizadas = computed(() => seguimientoData.value?.materias?.filter((m) => m.finalizada).length || 0);
const reaperturas = ref([]);
const filtroEstado = ref("pendiente");
const decisiones = ref({});
const decidiendo = ref({});
const cargandoReaperturas = ref(true);
const errorReaperturas = ref("");
const periodosVigentes = computed(() => periodos.value.filter((p) => p.vigente).length);
const reaperturasPendientes = computed(() => reaperturas.value.filter((r) => r.estado === "pendiente").length);
const reaperturasFiltradas = computed(() =>
  filtroEstado.value ? reaperturas.value.filter((r) => r.estado === filtroEstado.value) : reaperturas.value,
);

const mostrarFecha = (fecha) => fecha ? String(fecha).slice(0, 10).split("-").reverse().join("/") : "—";
const etiquetaEstado = (estado) => ({
  programado: "Programado",
  abierto: "Abierto",
  cerrado: "Cerrado",
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  finalizada: "Finalizada",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
}[estado] || estado || "Sin estado");
const porcentajeMateria = (materia) => {
  const total = seguimientoData.value?.alumnos?.length || 0;
  return total ? Math.round((materia.calificacionesCargadas / total) * 100) : 100;
};
const pendientesMateria = (materia) => Math.max(
  0,
  (seguimientoData.value?.alumnos?.length || 0) - (materia.calificacionesCargadas || 0),
);
const seleccionarPeriodo = (periodo) => {
  prepararForm.value.id_periodo = periodo.id_periodo;
  prepararForm.value.id_plan = null;
  globalThis.document?.getElementById("preparar-curso")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const cargarPeriodos = async () => {
  cargandoPeriodos.value = true;
  try {
    const res = await obtenerPeriodosBoletin();
    if (!res.success) {
      errorPeriodos.value = res.message;
      return;
    }
    errorPeriodos.value = "";
    periodos.value = res.data || [];
  } finally {
    cargandoPeriodos.value = false;
  }
};

const crear = async () => {
  if (!formularioValido.value) {
    toast.error("Completá ciclo, cuatrimestre, inicio y cierre antes de crear el período");
    return;
  }
  if (fechasInvalidas.value) {
    toast.error("La fecha de inicio no puede ser posterior al cierre");
    return;
  }
  creando.value = true;
  try {
    const res = await crearPeriodoBoletin(nuevo.value);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success("Período creado");
    resetNuevo();
    await cargarPeriodos();
  } finally {
    creando.value = false;
  }
};

const cambiarEstado = async (p) => {
  guardandoEstado.value[p.id_periodo] = true;
  try {
    const res = await actualizarPeriodoBoletin(p.id_periodo, { estado: p.estado });
    if (!res.success) {
      toast.error(res.message);
      await cargarPeriodos();
      return;
    }
    toast.success("Estado del período actualizado");
    await cargarPeriodos();
  } finally {
    guardandoEstado.value[p.id_periodo] = false;
  }
};

const preparar = async () => {
  resumenPreparacion.value = "";
  preparando.value = true;
  try {
    const res = await prepararCursoBoletin(prepararForm.value.id_periodo, prepararForm.value.id_curso, prepararForm.value.id_plan);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    resumenPreparacion.value = `Materias fijadas: ${res.data.fijadas} · ya existentes: ${res.data.existentes}.`;
    toast.success("Curso preparado");
    if (Number(seguimiento.value.id_periodo) === Number(prepararForm.value.id_periodo) && Number(seguimiento.value.id_curso) === Number(prepararForm.value.id_curso)) {
      await cargarSeguimiento();
    }
  } finally {
    preparando.value = false;
  }
};

const cargarSeguimiento = async () => {
  cargandoSeguimiento.value = true;
  errorSeguimiento.value = "";
  seguimientoData.value = null;
  try {
    const res = await obtenerPlanillaBoletin(seguimiento.value.id_curso, seguimiento.value.id_periodo);
    if (!res.success) {
      errorSeguimiento.value = res.message;
      return;
    }
    seguimientoData.value = res.data;
  } finally {
    cargandoSeguimiento.value = false;
  }
};

const cargarReaperturas = async () => {
  cargandoReaperturas.value = true;
  errorReaperturas.value = "";
  try {
    const res = await obtenerReaperturasBoletin();
    if (!res.success) {
      errorReaperturas.value = res.message;
      return;
    }
    reaperturas.value = res.data || [];
  } finally {
    cargandoReaperturas.value = false;
  }
};

const decidir = async (id, estado) => {
  decidiendo.value[id] = true;
  try {
    const res = await decidirReaperturaBoletin(id, estado, decisiones.value[id] || "");
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(`Solicitud ${etiquetaEstado(estado).toLowerCase()}`);
    await cargarReaperturas();
  } finally {
    decidiendo.value[id] = false;
  }
};

onMounted(async () => {
  await cargarPeriodos();
  const rc = await obtenerCursos();
  cursos.value = Array.isArray(rc.data) ? rc.data : [];
  const rp = typeof obtenerPlanes === "function" ? await obtenerPlanes() : { success: true, data: [] };
  planes.value = rp.success ? rp.data || [] : [];
  await cargarReaperturas();
});
</script>

<script>
// Nombre para el test de navegación del dashboard.
export default { name: "BoletinesAdminView" };
</script>

<style scoped>
.boletines-admin {
  --boletin-ink: var(--color-text-primary, #172033);
  --boletin-muted: var(--color-text-tertiary, #687386);
  --boletin-line: var(--color-border-tertiary, #e5e9f0);
  --boletin-surface: var(--color-background-primary, #fff);
  --boletin-soft: var(--color-background-secondary, #f6f7f9);
  display: grid;
  gap: 20px;
  color: var(--boletin-ink);
  padding-bottom: 28px;
}
.boletines-hero { display: flex; justify-content: space-between; align-items: end; gap: 24px; padding: 3px 2px 2px; }
.boletines-hero h1 { margin: 2px 0 6px; font-size: clamp(1.55rem, 2.4vw, 2rem); letter-spacing: -0.035em; line-height: 1.15; }
.boletines-eyebrow, .panel-kicker { margin: 0; color: #a52420; font-size: 0.72rem; font-weight: 750; letter-spacing: 0.1em; text-transform: uppercase; }
.boletines-intro, .panel-heading p:last-child { margin: 0; color: var(--boletin-muted); font-size: 0.91rem; line-height: 1.5; }
.hero-note { display: flex; align-items: center; gap: 9px; max-width: 310px; padding: 11px 14px; border: 1px solid #dce8dc; border-radius: 10px; background: #f5faf4; color: #416048; font-size: 0.78rem; line-height: 1.4; }
.hero-note i { flex: 0 0 auto; font-size: 1.1rem; }
.boletin-metricas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
.boletin-metrica { display: flex; align-items: center; gap: 13px; min-height: 76px; padding: 15px 17px; border: 1px solid var(--boletin-line); border-radius: 12px; background: var(--boletin-surface); box-shadow: 0 2px 8px rgba(21, 31, 51, 0.025); }
.metrica-icono { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 11px; background: #fceeed; color: #ae2e29; font-size: 1.25rem; }
.metrica-icono.is-green { background: #edf7ee; color: #338044; }
.metrica-icono.is-amber { background: #fff6e7; color: #a96d08; }
.boletin-metrica div { display: grid; gap: 2px; }
.metrica-etiqueta { color: var(--boletin-muted); font-size: 0.76rem; font-weight: 550; }
.boletin-metrica strong { font-size: 1.45rem; line-height: 1.15; }
.boletin-panel { min-width: 0; overflow: hidden; border: 1px solid var(--boletin-line); border-radius: 14px; background: var(--boletin-surface); box-shadow: 0 3px 12px rgba(21, 31, 51, 0.035); }
.panel-heading { display: flex; align-items: center; justify-content: space-between; gap: 18px; padding: 18px 20px; border-bottom: 1px solid var(--boletin-line); }
.panel-heading h2 { margin: 3px 0 4px; font-size: 1.08rem; letter-spacing: -0.015em; }
.panel-heading > div { min-width: 0; }
.panel-heading p:last-child { font-size: 0.8rem; }
.panel-count { flex: 0 0 auto; padding: 6px 10px; border-radius: 999px; background: var(--boletin-soft); color: var(--boletin-muted); font-size: 0.75rem; font-weight: 700; }
.panel-count.count-attention { background: #fff4e1; color: #8b5c0a; }
.boletin-table-wrap { width: 100%; overflow-x: auto; }
.boletin-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.82rem; }
.boletin-table th { padding: 11px 17px; border-bottom: 1px solid var(--boletin-line); background: var(--boletin-soft); color: var(--boletin-muted); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.065em; text-transform: uppercase; white-space: nowrap; }
.boletin-table td { padding: 13px 17px; border-bottom: 1px solid var(--boletin-line); vertical-align: middle; }
.boletin-table tbody tr:last-child td { border-bottom: 0; }
.boletin-table tbody tr:hover { background: color-mix(in srgb, var(--boletin-soft) 66%, transparent); }
.boletin-table td strong { display: block; color: var(--boletin-ink); font-size: 0.84rem; font-weight: 700; }
.cell-secondary { display: block; margin-top: 3px; color: var(--boletin-muted); font-size: 0.75rem; }
.date-range { display: inline-flex; align-items: center; gap: 7px; color: var(--boletin-muted); white-space: nowrap; }
.date-range i { color: #9a6470; }
.state-control { display: flex; align-items: center; gap: 7px; }
.state-control select, .boletin-select, .decision-form input, .periodo-form-grid input, .periodo-form-grid select { min-height: 38px; border: 1px solid var(--boletin-line); border-radius: 8px; background: var(--boletin-surface); color: var(--boletin-ink); font: inherit; }
.state-control select { min-height: 32px; padding: 4px 28px 4px 9px; font-size: 0.76rem; font-weight: 650; }
.state-control select:focus, .boletin-select:focus, .decision-form input:focus, .periodo-form-grid input:focus, .periodo-form-grid select:focus { outline: 3px solid rgba(176, 48, 43, 0.16); border-color: #b94a45; }
.state-dot { width: 8px; height: 8px; border-radius: 50%; background: #9ca3af; }
.dot-abierto { background: #32914d; box-shadow: 0 0 0 3px #e7f4e9; }
.dot-cerrado { background: #a5312b; box-shadow: 0 0 0 3px #fae9e8; }
.dot-programado { background: #bb8119; box-shadow: 0 0 0 3px #fff4dc; }
.vigente-tag { color: #317b43; font-size: 0.69rem; font-weight: 700; }
.actions-col { text-align: right; white-space: nowrap; }
.link-action { display: inline-flex; align-items: center; gap: 4px; padding: 7px 9px; border: 0; border-radius: 7px; background: transparent; color: #a52420; font: inherit; font-size: 0.77rem; font-weight: 700; cursor: pointer; }
.link-action:hover { background: #fbf0f0; }
.nuevo-periodo { border-top: 1px solid var(--boletin-line); }
.nuevo-periodo summary { display: flex; align-items: center; gap: 11px; padding: 14px 18px; list-style: none; cursor: pointer; }
.nuevo-periodo summary::-webkit-details-marker { display: none; }
.nuevo-periodo summary:hover { background: var(--boletin-soft); }
.summary-plus { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 9px; background: #fbf0f0; color: #a52420; font-size: 1.1rem; }
.nuevo-periodo summary > span:nth-child(2) { display: grid; gap: 2px; }
.nuevo-periodo summary strong { font-size: 0.82rem; }
.nuevo-periodo summary small { color: var(--boletin-muted); font-size: 0.73rem; }
.summary-chevron { margin-left: auto; color: var(--boletin-muted); transition: transform 0.15s; }
.nuevo-periodo[open] .summary-chevron { transform: rotate(180deg); }
.nuevo-periodo-body { padding: 4px 18px 18px; border-top: 1px solid var(--boletin-line); }
.periodo-form-grid { display: grid; grid-template-columns: repeat(4, minmax(130px, 1fr)); gap: 12px; padding-top: 14px; }
.periodo-form-grid label, .field-label { display: grid; gap: 6px; color: var(--boletin-muted); font-size: 0.72rem; font-weight: 700; }
.periodo-form-grid input, .periodo-form-grid select { width: 100%; box-sizing: border-box; padding: 0 10px; font-size: 0.82rem; }
.form-bottom { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 13px; }
.inline-message { display: flex; align-items: center; gap: 6px; margin: 0; color: var(--boletin-muted); font-size: 0.76rem; }
.inline-message.is-success { color: #317b43; }
.inline-message.is-error { color: #a52420; }
.tb-btn.primary { background: #a52420; border-color: #a52420; color: #fff; }
.tb-btn.primary:hover:not(:disabled) { background: #861d1a; border-color: #861d1a; }
.tb-btn.outline { border-color: var(--boletin-line); background: var(--boletin-surface); color: var(--boletin-ink); }
.tb-btn.outline:hover:not(:disabled) { background: var(--boletin-soft); }
.tb-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.boletin-work-grid { display: grid; grid-template-columns: minmax(270px, 0.78fr) minmax(0, 1.22fr); align-items: start; gap: 16px; }
.step-mark { display: grid; place-items: center; flex: 0 0 auto; width: 36px; height: 36px; border: 1px solid var(--boletin-line); border-radius: 50%; color: #a52420; font-size: 0.74rem; font-weight: 800; }
.panel-body { display: grid; gap: 8px; padding: 17px 20px 20px; }
.field-label { margin-top: 4px; color: var(--boletin-ink); font-size: 0.75rem; }
.boletin-select { box-sizing: border-box; width: 100%; padding: 0 11px; font-size: 0.8rem; }
.boletin-select:disabled { background: var(--boletin-soft); color: #9aa1ac; cursor: not-allowed; }
.helper-note { display: flex; align-items: flex-start; gap: 8px; margin: 5px 0; padding: 10px; border-radius: 8px; background: var(--boletin-soft); color: var(--boletin-muted); font-size: 0.73rem; line-height: 1.45; }
.helper-note i { flex: 0 0 auto; color: #a52420; font-size: 1rem; }
.full-action { width: 100%; min-height: 41px; margin-top: 2px; }
.boletin-alert { display: flex; gap: 9px; align-items: flex-start; padding: 10px 12px; border: 1px solid transparent; border-radius: 9px; font-size: 0.76rem; line-height: 1.45; }
.boletin-alert i { flex: 0 0 auto; font-size: 1rem; }
.boletin-alert.is-warning { border-color: #f2dfb6; background: #fff9ed; color: #805a17; }
.boletin-alert.is-error { margin: 14px 18px; border-color: #f0cecc; background: #fff5f4; color: #9d2924; }
.boletin-empty { display: grid; justify-items: center; gap: 6px; padding: 30px 18px; color: var(--boletin-muted); text-align: center; }
.boletin-empty strong { color: var(--boletin-ink); font-size: 0.85rem; }
.boletin-empty p { max-width: 410px; margin: 0; font-size: 0.78rem; line-height: 1.45; }
.boletin-empty .empty-icon { display: grid; place-items: center; width: 42px; height: 42px; margin-bottom: 2px; border-radius: 13px; background: var(--boletin-soft); color: #8a5960; font-size: 1.25rem; }
.boletin-empty.compact { padding: 19px 14px; font-size: 0.78rem; }
.seguimiento-filtros { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto; align-items: end; gap: 9px; }
.seguimiento-filtros label { display: grid; gap: 5px; min-width: 0; }
.seguimiento-filtros .tb-btn { min-height: 38px; }
.avance-resultado { display: grid; gap: 12px; margin-top: 6px; }
.avance-resumen { display: flex; flex-wrap: wrap; gap: 7px 18px; padding: 10px 12px; border-radius: 8px; background: var(--boletin-soft); color: var(--boletin-muted); font-size: 0.75rem; }
.avance-resumen strong { color: var(--boletin-ink); font-size: 0.85rem; }
.materias-avance { display: grid; gap: 9px; max-height: 410px; overflow: auto; padding-right: 2px; }
.materia-avance { padding: 11px 12px; border: 1px solid var(--boletin-line); border-radius: 9px; }
.materia-avance-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
.materia-avance-top > div { display: grid; gap: 3px; min-width: 0; }
.materia-avance-top strong { font-size: 0.78rem; }
.materia-avance-top > div span { color: var(--boletin-muted); font-size: 0.7rem; }
.status-pill { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 999px; background: #f1f2f4; color: #667080; font-size: 0.67rem; font-weight: 750; white-space: nowrap; }
.status-pill::before { width: 6px; height: 6px; border-radius: 50%; background: currentColor; content: ""; }
.status-pendiente { background: #fff5df; color: #8d6415; }
.status-en_progreso { background: #eef5ff; color: #3265a2; }
.status-finalizada, .status-aprobada { background: #edf7ee; color: #317b43; }
.status-rechazada { background: #fff0ef; color: #a52420; }
.avance-barra { height: 6px; margin: 10px 0 6px; overflow: hidden; border-radius: 999px; background: #eceef1; }
.avance-barra span { display: block; height: 100%; border-radius: inherit; background: #b68121; transition: width 0.25s ease; }
.avance-barra span.is-done { background: #3b914f; }
.avance-meta { display: flex; align-items: center; gap: 10px; color: var(--boletin-muted); font-size: 0.66rem; }
.avance-meta strong { margin-left: auto; color: var(--boletin-ink); font-size: 0.69rem; }
.reaperturas-toolbar { display: flex; align-items: end; justify-content: space-between; gap: 12px; padding: 13px 18px; border-bottom: 1px solid var(--boletin-line); }
.filter-label { display: flex; align-items: center; gap: 9px; color: var(--boletin-muted); font-size: 0.75rem; font-weight: 650; }
.filter-label .boletin-select { width: auto; min-width: 140px; }
.reason-cell { min-width: 190px; max-width: 300px; color: var(--boletin-muted); line-height: 1.45; }
.decision-form { display: grid; gap: 7px; min-width: 230px; }
.decision-form input { box-sizing: border-box; width: 100%; padding: 0 9px; font-size: 0.75rem; }
.decision-buttons { display: flex; gap: 6px; }
.decision-buttons .tb-btn { min-height: 31px; padding: 5px 9px; font-size: 0.7rem; }
.tb-btn.approve { border: 1px solid #cde6d1; background: #f0f8f1; color: #28723a; }
.tb-btn.approve:hover:not(:disabled) { background: #e3f2e5; }
.tb-btn.reject { border: 1px solid #efd0ce; background: #fff5f4; color: #a52420; }
.tb-btn.reject:hover:not(:disabled) { background: #fbe9e8; }
.decision-note { color: var(--boletin-muted); font-size: 0.74rem; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

@media (max-width: 960px) {
  .boletin-work-grid { grid-template-columns: 1fr; }
  .materias-avance { max-height: 360px; }
}
@media (max-width: 680px) {
  .boletines-admin { gap: 14px; }
  .boletines-hero { align-items: flex-start; flex-direction: column; gap: 13px; }
  .hero-note { max-width: none; }
  .boletin-metricas { grid-template-columns: 1fr; gap: 8px; }
  .boletin-metrica { min-height: 64px; padding: 11px 13px; }
  .panel-heading { align-items: flex-start; padding: 15px; }
  .panel-count { font-size: 0.68rem; }
  .boletin-table { min-width: 680px; }
  .reapertura-table { min-width: 870px; }
  .periodo-form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .form-bottom { align-items: stretch; flex-direction: column; }
  .form-bottom .tb-btn { width: 100%; }
  .nuevo-periodo-body { padding-right: 14px; padding-left: 14px; }
  .panel-body { padding: 14px; }
  .seguimiento-filtros { grid-template-columns: 1fr 1fr; }
  .seguimiento-filtros .tb-btn { grid-column: 1 / -1; width: 100%; }
  .reaperturas-toolbar { align-items: stretch; }
  .filter-label { justify-content: space-between; flex: 1; }
  .filter-label .boletin-select { flex: 1; }
}
@media (max-width: 390px) {
  .periodo-form-grid { grid-template-columns: 1fr; }
  .seguimiento-filtros { grid-template-columns: 1fr; }
  .seguimiento-filtros .tb-btn { grid-column: auto; }
  .reaperturas-toolbar { flex-direction: column; }
}
</style>
