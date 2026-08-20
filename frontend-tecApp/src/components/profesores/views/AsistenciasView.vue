<template>
    <section class="tab-panel active">
        <!-- ── Toolbar ──────────────────────────────────────────────── -->
        <div class="tab-toolbar">
            <div class="tab-toolbar-left">
                <h2 class="section-title">
                    <i class="fas fa-clipboard-check"></i> Registro de asistencias
                </h2>
            </div>
            <div class="asist-toolbar-right">
                <div class="filter-group">
                    <span class="courses-title">Curso:</span>
                    <select v-model="asistCursoId" @change="onAsistCursoChange">
                        <option value="" disabled>Seleccionar curso…</option>
                        <option v-for="curso in todosCursos" :key="curso.id" :value="curso.id">
                            {{ curso.nombre }}
                        </option>
                    </select>
                </div>
                <input type="text" v-model="asistFecha" class="date-input" placeholder="DD/MM/AAAA" />
                <button class="btn-add-subject" :disabled="!asistCursoId" @click="tomarAsistencia">
                    <i class="fas fa-clipboard-check"></i> Tomar asistencia
                </button>
            </div>
        </div>

        <!-- ── Estado de carga ─────────────────────────────────────── -->
        <div v-if="cargando" class="empty-state">
            <i class="fas fa-spinner fa-spin empty-icon"></i>
            <p>Cargando cursos...</p>
        </div>

        <!-- ── Feedback inline ───────────────────────────────────── -->
        <div v-if="asistFeedback" :class="['asist-feedback', asistFeedbackTipo === 'error' ? 'asist-feedback-error' : 'asist-feedback-success']">
            <i :class="asistFeedbackTipo === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'"></i>
            {{ asistFeedback }}
        </div>

        <!-- ── Planilla de toma ────────────────────────────────────── -->
        <div v-else-if="mostrarAsistencia" class="asist-lista-wrap">
            <div class="asist-lista">
                <div
                    v-for="alumno in listaAlumnos"
                    :key="alumno.id_alumno"
                    class="alumno-row"
                    :class="alumno.estado"
                >
                    <span class="alumno-nombre">{{ alumno.nombre }}</span>
                    <div class="asist-btns">
                        <button type="button" class="asist-btn btn-presente"
                            :class="{ selected: alumno.estado === 'presente' }"
                            @click="alumno.estado = 'presente'"
                            :aria-pressed="alumno.estado === 'presente'">
                            <i class="fas fa-check"></i>
                        </button>
                        <button type="button" class="asist-btn btn-ausente"
                            :class="{ selected: alumno.estado === 'ausente' }"
                            @click="alumno.estado = 'ausente'"
                            :aria-pressed="alumno.estado === 'ausente'">
                            <i class="fas fa-times"></i>
                        </button>
                        <button type="button" class="asist-btn btn-tardanza"
                            :class="{ selected: alumno.estado === 'tardanza' }"
                            @click="alumno.estado = 'tardanza'"
                            :aria-pressed="alumno.estado === 'tardanza'">
                            <i class="fas fa-clock"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div class="asist-actions">
                <button class="btn-guardar-asist" @click="guardarAsistencia">Guardar asistencia</button>
            </div>
        </div>

        <!-- ── HISTORIAL DE ASISTENCIAS ────────────────────────────── -->
        <div class="hist-section" v-if="!cargando">
            <div class="hist-header">
                <h3 class="hist-title">
                    <i class="fas fa-history"></i> Historial de asistencias
                </h3>
            </div>

            <!-- Filtros -->
            <div class="hist-filters">
                <div class="hist-filter-group">
                    <label for="h_curso">Curso</label>
                    <select id="h_curso" v-model="histCursoId">
                        <option value="">Todos mis cursos</option>
                        <option v-for="curso in todosCursos" :key="curso.id" :value="curso.id">
                            {{ curso.nombre }}
                        </option>
                    </select>
                </div>
                <div class="hist-filter-group">
                    <label for="h_desde">Desde</label>
                    <input id="h_desde" type="text" v-model="histDesde" placeholder="DD/MM/AAAA" />
                </div>
                <div class="hist-filter-group">
                    <label for="h_hasta">Hasta</label>
                    <input id="h_hasta" type="text" v-model="histHasta" placeholder="DD/MM/AAAA" />
                </div>
                <button class="btn-hist-buscar" @click="buscarHistorial" :disabled="cargandoHistorial">
                    <i class="fas fa-spinner fa-spin" v-if="cargandoHistorial"></i>
                    <i class="fas fa-search" v-else></i>
                    {{ cargandoHistorial ? "Buscando…" : "Buscar" }}
                </button>
            </div>

            <!-- Resultados -->
            <div v-if="!historialCargado" class="hist-empty">
                <i class="fas fa-calendar-alt"></i>
                <p>Seleccioná los filtros y presioná <strong>Buscar</strong> para ver el historial.</p>
            </div>

            <div v-else-if="historial.length === 0" class="hist-empty">
                <i class="fas fa-inbox"></i>
                <p>No se encontraron registros para los filtros seleccionados.</p>
            </div>

            <div v-else class="hist-table-wrap">
                <table class="hist-table">
                    <thead>
                        <tr>
                            <th style="width: 30px;"></th>
                            <th>Fecha</th>
                            <th>Curso</th>
                            <th class="center">Presentes</th>
                            <th class="center">Ausentes</th>
                            <th class="center">Tardanzas</th>
                            <th class="center">% Asistencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(fila, i) in historial" :key="i">
                            <tr class="hist-row">
                                <td class="center">
                                    <button 
                                        class="expand-btn" 
                                        @click="fila.expandido = !fila.expandido"
                                        :title="fila.expandido ? 'Ocultar detalles' : 'Ver detalles'"
                                    >
                                        <i class="fas" :class="fila.expandido ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
                                    </button>
                                </td>
                                <td class="mono-cell">{{ formatFecha(fila.fecha) }}</td>
                                <td><strong>{{ fila.curso || fila.nombre_curso || '—' }}</strong></td>
                                <td class="center">
                                    <span class="hb hb-p">{{ fila.presentes ?? 0 }}</span>
                                </td>
                                <td class="center">
                                    <span class="hb hb-a">{{ fila.ausentes ?? 0 }}</span>
                                </td>
                                <td class="center">
                                    <span class="hb hb-t">{{ fila.tardanzas ?? fila.tarde ?? 0 }}</span>
                                </td>
                                <td class="center">
                                    <span class="pct-pill" :class="pctClass(fila)">{{ calcPct(fila) }}%</span>
                                </td>
                            </tr>
                            <tr v-if="fila.expandido" class="detail-row">
                                <td colspan="7" style="padding: 0;">
                                    <div class="detail-content">
                                        <div class="detail-header">
                                            <i class="fas fa-users"></i> Detalle de Asistencia
                                        </div>
                                        <ul class="detail-list">
                                            <li v-for="reg in fila.registros" :key="reg.id_alumno" class="detail-item">
                                                <span class="detail-name">
                                                    {{ reg.alumno?.apellido }}, {{ reg.alumno?.nombre }}
                                                </span>
                                                <span 
                                                    class="detail-status"
                                                    :class="[
                                                        reg.estado === 'presente' ? 'badge-present' : '',
                                                        reg.estado === 'ausente' ? 'badge-absent' : '',
                                                        (reg.estado === 'tardanza' || reg.estado === 'tarde') ? 'badge-late' : ''
                                                    ]"
                                                >
                                                    {{ reg.estado ? reg.estado.toUpperCase() : 'SIN ESTADO' }}
                                                </span>
                                            </li>
                                        </ul>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>

            <div v-if="errorHistorial" class="hist-error">
                <i class="fas fa-exclamation-circle"></i> {{ errorHistorial }}
            </div>
        </div>
    </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
    obtenerAsignacionesProfesor,
    obtenerAlumnosCurso,
    guardarAsistenciasLote,
    obtenerHistorialAsistencias,
} from "@/services/academico-service.js";
import { resolverIdProfesor } from "@/composables/useProfesor.js";
import { useAuthStore } from "@/stores/auth.js";
import { toDisplayDate, parseDisplayDate } from "@/utils/formatters.js";
import { validarFechaFormato } from "@/utils/validators.js";

