<template>
    <div class="datatable" :class="`datatable-${densidad}`">
        <div v-if="cargando" class="empty-state" role="status">
            <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
            <p>{{ textoCarga }}</p>
        </div>

        <div v-else-if="error" class="error-banner" style="margin: 16px" role="alert">
            <i class="ti ti-alert-circle"></i> {{ error }}
            <button class="tb-btn sm outline" style="margin-left: auto" @click="$emit('reintentar')">
                {{ textoReintentar }}
            </button>
        </div>

        <template v-else-if="filas.length > 0">
            <table class="mini" :aria-label="etiqueta">
                <thead>
                    <tr>
                        <th v-if="seleccionable" class="check-cell">
                            <input
                                type="checkbox"
                                :checked="todasEnPagina"
                                :indeterminate="algunasEnPagina"
                                @change="alternarPagina($event.target.checked)"
                                aria-label="Seleccionar página"
                            />
                        </th>
                        <th
                            v-for="col in columnas"
                            :key="col.key"
                            :class="{ 'action-cell': col.key === '__acciones' }"
                            :aria-sort="col.ordenable ? ariaSort(col.key) : undefined"
                        >
                            <button
                                v-if="col.ordenable"
                                class="th-sort"
                                @click="$emit('ordenar', col.key, col.getter || null)"
                            >
                                {{ col.titulo }}
                                <i class="ti" :class="iconoSort(col.key)" aria-hidden="true"></i>
                            </button>
                            <template v-else>{{ col.titulo }}</template>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="fila in filas"
                        :key="claveDe(fila)"
                        class="table-row"
                        :class="claseFila ? claseFila(fila) : null"
                    >
                        <td v-if="seleccionable" class="check-cell">
                            <input
                                type="checkbox"
                                :checked="estaSeleccionada(fila)"
                                @change="alternarFila(fila, $event.target.checked)"
                                :aria-label="`Seleccionar fila ${claveDe(fila)}`"
                            />
                        </td>
                        <td v-for="col in columnas" :key="col.key" :class="{ 'action-cell': col.key === '__acciones' }">
                            <slot
                                v-if="col.key === '__acciones'"
                                name="acciones"
                                :fila="fila"
                            />
                            <slot
                                v-else
                                :name="`celda-${col.key}`"
                                :fila="fila"
                                :valor="valorDe(fila, col)"
                            >
                                {{ valorDe(fila, col) }}
                            </slot>
                        </td>
                    </tr>
                </tbody>
            </table>
            <Pagination
                :current-page="pagina"
                :total-items="total"
                :page-size="porPagina"
                @page-change="$emit('pagina', $event)"
                @page-size-change="$emit('por-pagina', $event)"
            />
        </template>

        <div v-else class="empty-state">
            <slot name="vacio">
                <i class="ti" :class="iconoVacio" style="font-size: 28px; opacity: 0.4"></i>
                <p v-if="busquedaActiva">{{ textoVacioBusqueda }}</p>
                <p v-else>{{ textoVacio }}</p>
            </slot>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import Pagination from "./Pagination.vue";

const props = defineProps({
    columnas: { type: Array, required: true },
    filas: { type: Array, default: () => [] },
    claveFila: { type: [String, Function], default: "id" },
    total: { type: Number, default: 0 },
    pagina: { type: Number, default: 1 },
    porPagina: { type: Number, default: 10 },
    ordenKey: { type: String, default: null },
    ordenDir: { type: String, default: "asc" },
    cargando: { type: Boolean, default: false },
    textoCarga: { type: String, default: "Cargando..." },
    error: { type: String, default: "" },
    textoReintentar: { type: String, default: "Reintentar" },
    etiqueta: { type: String, default: "Listado" },
    iconoVacio: { type: String, default: "ti-inbox" },
    textoVacio: { type: String, default: "No se encontraron registros." },
    textoVacioBusqueda: { type: String, default: "Sin coincidencias para la búsqueda." },
    busquedaActiva: { type: Boolean, default: false },
    seleccionable: { type: Boolean, default: false },
    seleccion: { type: Array, default: () => [] },
    densidad: { type: String, default: "normal" },
    claseFila: { type: Function, default: null },
});

const emit = defineEmits(["ordenar", "pagina", "por-pagina", "reintentar", "update:seleccion"]);

function claveDe(fila) {
    return typeof props.claveFila === "function" ? props.claveFila(fila) : fila?.[props.claveFila];
}

function valorDe(fila, col) {
    if (col.getter) return col.getter(fila);
    return col.key.split(".").reduce((acc, k) => acc?.[k], fila);
}

function ariaSort(key) {
    if (props.ordenKey !== key) return "none";
    return props.ordenDir === "asc" ? "ascending" : "descending";
}

function iconoSort(key) {
    if (props.ordenKey !== key) return "ti-selector";
    return props.ordenDir === "asc" ? "ti-caret-up-filled" : "ti-caret-down-filled";
}

function estaSeleccionada(fila) {
    return props.seleccion.includes(claveDe(fila));
}

const todasEnPagina = computed(
    () => props.filas.length > 0 && props.filas.every((f) => estaSeleccionada(f)),
);
const algunasEnPagina = computed(
    () => !todasEnPagina.value && props.filas.some((f) => estaSeleccionada(f)),
);

function alternarFila(fila, marcada) {
    const clave = claveDe(fila);
    const actual = new Set(props.seleccion);
    if (marcada) actual.add(clave);
    else actual.delete(clave);
    emit("update:seleccion", [...actual]);
}

function alternarPagina(marcadas) {
    const actual = new Set(props.seleccion);
    for (const fila of props.filas) {
        const clave = claveDe(fila);
        if (marcadas) actual.add(clave);
        else actual.delete(clave);
    }
    emit("update:seleccion", [...actual]);
}
</script>

<style scoped>
.datatable-compacta .mini td {
    padding: 5px 10px;
}
.check-cell {
    width: 36px;
    text-align: center;
}
.check-cell input {
    cursor: pointer;
}
</style>
