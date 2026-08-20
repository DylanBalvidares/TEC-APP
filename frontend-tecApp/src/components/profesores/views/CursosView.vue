<template>
    <section class="tab-panel active profesor-cursos-section">
        <div class="tab-toolbar">
            <div class="tab-toolbar-left">
                <h2 class="section-title"><i class="fas fa-graduation-cap"></i> Mis Cursos Asignados</h2>
            </div>
        </div>

        <EmptyState v-if="cargando" icon="fas fa-spinner fa-spin">Cargando cursos...</EmptyState>

        <div v-else class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Curso</th>
                        <th>Materia</th>
                        <th>Aula</th>
                        <th>Turno</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="asig in asignaciones" :key="asig.id_asignacion">
                        <td>
                            <strong>{{ asig.cursoAsignacion?.nombre_curso }}</strong>
                        </td>
                        <td>{{ asig.materiaAsignacion?.nombre_materia }}</td>
                        <td>{{ asig.cursoAsignacion?.aula || "S/D" }}</td>
                        <td>{{ asig.cursoAsignacion?.turno || "S/D" }}</td>
                        <td>
                            <button class="tb-btn sm outline" @click="verDetalles(asig)">Detalles</button>
                        </td>
                    </tr>
                    <tr v-if="asignaciones.length === 0">
                        <td colspan="5">
                            <EmptyState icon="fas fa-users-slash">No hay cursos asignados para este periodo lectivo.</EmptyState>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div v-if="cursoSeleccionado" class="course-detail-panel card">
            <div class="detail-header">
                <div>
                    <h3>Alumnos de {{ cursoSeleccionado.cursoAsignacion?.nombre_curso || 'Curso seleccionado' }}</h3>
                    <p class="detail-subtitle">{{ cursoSeleccionado.materiaAsignacion?.nombre_materia || 'Asignación' }}</p>
                </div>
                <button class="tb-btn outline sm detail-close-btn" @click="cerrarDetalle">Cerrar</button>
            </div>

            <div class="course-detail-meta">
                <div class="meta-item">
                    <span>Curso</span>
                    <strong>{{ cursoSeleccionado.cursoAsignacion?.nombre_curso || 'S/D' }}</strong>
                </div>
                <div class="meta-item">
                    <span>Materia</span>
                    <strong>{{ cursoSeleccionado.materiaAsignacion?.nombre_materia || 'S/D' }}</strong>
                </div>
                <div class="meta-item">
                    <span>Aula</span>
                    <strong>{{ cursoSeleccionado.cursoAsignacion?.aula || 'S/D' }}</strong>
                </div>
                <div class="meta-item">
                    <span>Turno</span>
                    <strong>{{ cursoSeleccionado.cursoAsignacion?.turno || 'S/D' }}</strong>
                </div>
            </div>

            <div v-if="cargandoAlumnos" class="empty-state centered">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando alumnos...</p>
            </div>

            <div v-else-if="alumnos.length === 0" class="empty-state centered">
                <i class="fas fa-user-slash"></i>
                <p>No se encontraron alumnos para este curso.</p>
            </div>

            <div v-else class="alumnos-list">
                <div v-for="alumno in alumnos" :key="alumno.id_alumno" class="alumno-item">
                    <div class="alumno-item-header">
                        <strong>{{ alumno.apellido }}, {{ alumno.nombre }}</strong>
                        <span class="alumno-badge">Alumno</span>
                    </div>
                    <p class="alumno-meta">DNI: {{ alumno.dni || 'S/D' }}</p>
                </div>
            </div>
        </div>
    </section>
</template>

<script setup>
import EmptyState from "../EmptyState.vue";
import { ref, onMounted } from "vue";
import { obtenerAsignacionesProfesor, obtenerAlumnosCurso } from "@/services/academico-service.js";
import { resolverIdProfesor } from "@/composables/useProfesor.js";

const asignaciones = ref([]);
const cargando = ref(true);
const cargandoAlumnos = ref(false);
const alumnos = ref([]);
const cursoSeleccionado = ref(null);

