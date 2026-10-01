<template>
    <section class="dashboard-heading" aria-labelledby="dashboard-title">
        <div>
            <p class="eyebrow">Panel de administración</p>
            <h1 id="dashboard-title">Resumen general</h1>
            <p class="heading-copy">Un vistazo rápido a la actividad y los datos de la institución.</p>
        </div>
        <div class="heading-meta" :class="{ 'is-loading': cargando }" role="status" aria-live="polite">
            <span class="status-dot" aria-hidden="true"></span>
            <span>{{ cargando ? 'Actualizando datos…' : fechaActual }}</span>
        </div>
    </section>

    <div v-if="errorCarga" class="error-banner" role="alert">
        <i class="ti ti-alert-circle" aria-hidden="true"></i>
        <span>{{ errorCarga }}</span>
        <button
            class="tb-btn sm outline"
            :disabled="cargando"
            @click="cargarDatos"
        >
            <i class="ti ti-refresh" :class="{ 'animate-spin': cargando }" aria-hidden="true"></i>
            {{ cargando ? 'Reintentando…' : 'Reintentar' }}
        </button>
    </div>

    <div class="metrics">
        <button type="button" class="metric-card clickable" @click="$emit('cambiar-vista', 'alumnos')">
            <div class="metric-label">
                <i class="ti ti-school" aria-hidden="true"></i>Alumnos
            </div>
            <div class="metric-value">{{ cargando ? '—' : totalAlumnos.toLocaleString('es-AR') }}</div>
            <span class="metric-badge badge-gray">Total registrados</span>
            <span class="metric-icon metric-icon-red"><i class="ti ti-users" aria-hidden="true"></i></span>
        </button>
        <button type="button" class="metric-card clickable" @click="$emit('cambiar-vista', 'profesores')">
            <div class="metric-label">
                <i class="ti ti-chalkboard" aria-hidden="true"></i>Docentes
            </div>
            <div class="metric-value">{{ cargando ? '—' : totalProfesores.toLocaleString('es-AR') }}</div>
            <span class="metric-badge badge-gray">Total en plantel</span>
            <span class="metric-icon metric-icon-blue"><i class="ti ti-chalkboard" aria-hidden="true"></i></span>
        </button>
        <button type="button" class="metric-card clickable" @click="$emit('cambiar-vista', 'cursos')">
            <div class="metric-label">
                <i class="ti ti-book" aria-hidden="true"></i>Cursos activos
            </div>
            <div class="metric-value">{{ cargando ? '—' : totalCursos.toLocaleString('es-AR') }}</div>
            <span class="metric-badge badge-green">Ver todos →</span>
            <span class="metric-icon metric-icon-green"><i class="ti ti-book" aria-hidden="true"></i></span>
        </button>
        <button type="button" class="metric-card clickable" @click="$emit('cambiar-vista', 'alumnos')">
            <div class="metric-label">
                <i class="ti ti-user-question" aria-hidden="true"></i>Sin curso asignado
            </div>
            <div class="metric-value">{{ cargando ? '—' : alumnosSinCurso.toLocaleString('es-AR') }}</div>
            <span class="metric-badge badge-yellow">Revisar →</span>
            <span class="metric-icon metric-icon-amber"><i class="ti ti-user-question" aria-hidden="true"></i></span>
        </button>
    </div>

    <section class="quick-section" aria-labelledby="quick-actions-title">
        <div class="section-heading">
            <div>
                <h2 id="quick-actions-title">Accesos rápidos</h2>
                <p>Atajos a tareas frecuentes</p>
            </div>
        </div>
    <div class="acciones-rapidas">
        <button class="accion-rapida" @click="$emit('cambiar-vista', 'alumnos')">
            <i class="ti ti-user-plus" aria-hidden="true"></i>
            <span>Nuevo alumno</span>
        </button>
        <button class="accion-rapida" @click="$emit('cambiar-vista', 'comunicados')">
            <i class="ti ti-speakerphone" aria-hidden="true"></i>
            <span>Publicar comunicado</span>
        </button>
        <button class="accion-rapida" @click="$emit('cambiar-vista', 'asistencias')">
            <i class="ti ti-calendar-check" aria-hidden="true"></i>
            <span>Ver asistencias</span>
        </button>
        <button class="accion-rapida" @click="$emit('cambiar-vista', 'libreta')">
            <i class="ti ti-book-open" aria-hidden="true"></i>
            <span>Supervisar libreta</span>
        </button>
    </div>
    </section>

    <div class="row3">
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-chart-pie" aria-hidden="true"></i>
                    Asistencia hoy
                </div>
                <span class="metric-badge badge-gray" v-if="asistenciaTotal > 0">
                    {{ asistenciaTotal }} registros
                </span>
            </div>
            <div v-if="cargando" class="empty-inline" role="status">
                <i class="ti ti-loader-2 animate-spin" aria-hidden="true"></i>
                <span>Cargando datos de asistencia…</span>
            </div>
            <div v-else-if="asistenciaTotal > 0" class="asistencia-cuerpo">
                <svg
                    class="donut"
                    viewBox="0 0 42 42"
                    role="img"
                    aria-label="Distribución de asistencia de hoy"
                >
                    <circle cx="21" cy="21" r="15.9" fill="none" stroke="#f3f4f6" stroke-width="6" class="donut-pista" />
                    <circle
                        cx="21"
                        cy="21"
                        r="15.9"
                        fill="none"
                        stroke="#3b6d11"
                        stroke-width="6"
                        :stroke-dasharray="`${pctPresentes} ${100 - pctPresentes}`"
                        stroke-dashoffset="25"
                        stroke-linecap="round"
                    />
                    <text x="21" y="21" text-anchor="middle" dominant-baseline="middle" class="donut-texto">
                        {{ pctPresentes }}%
                    </text>
                </svg>
            <div class="progress-row">
                <div class="prog-item">
                    <div class="prog-label">
                        <span>Presentes</span><span>{{ pctPresentes }}%</span>
                    </div>
                    <div class="prog-bar">
                        <div class="prog-fill g" :style="{ width: pctPresentes + '%' }"></div>
                    </div>
                </div>
                <div class="prog-item">
                    <div class="prog-label">
                        <span>Ausentes</span><span>{{ pctAusentes }}%</span>
                    </div>
                    <div class="prog-bar">
                        <div class="prog-fill a" :style="{ width: pctAusentes + '%' }"></div>
                    </div>
                </div>
                <div class="prog-item">
                    <div class="prog-label">
                        <span>Tardanzas</span><span>{{ pctTardanzas }}%</span>
                    </div>
                    <div class="prog-bar">
                        <div class="prog-fill" :style="{ width: pctTardanzas + '%' }"></div>
                    </div>
                </div>
                <div class="prog-item">
                    <div class="prog-label">
                        <span>Justificados</span><span>{{ pctJustificados }}%</span>
                    </div>
                    <div class="prog-bar">
                        <div class="prog-fill j" :style="{ width: pctJustificados + '%' }"></div>
                    </div>
                </div>
            </div>
            </div>
            <div v-else class="empty-inline">
                <i class="ti ti-calendar-off" aria-hidden="true"></i>
                <span>Sin registros de asistencia para hoy.</span>
            </div>
        </div>
    </div>

    <div class="row2">
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-users" aria-hidden="true"></i>
                    Últimos alumnos registrados
                </div>
                <button
                    class="card-action"
                    @click="$emit('cambiar-vista', 'alumnos')"
                >
                    Ver todos
                </button>
            </div>
            <div v-if="cargando" class="empty-inline" role="status">
                <i class="ti ti-loader-2 animate-spin" aria-hidden="true"></i>
                <span>Cargando alumnos…</span>
            </div>
            <table v-else-if="ultimosAlumnos.length > 0" class="mini" aria-label="Últimos alumnos registrados">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Curso</th>
                        <th>DNI</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="alumno in ultimosAlumnos" :key="alumno.dni">
                        <td>{{ alumno.nombre }}</td>
                        <td>{{ alumno.curso }}</td>
                        <td class="mono">{{ alumno.dni || "—" }}</td>
                    </tr>
                </tbody>
            </table>
            <div v-else class="empty-inline">
                <i class="ti ti-user-off" aria-hidden="true"></i>
                <span>Todavía no hay alumnos registrados.</span>
            </div>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-speakerphone" aria-hidden="true"></i>
                    Últimos comunicados
                </div>
                <button
                    class="card-action"
                    @click="$emit('cambiar-vista', 'comunicados')"
                >
                    Ver todos
                </button>
            </div>
            <div v-if="cargando" class="empty-inline" role="status">
                <i class="ti ti-loader-2 animate-spin" aria-hidden="true"></i>
                <span>Cargando comunicados…</span>
            </div>
            <div v-else-if="ultimosComunicados.length > 0" class="comunicados-lista">
                <div
                    v-for="com in ultimosComunicados"
                    :key="com.id_comunicado"
                    class="list-item"
                >
                    <div class="li-info">
                        <div class="li-name">{{ com.titulo }}</div>
                        <div class="li-sub">{{ com.destino }} · {{ com.fecha }}</div>
                    </div>
                </div>
            </div>
            <div v-else class="empty-inline">
                <i class="ti ti-speakerphone" aria-hidden="true"></i>
                <span>Todavía no hay comunicados publicados.</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { obtenerMetricas } from "../../../services/admin-service.js";