const authStore = useAuthStore();

const todosCursos       = ref([]);
const asignaciones      = ref([]);
const asistCursoId      = ref("");
const asistFecha        = ref(toDisplayDate(new Date().toISOString()));
const mostrarAsistencia = ref(false);
const listaAlumnos      = ref([]);
const cargando          = ref(true);
const asistFeedback     = ref("");
const asistFeedbackTipo = ref(""); // "error" o "success"

// ── Historial ────────────────────────────────────────────────────────────────
const histCursoId       = ref("");
const histDesde         = ref("");
const histHasta         = ref("");
const historial         = ref([]);
const historialCargado  = ref(false);
const cargandoHistorial = ref(false);
const errorHistorial    = ref("");

onMounted(async () => {
    try {
        const idProfesor = await resolverIdProfesor();
        if (!idProfesor) {
            console.warn("AsistenciasView: no se pudo obtener el id_profesor.");
            return;
        }

        const res = await obtenerAsignacionesProfesor(idProfesor);

        if (res.success && res.data) {
            asignaciones.value = res.data;
            const cursosMap = new Map();

            res.data.forEach((asig) => {
                const idCurso     = asig.cursoAsignacion?.id_curso || asig.id_curso || asig['cursoAsignacion.id_curso'];
                const nombreCurso = asig.cursoAsignacion?.nombre_curso || asig['cursoAsignacion.nombre_curso'] || `Curso #${idCurso}`;
                if (idCurso !== undefined && idCurso !== null) {
                    cursosMap.set(idCurso, nombreCurso);
                }
            });

            todosCursos.value = Array.from(cursosMap.entries()).map(([id, nombre]) => ({ id, nombre }));
        }
    } catch (error) {
        console.error("Error cargando asignaciones del profesor:", error);
    } finally {
        cargando.value = false;
    }
});

