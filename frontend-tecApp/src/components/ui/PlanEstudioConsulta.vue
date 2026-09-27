<template>
    <div class="plan-consulta">
        <div class="pc-header">
            <h2><i class="ti ti-layers"></i> Plan de Estudios</h2>
            <p>Consultá las materias y correlativas de los planes vigentes.</p>
        </div>

        <div v-if="cargando" class="pc-estado">
            <i class="ti ti-loader animate-spin"></i> Cargando planes vigentes...
        </div>
        <div v-else-if="error" class="pc-error">
            <i class="ti ti-alert-circle"></i> {{ error }}
            <button class="pc-btn" @click="fetchVigentes">Reintentar</button>
        </div>
        <div v-else-if="!planes.length" class="pc-estado">
            <i class="ti ti-file-x"></i> No hay planes vigentes publicados.
        </div>

        <template v-else>
            <div class="pc-filtros">
                <label>
                    Plan
                    <select v-model="planId">
                        <option v-for="p in planes" :key="p.id_plan" :value="p.id_plan">
                            {{ p.nombre }} ({{ p.orientacion }})
                        </option>
                    </select>
                </label>
                <label>
                    Año
                    <select v-model="anioFiltro">
                        <option :value="null">Todos</option>
                        <option v-for="a in 7" :key="a" :value="a">{{ a }}º año</option>
                    </select>
                </label>
            </div>

            <div v-if="planActual" class="pc-plan-info">
                <strong>{{ planActual.nombre }}</strong>
                <span class="pc-codigo">{{ planActual.codigo }}</span>
                <span>{{ planActual.orientacion }}</span>
                <p v-if="planActual.descripcion" class="pc-desc">{{ planActual.descripcion }}</p>
            </div>

            <PlanEstudioDetalle v-if="planActual" :plan="planActual" :anio-filtro="anioFiltro" />
        </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import PlanEstudioDetalle from "./PlanEstudioDetalle.vue";
import { obtenerPlanesVigentes } from "../../services/academico-service.js";

const planes = ref([]);
const planId = ref(null);
const anioFiltro = ref(null);
const cargando = ref(false);
const error = ref("");

const planActual = computed(() => planes.value.find((p) => p.id_plan === planId.value) || null);

const fetchVigentes = async () => {
    cargando.value = true;
    error.value = "";
    try {
        const res = await obtenerPlanesVigentes();
        planes.value = Array.isArray(res.data) ? res.data : [];
        if (planes.value.length && !planActual.value) planId.value = planes.value[0].id_plan;
    } catch (e) {
        console.error("Error al obtener planes vigentes:", e);
        error.value = "No se pudieron cargar los planes vigentes.";
    } finally {
        cargando.value = false;
    }
};

onMounted(fetchVigentes);
</script>

<style scoped>
.plan-consulta {
    max-width: 960px;
    margin: 0 auto;
    padding: 16px;
}
.pc-header h2 {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
}
.pc-header p {
    color: #6b7280;
    margin: 4px 0 16px;
}
.pc-estado,
.pc-error {
    padding: 24px;
    text-align: center;
    color: #6b7280;
    border: 1px dashed #d1d5db;
    border-radius: 8px;
}
.pc-error {
    color: #b91c1c;
}
.pc-filtros {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 16px;
}
.pc-filtros label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 0.85rem;
    font-weight: 600;
}
.pc-filtros select {
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    min-width: 200px;
}
.pc-plan-info {
    margin-bottom: 12px;
    display: flex;
    gap: 8px;
    align-items: baseline;
    flex-wrap: wrap;
}
.pc-codigo {
    font-family: monospace;
    background: #f3f4f6;
    border-radius: 4px;
    padding: 1px 6px;
}
.pc-desc {
    width: 100%;
    color: #4b5563;
    margin: 0;
}
.pc-btn {
    margin-left: 8px;
    padding: 6px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
}
.animate-spin {
    animation: spin 1s linear infinite;
}
@keyframes spin {
    to { transform: rotate(360deg); }
}
</style>