defineEmits(["cambiar-vista"]);

// Una sola request (GET /api/admin/metricas) alimenta todo el panel.
const totalAlumnos = ref(0);
const totalProfesores = ref(0);
const totalCursos = ref(0);
const alumnosSinCurso = ref(0);
const asistencia = ref({ total: 0, presente: 0, ausente: 0, tarde: 0, justificado: 0 });
const ultimosAlumnos = ref([]);
const ultimosComunicados = ref([]);
const errorCarga = ref("");
const cargando = ref(false);
const fechaActual = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
}).format(new Date());

const asistenciaTotal = computed(() => asistencia.value.total || 0);
const pct = (n) =>
    asistenciaTotal.value > 0
        ? Math.round((n / asistenciaTotal.value) * 100)
        : 0;
const pctPresentes = computed(() => pct(asistencia.value.presente));
const pctAusentes = computed(() => pct(asistencia.value.ausente));
const pctTardanzas = computed(() => pct(asistencia.value.tarde));
const pctJustificados = computed(() => pct(asistencia.value.justificado));

const cap = (s) =>
    s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "—";

const cargarDatos = async () => {
    if (cargando.value) return;
    cargando.value = true;
    errorCarga.value = "";
    try {
        const res = await obtenerMetricas();
        if (res?.success === false) {
            errorCarga.value =
                res.message || "No se pudieron cargar las métricas del panel.";
            return;
        }
        const m = res.data || {};
        totalAlumnos.value = m.totales?.alumnos ?? 0;
        totalProfesores.value = m.totales?.profesores ?? 0;
        totalCursos.value = m.totales?.cursos ?? 0;
        alumnosSinCurso.value = m.totales?.alumnosSinCurso ?? 0;
        asistencia.value = {
            total: m.asistenciaHoy?.total ?? 0,
            presente: m.asistenciaHoy?.presente ?? 0,
            ausente: m.asistenciaHoy?.ausente ?? 0,
            tarde: m.asistenciaHoy?.tarde ?? 0,
            justificado: m.asistenciaHoy?.justificado ?? 0,
        };
        ultimosAlumnos.value = (m.ultimosAlumnos || []).map((a) => ({
            dni: a.dni || a.id_alumno,
            nombre: `${a.nombre} ${a.apellido || ""}`.trim(),
            curso: a.Curso?.nombre_curso || a.curso?.nombre_curso || "—",
        }));
        ultimosComunicados.value = (m.comunicadosRecientes || []).map((c) => ({
            id_comunicado: c.id_comunicado,
            titulo: c.titulo || "Sin título",
            destino: cap(c.destino),
            fecha: c.fecha_publicacion || "sin fecha",
        }));
    } catch {
        errorCarga.value = "No se pudieron cargar los datos. Revisá tu conexión e intentá de nuevo.";
    } finally {
        cargando.value = false;
    }
};