const onAsistCursoChange = () => {
    mostrarAsistencia.value = false;
    listaAlumnos.value = [];
};

const tomarAsistencia = async () => {
    if (!asistCursoId.value) return;
    
    asistFeedback.value = "";

    const errFechaAsist = validarFechaFormato(asistFecha.value);
    if (errFechaAsist) {
        asistFeedback.value = errFechaAsist;
        asistFeedbackTipo.value = "error";
        return;
    }
    
    mostrarAsistencia.value = false;
    try {
        const res = await obtenerAlumnosCurso(asistCursoId.value);
        if (res.success && res.data && res.data.length > 0) {
            listaAlumnos.value = res.data.map((a) => ({
                id_alumno: a.id_alumno,
                nombre: `${a.apellido || ''}, ${a.nombre || ''}`.trim().replace(/^,|,$/g, ''),
                estado: "presente",
            }));
            mostrarAsistencia.value = true;
        } else {
            listaAlumnos.value = [];
            asistFeedback.value = "No se encontraron alumnos registrados en este curso.";
            asistFeedbackTipo.value = "error";
        }
    } catch (error) {
        console.error("Error al obtener alumnos del curso:", error);
        asistFeedback.value = "Error al cargar la lista de alumnos.";
        asistFeedbackTipo.value = "error";
    }
};

const guardarAsistencia = async () => {
    asistFeedback.value = "";

    if (!asistFecha.value) {
        asistFeedback.value = "Seleccioná una fecha.";
        asistFeedbackTipo.value = "error";
        return;
    }
    if (!asistCursoId.value) {
        asistFeedback.value = "Seleccioná un curso.";
        asistFeedbackTipo.value = "error";
        return;
    }
    if (listaAlumnos.value.length === 0) {
        asistFeedback.value = "No hay alumnos en la lista para guardar.";
        asistFeedbackTipo.value = "error";
        return;
    }

    try {
        const registros = listaAlumnos.value.map((a) => ({
            id_alumno: a.id_alumno,
            estado: a.estado,
        }));

        const payload = {
            id_curso: asistCursoId.value,
            fecha: parseDisplayDate(asistFecha.value),
            registrado_por: authStore.usuario?.id || null,
            registros,
        };

        const res = await guardarAsistenciasLote(payload);
        if (res.success) {
            asistFeedback.value = "Asistencias guardadas correctamente.";
            asistFeedbackTipo.value = "success";
            mostrarAsistencia.value = false;
            listaAlumnos.value = [];
            setTimeout(() => { asistFeedback.value = ""; }, 3000);
        } else {
            asistFeedback.value = `Error: ${res.message || "Error del servidor"}`;
            asistFeedbackTipo.value = "error";
        }
    } catch (error) {
        console.error("Error al guardar asistencia:", error);
        asistFeedback.value = "Error de conexión al guardar las asistencias.";
        asistFeedbackTipo.value = "error";
    }
};

