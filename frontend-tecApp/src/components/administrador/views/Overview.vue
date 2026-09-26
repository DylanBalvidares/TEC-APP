<template>
    <div v-if="errorCarga" class="error-banner" style="margin-bottom: 4px">
        <i class="ti ti-alert-circle"></i> {{ errorCarga }}
        <button
            class="tb-btn sm outline"
            @click="cargarDatos"
            style="margin-left: auto"
        >
            Reintentar
        </button>
    </div>

    <div class="metrics">
        <div class="metric-card clickable" @click="$emit('cambiar-vista', 'alumnos')">
            <div class="metric-label">
                <i class="ti ti-school" aria-hidden="true"></i>Alumnos
            </div>
            <div class="metric-value">{{ totalAlumnos }}</div>
            <span class="metric-badge badge-gray">Total registrados</span>
        </div>
        <div class="metric-card clickable" @click="$emit('cambiar-vista', 'profesores')">
            <div class="metric-label">
                <i class="ti ti-chalkboard" aria-hidden="true"></i>Docentes
            </div>
            <div class="metric-value">{{ totalProfesores }}</div>
            <span class="metric-badge badge-gray">Total en plantel</span>
        </div>
        <div class="metric-card clickable" @click="$emit('cambiar-vista', 'cursos')">
            <div class="metric-label">
                <i class="ti ti-book" aria-hidden="true"></i>Cursos activos
            </div>
            <div class="metric-value">{{ totalCursos }}</div>
            <span class="metric-badge badge-green">Ver todos →</span>
        </div>
        <div class="metric-card clickable" @click="$emit('cambiar-vista', 'comunicados')">
            <div class="metric-label">
                <i class="ti ti-speakerphone" aria-hidden="true"></i>Comunicados
            </div>
            <div class="metric-value">{{ totalComunicados }}</div>
            <span class="metric-badge badge-gray">Ver todos →</span>
        </div>
        <div class="metric-card clickable" @click="$emit('cambiar-vista', 'libreta')">
            <div class="metric-label">
                <i class="ti ti-book-open" aria-hidden="true"></i>Libreta Digital
            </div>
            <div class="metric-value">{{ totalCursos }}</div>
            <span class="metric-badge badge-green">Supervisar notas →</span>
        </div>
    </div>

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
            <div v-if="asistenciaTotal > 0" class="progress-row">
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
            <table v-if="ultimosAlumnos.length > 0" class="mini" aria-label="Últimos alumnos registrados">
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
                        <td>{{ alumno.dni }}</td>
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
            <div v-if="ultimosComunicados.length > 0" style="display: flex; flex-direction: column; gap: 6px">
                <div
                    v-for="com in ultimosComunicados"
                    :key="com.id_comunicado"
                    class="list-item"
                >
                    <div class="li-info">
                        <div class="li-name">{{ com.titulo }}</div>
                        <div class="li-sub">{{ com.detalle }}</div>
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
import { obtenerTodosComunicados } from "../../../services/comunidad-service.js";
import {
    obtenerAlumnos,
    obtenerProfesores,
    obtenerCursos,
    obtenerHistorialAsistencias,
} from "../../../services/academico-service.js";

defineEmits(["cambiar-vista"]);

const totalComunicados = ref(0);
const totalAlumnos = ref(0);
const totalProfesores = ref(0);
const totalCursos = ref(0);
const listaAlumnos = ref([]);
const listaComunicados = ref([]);
const asistenciaHoy = ref([]);
const errorCarga = ref("");

const ultimosAlumnos = computed(() =>
    [...listaAlumnos.value]
        .sort((a, b) => (b.id_alumno || 0) - (a.id_alumno || 0))
        .slice(0, 3)
        .map((a) => ({
            nombre: `${a.nombre} ${a.apellido || ""}`.trim(),
            curso: a.curso?.nombre_curso || a.nombre_curso || "—",
            dni: a.dni || "—",
        })),
);

const ultimosComunicados = computed(() =>
    [...listaComunicados.value]
        .sort(
            (a, b) =>
                new Date(b.fecha_publicacion || 0) -
                new Date(a.fecha_publicacion || 0),
        )
        .slice(0, 4)
        .map((c) => ({
            id_comunicado: c.id_comunicado,
            titulo: c.titulo || "Sin título",
            detalle: `${cap(c.destino)} · ${fechaCorta(c.fecha_publicacion)}`,
        })),
);

