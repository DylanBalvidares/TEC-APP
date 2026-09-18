<template>
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-label">
                <i class="ti ti-school" aria-hidden="true"></i>Alumnos
            </div>
            <div class="metric-value">{{ totalAlumnos }}</div>
            <span class="metric-badge badge-gray">Total registrados</span>
        </div>
        <div class="metric-card">
            <div class="metric-label">
                <i class="ti ti-chalkboard" aria-hidden="true"></i>Docentes
            </div>
            <div class="metric-value">{{ totalProfesores }}</div>
            <span class="metric-badge badge-gray">Total en plantel</span>
        </div>
        <div class="metric-card clickable" @click="$emit('cambiar-vista', 'cursos')" style="cursor: pointer">
            <div class="metric-label">
                <i class="ti ti-book" aria-hidden="true"></i>Cursos activos
            </div>
            <div class="metric-value">{{ totalCursos }}</div>
            <span class="metric-badge badge-green">Ver todos →</span>
        </div>
        <div class="metric-card clickable" @click="$emit('cambiar-vista', 'comunicados')" style="cursor: pointer">
            <div class="metric-label">
                <i class="ti ti-speakerphone" aria-hidden="true"></i>Comunicados
            </div>
            <div class="metric-value">{{ totalComunicados }}</div>
            <span class="metric-badge badge-gray">Ver todos →</span>
        </div>
    </div>

    <div class="row3">
        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-chart-pie" aria-hidden="true"></i>
                    Asistencia hoy
                </div>
            </div>
            <div class="progress-row">
                <div class="prog-item">
                    <div class="prog-label">
                        <span>Presentes</span><span>81%</span>
                    </div>
                    <div class="prog-bar">
                        <div class="prog-fill g" style="width: 81%"></div>
                    </div>
                </div>
                <div class="prog-item">
                    <div class="prog-label">
                        <span>Ausentes</span><span>11%</span>
                    </div>
                    <div class="prog-bar">
                        <div class="prog-fill a" style="width: 11%"></div>
                    </div>
                </div>
                <div class="prog-item">
                    <div class="prog-label">
                        <span>Tardanzas</span><span>8%</span>
                    </div>
                    <div class="prog-bar">
                        <div class="prog-fill" style="width: 8%"></div>
                    </div>
                </div>
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
            <table class="mini" aria-label="Últimos alumnos registrados">
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Curso</th>
                        <th>DNI</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="alumno in ultimosAlumnos" :key="alumno.dni">
                        <td>{{ alumno.nombre }}</td>
                        <td>{{ alumno.curso }}</td>
                        <td>{{ alumno.dni }}</td>
                        <td>
                            <button class="icon-btn" aria-label="Editar">
                                <i
                                    class="ti ti-edit"
                                    style="font-size: 13px"
                                ></i>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="card">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-calendar" aria-hidden="true"></i>
                    Horarios — hoy
                </div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px">
                <div
                    v-for="horario in horariosHoy"
                    :key="horario.hora"
                    class="list-item"
                >
                    <div class="hora">{{ horario.hora }}</div>
                    <div class="li-info">
                        <div class="li-name">{{ horario.materia }}</div>
                        <div class="li-sub">{{ horario.detalle }}</div>
                    </div>
                </div>
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
} from "../../../services/academico-service.js";

defineEmits(["cambiar-vista"]);

const totalComunicados = ref(0);
const totalAlumnos = ref(0);
const totalProfesores = ref(0);
const totalCursos = ref(0);
const listaAlumnos = ref([]);

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

onMounted(async () => {
    const normalizar = (res) => {
        const data = res?.data || res;
        return Array.isArray(data) ? data : data?.data || [];
    };

    const [comunicados, alumnos, profesores, cursos] = await Promise.allSettled([
        obtenerTodosComunicados(),
        obtenerAlumnos(),
        obtenerProfesores(),
        obtenerCursos(),
    ]);

    if (comunicados.status === "fulfilled") {
        totalComunicados.value = normalizar(comunicados.value).length;
    }
    if (alumnos.status === "fulfilled") {
        listaAlumnos.value = normalizar(alumnos.value);
        totalAlumnos.value = listaAlumnos.value.length;
    }
    if (profesores.status === "fulfilled") {
        totalProfesores.value = normalizar(profesores.value).length;
    }
    if (cursos.status === "fulfilled") {
        totalCursos.value = normalizar(cursos.value).length;
    }
});

const horariosHoy = [
    {
        hora: "07:30",
        materia: "Matemáticas 5°A",
        detalle: "Aula 102 · Prof. Garmendia",
    },
    {
        hora: "09:00",
        materia: "Historia 4°B",
        detalle: "Aula 205 · Prof. Molina",
    },
    {
        hora: "10:30",
        materia: "Biología 3°A",
        detalle: "Lab. 1 · Prof. Castro",
    },
    {
        hora: "13:00",
        materia: "Lengua 2°C",
        detalle: "Aula 110 · Prof. Suárez",
    },
];
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

.hora {
    font-size: 10px;
    color: var(--color-text-tertiary, #6b7280);
    min-width: 36px;
}

.li-info {
    flex: 1;
    min-width: 0;
}

.li-name {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--color-text-primary, #111827);
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

.icon-btn {
    width: 26px;
    height: 26px;
    border-radius: 5px;
    border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-text-secondary, #4b5563);
}

.icon-btn:hover {
    background: var(--color-background-secondary, #f3f4f6);
}
</style>