// ── Historial ────────────────────────────────────────────────────────────────
const buscarHistorial = async () => {
    errorHistorial.value = "";

    const errDesde = histDesde.value ? validarFechaFormato(histDesde.value) : "";
    const errHasta = histHasta.value ? validarFechaFormato(histHasta.value) : "";
    if (errDesde || errHasta) {
        errorHistorial.value = errDesde || errHasta;
        return;
    }

    cargandoHistorial.value = true;
    historialCargado.value = false;

    const res = await obtenerHistorialAsistencias({
        id_curso:    histCursoId.value || undefined,
        fecha_desde: parseDisplayDate(histDesde.value) || undefined,
        fecha_hasta: parseDisplayDate(histHasta.value) || undefined,
    });

    if (res.success) {
        const rawData = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        
        const agrupado = {};
        rawData.forEach(item => {
            const key = `${item.id_curso}-${item.fecha}`;
            if (!agrupado[key]) {
                const cursoEncontrado = todosCursos.value.find(c => c.id == item.id_curso);
                agrupado[key] = {
                    id_curso: item.id_curso,
                    curso: cursoEncontrado ? cursoEncontrado.nombre : `Curso #${item.id_curso}`,
                    fecha: item.fecha,
                    presentes: 0,
                    ausentes: 0,
                    tardanzas: 0,
                    total: 0,
                    expandido: false,
                    registros: []
                };
            }
            agrupado[key].total++;
            const est = item.estado ? item.estado.toLowerCase() : '';
            if (est === 'presente') agrupado[key].presentes++;
            else if (est === 'ausente') agrupado[key].ausentes++;
            else if (est === 'tardanza' || est === 'tarde') agrupado[key].tardanzas++;

            agrupado[key].registros.push({
                id_alumno: item.id_alumno || item.alumno?.id_alumno,
                estado: est,
                alumno: item.alumno || { nombre: '', apellido: 'Alumno' }
            });
        });

        historial.value = Object.values(agrupado).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    } else {
        errorHistorial.value = res.message || "Error al obtener el historial.";
        historial.value = [];
    }

    historialCargado.value = true;
    cargandoHistorial.value = false;
};

const formatFecha = (iso) => {
    if (!iso) return "—";
    const [y, m, d] = iso.split("T")[0].split("-");
    return `${d}/${m}/${y}`;
};

const calcPct = (fila) => {
    const total = fila.total ?? ((fila.presentes ?? 0) + (fila.ausentes ?? 0) + (fila.tardanzas ?? fila.tarde ?? 0));
    if (!total) return "—";
    return Math.round(((fila.presentes ?? 0) / total) * 100);
};

const pctClass = (fila) => {
    const pct = calcPct(fila);
    if (pct === "—") return "";
    if (pct >= 85) return "pct-green";
    if (pct >= 65) return "pct-yellow";
    return "pct-red";
};
</script>

<style scoped src="../profesores.css"></style>

