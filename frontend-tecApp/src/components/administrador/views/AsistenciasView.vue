<template>
    <div class="asistencias-wrapper">
        <!-- ── CARD: Tomar Asistencia ─────────────────────────────── -->
        <div class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-calendar-check" aria-hidden="true"></i>
                    Control de Asistencias
                </div>
            </div>

            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label for="id_curso">Curso / División</label>
                        <select id="id_curso" v-model="cursoSeleccionado">
                            <option value="" disabled>Seleccionar curso...</option>
                            <option
                                v-for="curso in cursosDisponibles"
                                :key="curso.id_curso"
                                :value="curso.id_curso"
                            >
                                {{ curso.nombre_curso }}
                            </option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="fecha">Fecha de Registro</label>
                        <input id="fecha" type="text" v-model="fecha" placeholder="DD/MM/AAAA" />
                    </div>
                </div>
            </div>

            <div class="card-footer" style="padding: 14px 20px">
                <div
                    v-if="errorFiltros"
                    class="error-banner"
                    style="margin-right: auto; margin-bottom: 0"
                >
                    <i class="ti ti-alert-circle"></i> {{ errorFiltros }}
                </div>
                <button
                    @click="cargarPlanilla"
                    class="tb-btn primary"
                    :disabled="cargando || !cursoSeleccionado"
                >
                    <i class="ti ti-loader animate-spin" v-if="cargando"></i>
                    {{ cargando ? "Cargando nómina..." : "Cargar Planilla" }}
                </button>
            </div>
        </div>

        <!-- ── CARD: Planilla ─────────────────────────────────────── -->
        <div
            v-if="planillaVisible"
            class="card animate-fade-in"
            style="margin-top: 14px"
        >
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-users" aria-hidden="true"></i>
                    Nómina del Curso
                </div>
                <span class="metric-badge badge-gray">
                    {{ alumnos.length }} alumnos listados
                </span>
            </div>

            <div class="table-responsive">
                <div v-if="alumnos.length === 0" class="empty-state">
                    <i class="ti ti-user-off" style="font-size: 28px; opacity: 0.4"></i>
                    <p>No hay alumnos registrados en este curso para la fecha seleccionada.</p>
                </div>

                <table v-else class="mini" aria-label="Planilla de toma de asistencia">
                    <thead>
                        <tr>
                            <th>Alumno</th>
                            <th>DNI</th>
                            <th style="width: 160px; text-align: center">Estado</th>
                            <th>Observaciones (Opcional)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="alumno in alumnos"
                            :key="alumno.id_alumno"
                            class="table-row"
                        >
                            <td>
                                <strong>{{ alumno.apellido }}</strong>, {{ alumno.nombre }}
                            </td>
                            <td class="mono">{{ alumno.dni }}</td>

                            <td style="text-align: center">
                                <div class="attendance-toggles">
                                    <button
                                        type="button"
                                        :class="['toggle-btn present', alumno.asistencia.estado === 'presente' ? 'active' : '']"
                                        @click="alumno.asistencia.estado = 'presente'"
                                        title="Presente"
                                    >P</button>
                                    <button
                                        type="button"
                                        :class="['toggle-btn absent', alumno.asistencia.estado === 'ausente' ? 'active' : '']"
                                        @click="alumno.asistencia.estado = 'ausente'"
                                        title="Ausente"
                                    >A</button>
                                    <button
                                        type="button"
                                        :class="['toggle-btn late', alumno.asistencia.estado === 'tarde' ? 'active' : '']"
                                        @click="alumno.asistencia.estado = 'tarde'"
                                        title="Llegada Tarde"
                                    >T</button>
                                </div>
                            </td>

                            <td>
                                <input
                                    type="text"
                                    class="row-input"
                                    v-model="alumno.asistencia.observaciones"
                                    placeholder="Ej: Retirado antes de hora..."
                                />
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- ── Barra de resumen ── -->
                <div v-if="alumnos.length > 0" class="attendance-summary">
                    <div class="summary-item">
                        <span class="summary-badge badge-present">{{ stats.presentes }}</span>
                        <span class="summary-label">Presentes</span>
                        <span class="summary-pct">{{ stats.pctPresentes }}%</span>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-item">
                        <span class="summary-badge badge-absent">{{ stats.ausentes }}</span>
                        <span class="summary-label">Ausentes</span>
                        <span class="summary-pct">{{ stats.pctAusentes }}%</span>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-item">
                        <span class="summary-badge badge-late">{{ stats.tardanzas }}</span>
                        <span class="summary-label">Tardanzas</span>
                        <span class="summary-pct">{{ stats.pctTardanzas }}%</span>
                    </div>
                    <div class="summary-divider"></div>
                    <div class="summary-item total">
                        <span class="summary-badge">{{ stats.total }}</span>
                        <span class="summary-label">Total</span>
                    </div>
                </div>
            </div>

            <div class="card-footer flex-footer">
                <div v-if="errorGuardar" class="error-banner">
                    <i class="ti ti-alert-circle"></i> {{ errorGuardar }}
                </div>
                <div v-if="exitoGuardar" class="exito-banner">
                    <i class="ti ti-check"></i> Asistencias guardadas correctamente.
                </div>

                <div class="footer-actions">
                    <button @click="ocultarPlanilla" class="tb-btn outline" :disabled="guardando">
                        Cancelar
                    </button>
                    <button
                        @click="confirmarGuardado"
                        class="tb-btn primary"
                        :disabled="guardando || alumnos.length === 0"
                    >
                        <i class="ti ti-loader animate-spin" v-if="guardando"></i>
                        <i class="ti ti-device-floppy" v-else></i>
                        {{ guardando ? "Guardando en lote..." : "Guardar Registro Completo" }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ── CARD: Historial de Asistencias ─────────────────────── -->
        <div class="card animate-fade-in hist-card">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-history" aria-hidden="true"></i>
                    Historial de Asistencias
                </div>
            </div>

            <!-- Filtros de historial -->
            <div class="card-body">
                <div class="form-row hist-filters">
                    <div class="form-group">
                        <label for="hist_curso">Curso</label>
                        <select id="hist_curso" v-model="histCursoId">
                            <option value="">Todos los cursos</option>
                            <option
                                v-for="curso in cursosDisponibles"
                                :key="curso.id_curso"
                                :value="curso.id_curso"
                            >
                                {{ curso.nombre_curso }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="hist_desde">Desde</label>
                        <input id="hist_desde" type="text" v-model="histDesde" placeholder="DD/MM/AAAA" />
                    </div>
                    <div class="form-group">
                        <label for="hist_hasta">Hasta</label>
                        <input id="hist_hasta" type="text" v-model="histHasta" placeholder="DD/MM/AAAA" />
                    </div>
                    <div class="form-group form-group-action">
                        <label>&nbsp;</label>
                        <button
                            class="tb-btn primary"
                            @click="buscarHistorial"
                            :disabled="cargandoHistorial"
                        >
                            <i class="ti ti-loader animate-spin" v-if="cargandoHistorial"></i>
                            <i class="ti ti-search" v-else></i>
                            {{ cargandoHistorial ? "Buscando…" : "Buscar" }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Resultados -->
            <div class="table-responsive">
                <div v-if="!historialCargado" class="empty-state">
                    <i class="ti ti-calendar-stats" style="font-size: 28px; opacity: 0.35"></i>
                    <p>Aplicá los filtros y presioná <strong>Buscar</strong> para ver el historial.</p>
                </div>

                <div v-else-if="historial.length === 0" class="empty-state">
                    <i class="ti ti-mood-empty" style="font-size: 28px; opacity: 0.35"></i>
                    <p>No se encontraron registros para los filtros seleccionados.</p>
                </div>

                <table v-else class="mini" aria-label="Historial de asistencias">
                    <thead>
                        <tr>
                            <th style="width: 30px;"></th>
                            <th>Fecha</th>
                            <th>Curso</th>
                            <th style="text-align:center">Presentes</th>
                            <th style="text-align:center">Ausentes</th>
                            <th style="text-align:center">Tardanzas</th>
                            <th style="text-align:center">Total</th>
                            <th style="text-align:center">% Asistencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-for="(fila, idx) in historial" :key="idx">
                            <tr class="table-row">
                                <td style="text-align:center">
                                    <button 
                                        class="expand-btn" 
                                        @click="fila.expandido = !fila.expandido"
                                        :title="fila.expandido ? 'Ocultar detalles' : 'Ver detalles'"
                                    >
                                        <i class="ti" :class="fila.expandido ? 'ti-chevron-up' : 'ti-chevron-down'"></i>
                                    </button>
                                </td>
                                <td class="mono">{{ formatFecha(fila.fecha) }}</td>
                                <td><strong>{{ fila.curso || fila.nombre_curso || '—' }}</strong></td>
                                <td style="text-align:center">
                                    <span class="hist-badge badge-present">{{ fila.presentes ?? 0 }}</span>
                                </td>
                                <td style="text-align:center">
                                    <span class="hist-badge badge-absent">{{ fila.ausentes ?? 0 }}</span>
                                </td>
                                <td style="text-align:center">
                                    <span class="hist-badge badge-late">{{ fila.tardanzas ?? fila.tarde ?? 0 }}</span>
                                </td>
                                <td style="text-align:center" class="mono">{{ fila.total ?? ((fila.presentes ?? 0) + (fila.ausentes ?? 0) + (fila.tardanzas ?? fila.tarde ?? 0)) }}</td>
                                <td style="text-align:center">
                                    <span
                                        class="pct-pill"
                                        :class="pctClass(fila)"
                                    >{{ calcPct(fila) }}%</span>
                                </td>
                            </tr>
                            <tr v-if="fila.expandido" class="detail-row">
                                <td colspan="8" style="padding: 0;">
                                    <div class="detail-content animate-fade-in">
                                        <div class="detail-header">
                                            <i class="ti ti-users"></i> Detalle de Asistencia
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

            <div v-if="errorHistorial" class="card-footer">
                <div class="error-banner">
                    <i class="ti ti-alert-circle"></i> {{ errorHistorial }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
    obtenerCursos,
    obtenerAlumnosCurso,
    guardarAsistenciasLote,
    obtenerHistorialAsistencias,
} from "../../../services/academico-service.js";
import { useAuthStore } from "../../../stores/auth.js";
import { toDisplayDate, parseDisplayDate } from "../../../utils/formatters.js";
import { validarFechaFormato } from "../../../utils/validators.js";

// ── Estado Reactivo ──────────────────────────────────────────────────────────
const cursosDisponibles = ref([]);
const cursoSeleccionado = ref("");
const fecha = ref(toDisplayDate(new Date().toISOString()));
const alumnos = ref([]);
const authStore = useAuthStore();

const cargando = ref(false);
const guardando = ref(false);
const planillaVisible = ref(false);

// ── Barra de resumen ───────────────────────────────────────────────────
const stats = computed(() => {
    const total = alumnos.value.length;
    if (!total) return { presentes: 0, ausentes: 0, tardanzas: 0, total: 0, pctPresentes: 0, pctAusentes: 0, pctTardanzas: 0 };
    const presentes = alumnos.value.filter(a => a.asistencia?.estado === 'presente').length;
    const ausentes = alumnos.value.filter(a => a.asistencia?.estado === 'ausente').length;
    const tardanzas = alumnos.value.filter(a => a.asistencia?.estado === 'tarde').length;
    return {
        presentes, ausentes, tardanzas, total,
        pctPresentes: Math.round((presentes / total) * 100),
        pctAusentes: Math.round((ausentes / total) * 100),
        pctTardanzas: Math.round((tardanzas / total) * 100),
    };
});

const errorFiltros = ref("");
const errorGuardar = ref("");
const exitoGuardar = ref(false);

// ── Historial ────────────────────────────────────────────────────────────────
const histCursoId   = ref("");
const histDesde     = ref("");
const histHasta     = ref("");
const historial     = ref([]);
const historialCargado  = ref(false);
const cargandoHistorial = ref(false);
const errorHistorial    = ref("");

// ── Controladores ────────────────────────────────────────────────────────────
const fetchCursos = async () => {
    try {
        const res = await obtenerCursos();
        cursosDisponibles.value = Array.isArray(res.data) ? res.data : [];
    } catch (error) {
        console.error("No se pudieron cargar los cursos:", error);
    }
};

const cargarPlanilla = async () => {
    errorFiltros.value = "";
    exitoGuardar.value = false;

    if (!cursoSeleccionado.value || !fecha.value) {
        errorFiltros.value = "Seleccioná un curso y una fecha válida.";
        return;
    }

    const errFecha = validarFechaFormato(fecha.value);
    if (errFecha) {
        errorFiltros.value = errFecha;
        return;
    }

    cargando.value = true;
    try {
        const cursoId = (typeof cursoSeleccionado.value === 'object' && cursoSeleccionado.value !== null)
            ? (cursoSeleccionado.value.id_curso || cursoSeleccionado.value.id)
            : cursoSeleccionado.value;
        if (!cursoId) throw new Error('Id de curso inválido');

        const res = await obtenerAlumnosCurso(cursoId, fecha.value);
        const dataAlumnos = Array.isArray(res.data) ? res.data : [];

        alumnos.value = dataAlumnos.map((alumno) => ({
            ...alumno,
            asistencia: {
                estado: alumno.estado_previo || "presente",
                observaciones: alumno.observaciones_previas || "",
            },
        }));

        planillaVisible.value = true;
    } catch (e) {
        errorFiltros.value = "Ocurrió un error al cargar la nómina de alumnos.";
    } finally {
        cargando.value = false;
    }
};

const ocultarPlanilla = () => {
    planillaVisible.value = false;
    alumnos.value = [];
    exitoGuardar.value = false;
    errorGuardar.value = "";
};

const confirmarGuardado = async () => {
    errorGuardar.value = "";
    exitoGuardar.value = false;
    guardando.value = true;

    const payload = {
        registrado_por: authStore.usuario.id,
        id_curso: cursoSeleccionado.value,
        fecha: parseDisplayDate(fecha.value),
        registros: alumnos.value.map((al) => ({
            id_alumno: al.id_alumno,
            estado: al.asistencia.estado,
        })),
    };

    try {
        await guardarAsistenciasLote(payload);
        exitoGuardar.value = true;
    } catch (e) {
        errorGuardar.value =
            e?.response?.data?.mensaje || "Error al registrar las asistencias.";
    } finally {
        guardando.value = false;
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
                const cursoEncontrado = cursosDisponibles.value.find(c => c.id_curso == item.id_curso);
                agrupado[key] = {
                    id_curso: item.id_curso,
                    curso: cursoEncontrado ? cursoEncontrado.nombre_curso : `Curso #${item.id_curso}`,
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

// ── Hooks ────────────────────────────────────────────────────────────────────
onMounted(() => {
    fetchCursos();
});
</script>

<style scoped>
/* Transiciones y Microanimaciones */
.animate-fade-in {
    animation: fadeIn 0.22s ease-in-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(3px); }
    to   { opacity: 1; transform: translateY(0); }
}
@keyframes spin { to { transform: rotate(360deg); } }
.animate-spin {
    animation: spin 0.85s linear infinite;
    display: inline-block;
}

.asistencias-wrapper {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 980px;
    width: 100%;
}

/* UI Container Card */
.card {
    background: var(--color-background-primary, #fff);
    border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    overflow: hidden;
}
.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #fafafa;
}
.card-body    { padding: 20px; }
.card-footer  {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
}
.flex-footer  { justify-content: space-between; }
.footer-actions { display: flex; gap: 10px; margin-left: auto; }
.card-title {
    font-size: 13.5px;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
    display: flex;
    align-items: center;
    gap: 8px;
}
.card-title i { font-size: 16px; color: #cd322c; }

/* Formularios */
.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}
.hist-filters { grid-template-columns: 2fr 1fr 1fr auto; }
.form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.form-group-action { justify-content: flex-end; }
.form-group label {
    font-size: 11.5px;
    font-weight: 600;
    color: #4b5563;
}
.form-group input,
.form-group select {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 12.5px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    background: #fff;
}
.form-group input:focus,
.form-group select:focus {
    border-color: #cd322c;
    box-shadow: 0 0 0 2px rgba(205,50,44,0.08);
}

/* Botonería */
.tb-btn {
    padding: 7px 14px;
    border-radius: 6px;
    border: 1px solid transparent;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.12s;
}
.tb-btn.primary              { background: #cd322c; color: #fff; border-color: #cd322c; }
.tb-btn.primary:hover:not(:disabled) { background: #a52420; }
.tb-btn.outline              { background: white; color: #4b5563; border-color: #d1d5db; }
.tb-btn.outline:hover:not(:disabled) { background: #f9fafb; color: #111827; }
.tb-btn:disabled             { opacity: 0.6; cursor: not-allowed; }

/* Tabla */
.table-responsive { width: 100%; overflow-x: auto; padding: 12px; }
.mini { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.mini th {
    text-align: left;
    padding: 8px 10px;
    color: var(--color-text-tertiary, #6b7280);
    font-weight: 500;
    font-size: 11.5px;
    border-bottom: 1px solid #e5e7eb;
}
.mini td {
    padding: 9px 10px;
    border-bottom: 0.5px solid #e5e7eb;
    color: var(--color-text-primary, #111827);
    vertical-align: middle;
}
.table-row:hover { background: var(--color-background-secondary, #f9fafb); }
.mono { font-family: monospace; font-size: 11.5px; color: #4b5563; }

/* Badges */
.metric-badge {
    display: inline-flex; align-items: center;
    gap: 3px; font-size: 10px; padding: 2px 6px; border-radius: 4px;
}
.badge-gray { background: #f3f4f6; color: #4b5563; }

/* Historial badges */
.hist-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 600;
    min-width: 28px;
    text-align: center;
}
.badge-present { background: #dcfce7; color: #166534; }
.badge-absent  { background: #fef2f2; color: #991b1b; }
.badge-late    { background: #fef9c3; color: #a16207; }

/* Porcentaje pill */
.pct-pill {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 20px;
    font-size: 11.5px;
    font-weight: 700;
}
.pct-green  { background: #dcfce7; color: #166534; }
.pct-yellow { background: #fef9c3; color: #a16207; }
.pct-red    { background: #fef2f2; color: #991b1b; }

/* Banners */
.error-banner {
    display: inline-flex; align-items: center; gap: 8px;
    background: #fef2f2; border: 1px solid #fee2e2;
    color: #991b1b; padding: 8px 12px; border-radius: 6px; font-size: 12px;
}
.exito-banner {
    display: inline-flex; align-items: center; gap: 8px;
    background: #eaf3de; border: 1px solid #bbf7d0;
    color: #166534; padding: 8px 12px; border-radius: 6px; font-size: 12px;
}
.empty-state {
    padding: 36px 16px; text-align: center;
    color: #9ca3af; font-size: 12.5px;
    display: flex; flex-direction: column; align-items: center; gap: 6px;
}

/* ── Barra de resumen ──────────────────────────────────────────────── */
.attendance-summary {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 12px 20px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
}
.summary-item {
    display: flex;
    align-items: center;
    gap: 6px;
}
.summary-item.total .summary-badge {
    background: #e5e7eb;
    color: #374151;
}
.summary-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 24px;
    height: 24px;
    padding: 0 6px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
}
.summary-label {
    font-size: 11px;
    color: #6b7280;
    font-weight: 500;
}
.summary-pct {
    font-size: 11px;
    font-weight: 600;
    color: #374151;
}
.summary-divider {
    width: 1px;
    height: 20px;
    background: #d1d5db;
}

/* Toggle buttons P/A/T */
.attendance-toggles {
    display: inline-flex; background: #f3f4f6;
    border-radius: 6px; padding: 2px; gap: 2px; border: 1px solid #e5e7eb;
}
.toggle-btn {
    width: 28px; height: 26px; border: none; background: transparent;
    border-radius: 4px; font-size: 11.5px; font-weight: 600;
    color: #6b7280; cursor: pointer; transition: all 0.15s;
    display: flex; align-items: center; justify-content: center;
}
.toggle-btn:hover               { background: #e5e7eb; }
.toggle-btn.present.active      { background: #eaf3de; color: #3b6d11; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.toggle-btn.absent.active       { background: #fef2f2; color: #991b1b; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.toggle-btn.late.active         { background: #fef08a; color: #a16207; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

.row-input {
    width: 100%; padding: 6px 10px;
    border: 1px solid transparent; border-radius: 4px;
    font-size: 11.5px; background: #f9fafb;
    transition: all 0.15s; outline: none;
}
.row-input:focus, .row-input:hover { border-color: #d1d5db; background: #fff; }
.row-input:focus { border-color: #cd322c; }

/* hist-card top margin */
.hist-card { margin-top: 14px; }

@media (max-width: 720px) {
    .hist-filters { grid-template-columns: 1fr 1fr; }
    .form-group-action { grid-column: span 2; }
}

/* ── Expand Details ────────────────────────────────────────────── */
.expand-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #6b7280;
    font-size: 14px;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
}
.expand-btn:hover {
    background: #e5e7eb;
    color: #111827;
}
.detail-row td {
    background-color: #fafafa;
    border-bottom: 1px solid #e5e7eb;
}
.detail-content {
    padding: 16px 20px;
}
.detail-header {
    font-weight: 600;
    font-size: 12px;
    color: #4b5563;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 6px;
}
.detail-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 8px;
}
.detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    padding: 6px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    font-size: 11.5px;
}
.detail-name {
    font-weight: 500;
    color: #111827;
}
.detail-status {
    font-size: 9.5px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 12px;
}
</style>