const cargarAsignaciones = async () => {
    try {
        const idProfesor = await resolverIdProfesor();
        if (!idProfesor) {
            console.warn("CursosView: no se pudo obtener el id_profesor.");
            return;
        }

        const res = await obtenerAsignacionesProfesor(idProfesor);
        if (res.success && res.data) {
            asignaciones.value = res.data;
        } else {
            console.warn("CursosView: respuesta sin datos.", res);
        }
    } catch (error) {
        console.error("Error al cargar cursos asignados:", error);
    } finally {
        cargando.value = false;
    }
};

const verDetalles = async (asig) => {
    cursoSeleccionado.value = asig;
    alumnos.value = [];
    cargandoAlumnos.value = true;

    const cursoId = asig.cursoAsignacion?.id_curso ?? asig.cursoAsignacion?.id ?? asig.id_curso ?? null;
    if (!cursoId) {
        console.warn('verDetalles: id de curso inválido en asignación', asig);
        cargandoAlumnos.value = false;
        return;
    }

    try {
        const res = await obtenerAlumnosCurso(cursoId);
        if (res.success && Array.isArray(res.data)) {
            alumnos.value = res.data;
        } else {
            alumnos.value = [];
        }
    } catch (error) {
        console.error("Error al cargar alumnos del curso:", error);
        alumnos.value = [];
    } finally {
        cargandoAlumnos.value = false;
    }
};

const cerrarDetalle = () => {
    cursoSeleccionado.value = null;
    alumnos.value = [];
};

onMounted(cargarAsignaciones);
</script>

<style scoped src="../profesores.css"></style>
<style scoped>
.table-container {
    background: var(--surface, #fff);
    border-radius: var(--radius-lg, 16px);
    box-shadow: var(--elev-1, 0 6px 18px rgba(2,6,23,0.06));
    border: 1px solid var(--line, #e5e7eb);
    padding: 16px;
    margin-top: 16px;
    overflow-x: auto;
    transition: transform 0.2s, box-shadow 0.2s;
}
.table-container:hover {
    box-shadow: var(--elev-2, 0 12px 40px rgba(2,6,23,0.10));
}
table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
}
th {
    text-align: left;
    padding: 14px 16px;
    color: var(--muted, #6b7280);
    font-weight: 700;
    font-size: 11.5px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 2px solid var(--line, #e5e7eb);
}
td {
    padding: 16px;
    border-bottom: 1px solid #f1f5f9;
    color: var(--text, #1e293b);
    vertical-align: middle;
    font-size: 13.5px;
}
tbody tr:hover {
    background: var(--surface-2, #f8fafc);
}
strong {
    font-weight: 700;
    color: var(--text, #0f172a);
}

.course-detail-panel {
    background: var(--surface, #fff);
    border-radius: var(--radius-lg, 16px);
    border: 1px solid var(--line, #e5e7eb);
    padding: 24px;
    margin-top: 24px;
    box-shadow: var(--elev-1, 0 6px 18px rgba(2,6,23,0.06));
}
.detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--line, #e5e7eb);
    padding-bottom: 16px;
    margin-bottom: 20px;
}
.detail-header h3 {
    margin: 0;
    font-size: 1.25rem;
    color: var(--text, #0f172a);
}
.detail-subtitle {
    margin: 4px 0 0 0;
    color: var(--muted, #6b7280);
    font-size: 0.95rem;
}
.detail-close-btn {
    border-radius: var(--radius-sm, 10px);
}
.course-detail-meta {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}
.meta-item {
    background: var(--surface-2, #f8fafc);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}
.meta-item span {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--muted, #6b7280);
}
.meta-item strong {
    font-size: 1.05rem;
    color: var(--text, #1e293b);
}
.alumnos-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
}
.alumno-item {
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    transition: transform 0.15s, box-shadow 0.15s;
}
.alumno-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.05);
}
.alumno-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}
.alumno-item-header strong {
    font-size: 0.95rem;
    color: var(--text, #1e293b);
}
.alumno-badge {
    background: var(--primary-soft, rgba(192,21,42,0.1));
    color: var(--primary, #c0152a);
    font-size: 10px;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: 12px;
}
.alumno-meta {
    margin: 0;
    color: var(--muted, #6b7280);
    font-size: 0.85rem;
    font-family: 'Consolas', monospace;
}
</style>
