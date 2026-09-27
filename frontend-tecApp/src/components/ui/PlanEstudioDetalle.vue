<template>
    <div class="plan-detalle">
        <div v-if="!materiasAgrupadas.length" class="empty-state">
            <i class="ti ti-file-x" style="font-size: 28px; opacity: 0.4"></i>
            <p>{{ anioFiltro ? `Este plan no tiene materias en ${anioFiltro}º año.` : "Este plan aún no tiene materias asignadas." }}</p>
        </div>

        <div v-for="grupo in materiasAgrupadas" :key="grupo.anio" class="anio-bloque">
            <h4 class="anio-titulo">
                <i class="ti ti-bookmark"></i> {{ grupo.anio }}º año
                <span class="anio-count">{{ grupo.materias.length }} materia(s)</span>
            </h4>
            <ul class="materia-lista">
                <li v-for="pm in grupo.materias" :key="pm.id_plan_materia" class="materia-item">
                    <div class="materia-info">
                        <strong>{{ pm.materia?.nombre_materia || `#${pm.id_materia}` }}</strong>
                        <span class="materia-meta">
                            {{ regimen(pm.cuatrimestre) }}
                            <template v-if="pm.materia?.carga_horaria"> · {{ pm.materia.carga_horaria }} hs/sem</template>
                        </span>
                        <div v-if="(pm.correlativas || []).length" class="corr-lista">
                            <span class="corr-label"><i class="ti ti-git-branch"></i> Requiere:</span>
                            <span v-for="c in pm.correlativas" :key="c.id_correlativa" class="corr-chip">
                                {{ c.requerida?.materia?.nombre_materia || "?" }} ({{ c.requerida?.anio }}º)
                                <button v-if="editable" class="corr-quitar" title="Quitar correlativa"
                                    @click="$emit('quitar-correlativa', pm.id_plan_materia, c.id_plan_materia_req)">
                                    <i class="ti ti-x"></i>
                                </button>
                            </span>
                        </div>
                    </div>
                    <button v-if="editable" class="icon-btn delete sm" title="Quitar materia del plan"
                        @click="$emit('quitar-materia', pm.id_plan_materia)">
                        <i class="ti ti-trash"></i>
                    </button>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
    plan: { type: Object, required: true },
    editable: { type: Boolean, default: false },
    anioFiltro: { type: [Number, null], default: null },
});

defineEmits(["quitar-materia", "quitar-correlativa"]);

function regimen(c) {
    return c === "1" ? "1º cuatrimestre" : c === "2" ? "2º cuatrimestre" : "Anual";
}

const materiasAgrupadas = computed(() => {
    const lista = props.plan?.materiasPlan || [];
    const filtrada = props.anioFiltro ? lista.filter((pm) => Number(pm.anio) === Number(props.anioFiltro)) : lista;
    const porAnio = new Map();
    for (const pm of filtrada) {
        const anio = Number(pm.anio);
        if (!porAnio.has(anio)) porAnio.set(anio, []);
        porAnio.get(anio).push(pm);
    }
    return [...porAnio.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([anio, materias]) => ({
            anio,
            materias: [...materias].sort((x, y) =>
                (x.materia?.nombre_materia || "").localeCompare(y.materia?.nombre_materia || ""),
            ),
        }));
});
</script>

<style scoped>
.plan-detalle {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.anio-bloque {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 12px 16px;
    background: #fafafa;
}
.anio-titulo {
    margin: 0 0 8px;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 8px;
}
.anio-count {
    font-weight: normal;
    font-size: 0.8rem;
    color: #6b7280;
}
.materia-lista {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
}
.materia-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    padding: 8px 12px;
}
.materia-meta {
    display: block;
    font-size: 0.82rem;
    color: #6b7280;
}
.corr-lista {
    margin-top: 4px;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    font-size: 0.82rem;
}
.corr-label {
    color: #6b7280;
}
.corr-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #eef2ff;
    color: #3730a3;
    border-radius: 999px;
    padding: 2px 8px;
}
.corr-quitar {
    border: none;
    background: transparent;
    cursor: pointer;
    color: #9ca3af;
    padding: 0;
    display: inline-flex;
}
.corr-quitar:hover {
    color: #cd322c;
}
</style>