<style scoped>
/* ── Historial: sección contenedor ─────────────────────────── */
.hist-section {
    margin-top: 32px;
    background: var(--surface, #fff);
    border-radius: var(--radius-lg, 16px);
    box-shadow: var(--elev-1, 0 6px 18px rgba(2, 6, 23, 0.06));
    border: 1px solid var(--line, #e5e7eb);
    overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
}
.hist-section:hover {
    box-shadow: var(--elev-2, 0 12px 40px rgba(2, 6, 23, 0.10));
}

.hist-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 24px;
    border-bottom: 1px solid var(--line, #e5e7eb);
    background: var(--surface-2, #f8fafc);
}

.hist-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--text, #1f2937);
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0;
}
.hist-title i { 
    color: var(--primary, #c0152a); 
    background: var(--primary-soft, rgba(192, 21, 42, 0.1));
    padding: 8px;
    border-radius: 8px;
}

/* ── Filtros ────────────────────────────────────────────────── */
.hist-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;
    padding: 20px 24px;
    border-bottom: 1px solid var(--line, #e5e7eb);
    background: #fff;
}

.hist-filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
    min-width: 160px;
}

.hist-filter-group label {
    font-size: 11px;
    font-weight: 700;
    color: var(--muted, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.hist-filter-group select,
.hist-filter-group input[type="date"] {
    padding: 10px 14px;
    border: 1px solid #d1d5db;
    border-radius: var(--radius-sm, 10px);
    font-size: 13px;
    background: #fff;
    color: var(--text, #1f2937);
    outline: none;
    transition: all 0.2s;
}

.hist-filter-group select:focus,
.hist-filter-group input[type="date"]:focus {
    border-color: var(--primary, #c0152a);
    box-shadow: 0 0 0 3px var(--primary-soft, rgba(192, 21, 42, 0.15));
}

.btn-hist-buscar {
    padding: 11px 20px;
    border-radius: var(--radius-sm, 10px);
    border: none;
    background: var(--primary, #c0152a);
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    transition: background 0.2s, transform 0.1s;
    white-space: nowrap;
}
.btn-hist-buscar:hover:not(:disabled) { 
    background: var(--primary-dark, #a52420); 
    transform: translateY(-1px);
}
.btn-hist-buscar:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── Tabla ──────────────────────────────────────────────────── */
.hist-table-wrap {
    overflow-x: auto;
    padding: 16px 24px 24px;
}

.hist-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
}

.hist-table th {
    text-align: left;
    padding: 12px 14px;
    color: var(--muted, #6b7280);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--line, #e5e7eb);
}

.hist-table td {
    padding: 14px;
    border-bottom: 1px solid #f1f5f9;
    color: var(--text, #111827);
    vertical-align: middle;
}

.hist-row {
    transition: background 0.2s;
}
.hist-row:hover { background: var(--surface-2, #f8fafc); }
.center { text-align: center !important; }
.mono-cell { font-family: 'Consolas', monospace; font-size: 13px; color: #4b5563; }

/* ── Historia badges ────────────────────────────────────────── */
.hb {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 700;
    min-width: 36px;
    text-align: center;
}
.hb-p { background: #dcfce7; color: var(--success, #16a34a); }
.hb-a { background: #fef2f2; color: var(--danger, #dc2626); }
.hb-t { background: #fef9c3; color: var(--warning, #d97706); }

/* ── Porcentaje pill ─────────────────────────────────────────── */
.pct-pill {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 800;
}
.pct-green  { background: #dcfce7; color: var(--success, #16a34a); }
.pct-yellow { background: #fef9c3; color: var(--warning, #d97706); }
.pct-red    { background: #fef2f2; color: var(--danger, #dc2626); }

/* ── Feedback inline ─────────────────────────────────────────── */
.asist-feedback {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 18px;
    border-radius: var(--radius-sm, 10px);
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 16px;
}
.asist-feedback-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
}
.asist-feedback-success {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    color: #16a34a;
}

/* ── Estado vacío ────────────────────────────────────────────── */
.hist-empty {
    padding: 48px 24px;
    text-align: center;
    color: #94a3b8;
    font-size: 14px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
}
.hist-empty i { font-size: 32px; color: #cbd5e1; }

/* ── Error ────────────────────────────────────────────────────── */
.hist-error {
    margin: 16px 24px 24px;
    padding: 12px 18px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: var(--danger, #dc2626);
    border-radius: var(--radius-sm, 10px);
    font-size: 13px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 10px;
}

@media (max-width: 640px) {
    .hist-filters { flex-direction: column; }
    .btn-hist-buscar { width: 100%; justify-content: center; }
}

/* ── Expand Details ────────────────────────────────────────────── */
.expand-btn {
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    color: var(--muted, #6b7280);
    font-size: 12px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
}
.expand-btn:hover {
    background: var(--surface, #fff);
    border-color: #cbd5e1;
    color: var(--primary, #c0152a);
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}
.detail-row td {
    background-color: #f8fafc;
    border-bottom: 2px solid var(--line, #e5e7eb);
    padding: 0;
}
.detail-content {
    padding: 20px 24px;
}
.detail-header {
    font-weight: 700;
    font-size: 14px;
    color: var(--text, #1e293b);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
}
.detail-header i {
    color: var(--primary, #c0152a);
}
.detail-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
}
.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: var(--radius-sm, 10px);
    font-size: 13px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    transition: transform 0.15s, box-shadow 0.15s;
}
.detail-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(0,0,0,0.04);
}
.detail-name {
    font-weight: 600;
    color: var(--text, #334155);
}
.detail-status {
    font-size: 10px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 12px;
}
.badge-present { background: #dcfce7; color: var(--success, #16a34a); }
.badge-absent { background: #fef2f2; color: var(--danger, #dc2626); }
.badge-late { background: #fef9c3; color: var(--warning, #d97706); }
</style>