const asistenciaTotal = computed(() => asistenciaHoy.value.length);
const contar = (estado) =>
    asistenciaHoy.value.filter((r) => r.estado === estado).length;
const pct = (n) =>
    asistenciaTotal.value > 0
        ? Math.round((n / asistenciaTotal.value) * 100)
        : 0;
const pctPresentes = computed(() => pct(contar("presente")));
const pctAusentes = computed(() => pct(contar("ausente")));
const pctTardanzas = computed(() =>
    pct(contar("tarde") + contar("tardanza")),
);

const cap = (s) =>
    s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : "—";

const fechaCorta = (iso) => {
    if (!iso) return "sin fecha";
    const [y, m, d] = String(iso).split("T")[0].split("-");
    if (!y || !m || !d) return String(iso);
    return `${d}/${m}/${y}`;
};

const hoyISO = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const normalizar = (res) => {
    const data = res?.data || res;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.lista)) return data.lista;
    return [];
};

const cargarDatos = async () => {
    errorCarga.value = "";
    const [comunicados, alumnos, profesores, cursos] =
        await Promise.allSettled([
            obtenerTodosComunicados(),
            obtenerAlumnos(),
            obtenerProfesores(),
            obtenerCursos(),
        ]);

    const fallos = [];
    // El 404 significa "sin registros": se muestra como lista vacía, no como error.
    // Solo 401/403/500 o errores de red cuentan como fallo de carga.
    const esListaVacia = (settled) => settled.value?.status === 404;
    const esExito = (settled) =>
        settled.status === "fulfilled" &&
        (settled.value?.success !== false || esListaVacia(settled));
    if (esExito(comunicados)) {
        listaComunicados.value = esListaVacia(comunicados) ? [] : normalizar(comunicados.value);
        totalComunicados.value = listaComunicados.value.length;
    } else {
        fallos.push("comunicados");
    }
    if (esExito(alumnos)) {
        listaAlumnos.value = esListaVacia(alumnos) ? [] : normalizar(alumnos.value);
        totalAlumnos.value = listaAlumnos.value.length;
    } else {
        fallos.push("alumnos");
    }
    if (esExito(profesores)) {
        totalProfesores.value = esListaVacia(profesores)
            ? 0
            : normalizar(profesores.value).length;
    } else {
        fallos.push("docentes");
    }
    if (esExito(cursos)) {
        totalCursos.value = esListaVacia(cursos) ? 0 : normalizar(cursos.value).length;
    } else {
        fallos.push("cursos");
    }
    if (fallos.length > 0) {
        errorCarga.value = `No se pudieron cargar: ${fallos.join(", ")}. Verificá la conexión con el servidor.`;
    }

    // Asistencia de hoy (el 404 del backend significa "sin registros", no es error)
    try {
        const hoy = hoyISO();
        const res = await obtenerHistorialAsistencias({
            fecha_desde: hoy,
            fecha_hasta: hoy,
        });
        asistenciaHoy.value =
            res?.success === false ? [] : normalizar(res);
    } catch {
        asistenciaHoy.value = [];
    }
};

onMounted(cargarDatos);
</script>

<style scoped>
.metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
}

.metric-card {
    background: var(--color-background-secondary, #ffffff);
    border-radius: 8px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.metric-card.clickable {
    cursor: pointer;
    transition: box-shadow 0.15s, transform 0.15s;
}

.metric-card.clickable:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
    font-size: 22px;
    font-weight: 500;
    color: var(--color-text-primary, #111827);
    line-height: 1.1;
}

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

.badge-green {
    background: #eaf3de;
    color: #3b6d11;
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
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
}

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
.tb-btn.outline {
    background: white;
    color: #4b5563;
    border-color: #d1d5db;
}
.tb-btn.outline:hover {
    background: #f9fafb;
    color: #111827;
}
.tb-btn.sm {
    padding: 6px 12px;
    font-size: 12px;
}

.row2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}
.row3 {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
}

.card {
    background: var(--color-background-primary, #ffffff);
    border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 8px;
    padding: 14px;
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
    padding: 0;
}

.card-action:hover {
    text-decoration: underline;
}

.progress-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
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
    padding: 6px 8px;
    color: var(--color-text-tertiary, #6b7280);
    font-weight: 400;
    font-size: 11px;
    border-bottom: 0.5px solid var(--color-border-tertiary, #e5e7eb);
}
.mini td {
    padding: 7px 8px;
    border-bottom: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    color: var(--color-text-primary, #111827);
}
.mini tr:last-child td {
    border-bottom: none;
}
</style>
