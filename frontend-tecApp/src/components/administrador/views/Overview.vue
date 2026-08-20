<template>
    <div class="metrics">
        <div class="metric-card">
            <div class="metric-label">
                <i class="ti ti-school" aria-hidden="true"></i>Alumnos
            </div>
            <div class="metric-value">248</div>
            <span class="metric-badge badge-green">
                <i class="ti ti-arrow-up"></i>+12 este mes
            </span>
        </div>
        <div class="metric-card">
            <div class="metric-label">
                <i class="ti ti-chalkboard" aria-hidden="true"></i>Docentes
            </div>
            <div class="metric-value">31</div>
            <span class="metric-badge badge-gray">3 sin asignación</span>
        </div>
        <div class="metric-card">
            <div class="metric-label">
                <i class="ti ti-book" aria-hidden="true"></i>Cursos activos
            </div>
            <div class="metric-value">18</div>
            <span class="metric-badge badge-green">Todos con aula</span>
        </div>
        <div class="metric-card">
            <div class="metric-label">
                <i class="ti ti-books" aria-hidden="true"></i>Préstamos activos
            </div>
            <div class="metric-value">43</div>
            <span class="metric-badge badge-red">
                <i class="ti ti-alert-circle"></i>5 vencidos
            </span>
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
                    <i class="ti ti-activity" aria-hidden="true"></i>
                    Actividad reciente
                </div>
                <button class="card-action">Ver todo</button>
            </div>
            <div
                v-for="actividad in actividadReciente"
                :key="actividad.id"
                class="activity-item"
            >
                <div class="act-icon" :style="{ background: actividad.iconBg }">
                    <i
                        :class="`ti ${actividad.icon}`"
                        :style="{
                            color: actividad.iconColor,
                            fontSize: '13px',
                        }"
                    ></i>
                </div>
                <div>
                    <div class="act-text">
                        <strong>{{ actividad.titulo }}</strong>
                        — {{ actividad.descripcion }}
                    </div>
                    <div class="act-time">{{ actividad.tiempo }}</div>
                </div>
            </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px">
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

            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-search" aria-hidden="true"></i>
                        Objetos perdidos
                    </div>
                </div>
                <div class="metric-value">7</div>
                <div class="metric-sub">sin reclamar esta semana</div>
                <button
                    class="card-action"
                    style="margin-top: 8px; display: block"
                >
                    Ver listado →
                </button>
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
import { ref, onMounted } from "vue";
import { obtenerTodosComunicados } from "../../../services/comunidad-service.js";

defineEmits(["cambiar-vista"]);

const totalComunicados = ref(0);

onMounted(async () => {
  try {
    const res = await obtenerTodosComunicados();
    const data = res?.data || res;
    totalComunicados.value = Array.isArray(data) ? data.length : 0;
  } catch (e) {
    totalComunicados.value = 0;
  }
});

const actividadReciente = [
    {
        id: 1,
        iconBg: "#eaf3de",
        icon: "ti-user-plus",
        iconColor: "#3b6d11",
        titulo: "Nuevo alumno registrado",
        descripcion: "Valentina Ríos, 3°B",
        tiempo: "Hace 12 min",
    },
    {
        id: 2,
        iconBg: "#faeeda",
        icon: "ti-books",
        iconColor: "#854f0b",
        titulo: "Préstamo vencido",
        descripcion: '"Historia Argentina T.2" sin devolver',
        tiempo: "Hace 1 h",
    },
    {
        id: 3,
        iconBg: "#fbf0f0",
        icon: "ti-edit",
        iconColor: "#a52420",
        titulo: "Curso modificado",
        descripcion: "4°A cambió de aula (302→105)",
        tiempo: "Hace 2 h",
    },
    {
        id: 4,
        iconBg: "#e6f1fb",
        icon: "ti-speakerphone",
        iconColor: "#185fa5",
        titulo: "Novedad publicada",
        descripcion: '"Acto 25 de Mayo: resumen"',
        tiempo: "Ayer, 16:30",
    },
    {
        id: 5,
        iconBg: "#eaf3de",
        icon: "ti-user-check",
        iconColor: "#3b6d11",
        titulo: "Docente asignado",
        descripcion: "Prof. Garmendia → Matemáticas 5°A",
        tiempo: "Ayer, 11:05",
    },
];

const ultimosAlumnos = [
    { nombre: "Valentina Ríos", curso: "3°B", dni: "45.321.098" },
    { nombre: "Matías Acosta", curso: "1°A", dni: "46.102.774" },
    { nombre: "Lucía Ferreyra", curso: "2°C", dni: "44.987.001" },
];

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
    grid-template-columns: 2fr 1fr;
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

.activity-item {
    display: flex;
    gap: 8px;
    padding: 7px 0;
    border-bottom: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    align-items: flex-start;
}

.activity-item:last-child {
    border-bottom: none;
    padding-bottom: 0;
}
.activity-item:first-child {
    padding-top: 0;
}

.act-icon {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
}

.act-text {
    font-size: 12px;
    color: var(--color-text-secondary, #4b5563);
    line-height: 1.4;
}

.act-text strong {
    color: var(--color-text-primary, #111827);
    font-weight: 500;
}

.act-time {
    font-size: 10px;
    color: var(--color-text-tertiary, #6b7280);
    margin-top: 2px;
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