onMounted(cargarDatos);
</script>

<style scoped>
.dashboard-heading {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 20px;
    padding: 2px 2px 4px;
}

.eyebrow {
    margin: 0 0 5px;
    color: #a52420;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
}

.dashboard-heading h1 {
    margin: 0;
    color: var(--color-text-primary, #111827);
    font-size: clamp(22px, 2.5vw, 28px);
    font-weight: 650;
    letter-spacing: -0.035em;
    line-height: 1.15;
}

.heading-copy {
    margin: 7px 0 0;
    color: var(--color-text-secondary, #4b5563);
    font-size: 13px;
}

.heading-meta {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 11px;
    border: 1px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 999px;
    background: var(--color-background-primary, #fff);
    color: var(--color-text-secondary, #4b5563);
    font-size: 11px;
    white-space: nowrap;
    text-transform: capitalize;
}

.status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #639922;
    box-shadow: 0 0 0 3px rgba(99, 153, 34, 0.12);
}

.heading-meta.is-loading .status-dot {
    background: #ba7517;
    box-shadow: 0 0 0 3px rgba(186, 117, 23, 0.12);
}

.metrics {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

/* ── Acciones rápidas ────────────────────────────────────────────────── */
.acciones-rapidas {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.quick-section {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.section-heading h2 {
    margin: 0;
    color: var(--color-text-primary, #111827);
    font-size: 14px;
    font-weight: 650;
}

.section-heading p {
    margin: 3px 0 0;
    color: var(--color-text-tertiary, #6b7280);
    font-size: 11px;
}

.accion-rapida {
    display: flex;
    align-items: center;
    gap: 10px;
    background: var(--color-background-primary, #ffffff);
    border: 1px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 10px;
    min-height: 54px;
    padding: 12px 14px;
    cursor: pointer;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--color-text-primary, #111827);
    transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
    text-align: left;
}

.accion-rapida i {
    font-size: 18px;
    color: #cd322c;
    flex-shrink: 0;
}

.accion-rapida:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
    border-color: #cd322c;
}

.accion-rapida:focus-visible,
.metric-card:focus-visible,
.card-action:focus-visible {
    outline: 3px solid rgba(205, 50, 44, 0.32);
    outline-offset: 2px;
}

.badge-yellow {
    background: #fef9c3;
    color: #a16207;
}

@media (max-width: 768px) {
    .metrics,
    .acciones-rapidas {
        grid-template-columns: repeat(2, 1fr);
    }
}

.metric-card {
    position: relative;
    min-height: 126px;
    background: var(--color-background-primary, #ffffff);
    border: 1px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 11px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
    box-shadow: 0 2px 5px rgba(17, 24, 39, 0.025);
    text-align: left;
    font: inherit;
    overflow: hidden;
}

.metric-card.clickable {
    cursor: pointer;
    transition: box-shadow 0.15s, transform 0.15s;
}

.metric-card.clickable:hover {
    border-color: rgba(165, 36, 32, 0.35);
    box-shadow: 0 8px 22px rgba(17, 24, 39, 0.08);
    transform: translateY(-1px);
}

.metric-label {
    font-size: 11px;
    color: var(--color-text-tertiary, #6b7280);
    display: flex;
    align-items: center;
    gap: 5px;
}

.metric-value {
    font-size: 28px;
    font-weight: 650;
    color: var(--color-text-primary, #111827);
    line-height: 1.1;
    letter-spacing: -0.04em;
}

.metric-icon {
    position: absolute;
    top: 14px;
    right: 14px;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border-radius: 10px;
    font-size: 17px;
}

.metric-icon-red { color: #a52420; background: #fbf0f0; }
.metric-icon-blue { color: #2563a6; background: #edf5ff; }
.metric-icon-green { color: #3b6d11; background: #eff6e8; }
.metric-icon-amber { color: #a16207; background: #fef7e7; }

.metric-sub {
    font-size: 11px;
    color: var(--color-text-tertiary, #6b7280);
    margin-top: 2px;
}

.metric-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 2px;
}
.badge-red {
    background: #fcebeb;
    color: #a32d2d;
}
.badge-gray {
    background: var(--color-background-tertiary, #f3f4f6);
    color: var(--color-text-secondary, #4b5563);
}

.error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fef2f2;
    border: 1px solid #fee2e2;
    color: #991b1b;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 12px;
}

.error-banner .tb-btn { margin-left: auto; flex-shrink: 0; }

.tb-btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid transparent;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s;
}
.tb-btn.sm {
    padding: 6px 12px;
    font-size: 12px;
}

.row2 {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
    gap: 14px;
}
.row3 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

.card {
    background: var(--color-background-primary, #ffffff);
    border: 1px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 11px;
    padding: 16px;
    box-shadow: 0 2px 5px rgba(17, 24, 39, 0.025);
}

.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.card-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary, #111827);
    display: flex;
    align-items: center;
    gap: 6px;
}

.card-title i {
    font-size: 15px;
    color: #cd322c;
}

.card-action {
    font-size: 11px;
    color: #cd322c;
    cursor: pointer;
    border: none;
    background: none;
    padding: 5px 7px;
    border-radius: 5px;
    font-weight: 600;
}

.card-action:hover {
    background: var(--nav-active-bg, #fbf0f0);
}

.asistencia-cuerpo {
    display: flex;
    align-items: center;
    gap: 16px;
}
.donut {
    width: 84px;
    height: 84px;
    flex-shrink: 0;
}
.donut-texto {
    font-size: 9px;
    font-weight: 700;
    fill: #111827;
}
.progress-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
}

.prog-item {
    display: flex;
    flex-direction: column;
    gap: 3px;
}

.prog-label {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--color-text-secondary, #4b5563);
}

.prog-bar {
    height: 5px;
    background: var(--color-background-tertiary, #e5e7eb);
    border-radius: 10px;
    overflow: hidden;
}

.prog-fill {
    height: 100%;
    border-radius: 10px;
    background: #cd322c;
}
.prog-fill.g {
    background: #639922;
}
.prog-fill.a {
    background: #ba7517;
}
.prog-fill.j {
    background: #6b7280;
}

.empty-inline {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 4px;
    color: #9ca3af;
    font-size: 12.5px;
}
.empty-inline i {
    font-size: 18px;
    opacity: 0.6;
}

.list-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 0.5px solid var(--color-border-tertiary, #e5e7eb);
}

.list-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
}
.list-item:first-child {
    padding-top: 0;
}

.li-info {
    flex: 1;
    min-width: 0;
}

.li-name {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--color-text-primary, #111827);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.li-sub {
    font-size: 11px;
    color: var(--color-text-tertiary, #6b7280);
}

.mini {
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
}
.mini th {
    text-align: left;
    padding: 8px 9px;
    color: var(--color-text-tertiary, #6b7280);
    font-weight: 600;
    font-size: 10px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    border-bottom: 1px solid var(--color-border-tertiary, #e5e7eb);
}
.mini td {
    padding: 10px 9px;
    border-bottom: 1px solid var(--color-border-tertiary, #e5e7eb);
    color: var(--color-text-primary, #111827);
}
.mini tr:last-child td {
    border-bottom: none;
}

.mini tbody tr:hover { background: var(--color-background-secondary, #f3f4f6); }

.comunicados-lista {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

@media (max-width: 768px) {
    .dashboard-heading {
        align-items: flex-start;
        flex-direction: column;
        gap: 12px;
    }

    .row2 { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
    .metrics { gap: 8px; }
    .metric-card { min-height: 116px; padding: 12px; }
    .metric-icon { top: 10px; right: 10px; width: 30px; height: 30px; }
    .metric-label { max-width: calc(100% - 24px); line-height: 1.25; }
    .metric-value { margin-top: 5px; font-size: 25px; }
    .metric-badge { font-size: 9px; }
    .acciones-rapidas { grid-template-columns: 1fr 1fr; gap: 8px; }
    .accion-rapida { min-height: 58px; padding: 10px; font-size: 11px; }
    .asistencia-cuerpo { gap: 10px; }
    .donut { width: 72px; height: 72px; }
}

@media (prefers-reduced-motion: reduce) {
    .metric-card, .accion-rapida { transition: none; }
}
</style>
