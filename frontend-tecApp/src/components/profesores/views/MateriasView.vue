<template>
    <section class="tab-panel active">
        <div class="tab-toolbar">
            <div class="tab-toolbar-left">
                <h2 class="section-title"><i class="fas fa-chalkboard-teacher"></i> Mis Materias</h2>
            </div>
        </div>

        <EmptyState v-if="cargando" icon="fas fa-spinner fa-spin">Cargando materias...</EmptyState>

        <div v-else class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Materia</th>
                        <th>Curso</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(asig, index) in asignaciones" :key="asig.id_asignacion || index">
                        <td>
                            <strong>{{ asig.materiaAsignacion?.nombre_materia }}</strong>
                        </td>
                        <td>{{ asig.cursoAsignacion?.nombre_curso || "S/D" }}</td>
                    </tr>
                    <tr v-if="asignaciones.length === 0">
                        <td colspan="2">
                            <EmptyState icon="fas fa-book">No hay materias asignadas para este periodo lectivo.</EmptyState>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
</template>

<script setup>
import EmptyState from "../EmptyState.vue";
import { ref, onMounted } from "vue";
import { obtenerAsignacionesProfesor } from "@/services/academico-service.js";
import { resolverIdProfesor } from "@/composables/useProfesor.js";

const asignaciones = ref([]);
const cargando = ref(true);

onMounted(async () => {
    try {
        const idProfesor = await resolverIdProfesor();
        if (!idProfesor) {
            console.warn("MateriasView: no se pudo obtener el id_profesor.");
            return;
        }

        const res = await obtenerAsignacionesProfesor(idProfesor);
        if (res.success && res.data) {
            asignaciones.value = res.data;
        } else {
            console.warn("MateriasView: respuesta sin datos.", res);
        }
    } catch (error) {
        console.error("Error al cargar materias asignadas:", error);
    } finally {
        cargando.value = false;
    }
});
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
</style>
