<template>
    <div class="certificados-wrapper">
        <div class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-certificate" aria-hidden="true"></i>
                    Certificados y constancias
                </div>
            </div>
            <div class="form-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Plantilla</label>
                        <select v-model="tipo">
                            <option v-for="p in PLANTILLAS" :key="p.id" :value="p.id">
                                {{ p.nombre }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Buscar alumno (nombre, apellido o DNI)</label>
                        <input v-model="busqueda" placeholder="Ej: Pérez o 12345678" @input="buscar" />
                    </div>
                </div>
                <div v-if="error" class="error-banner" role="alert">
                    <i class="ti ti-alert-circle"></i> {{ error }}
                </div>
                <div v-if="buscando" class="empty-state" role="status" aria-live="polite">
                    <i class="ti ti-loader animate-spin" aria-hidden="true"></i>
                    <p>Buscando alumnos…</p>
                </div>
                <div v-else-if="busqueda.trim().length >= 2 && candidatos.length > 0" class="table-responsive">
                    <table class="mini" aria-label="Alumnos encontrados">
                        <tbody>
                            <tr
                                v-for="a in candidatos"
                                :key="a.id_alumno"
                                class="table-row"
                                :class="{ seleccionado: a.id_alumno === alumno?.id_alumno }"
                            >
                                <td>
                                    <button
                                        type="button"
                                        class="cert-alumno-select"
                                        :aria-pressed="a.id_alumno === alumno?.id_alumno"
                                        @click="elegir(a)"
                                    >
                                        <strong>{{ a.apellido }}</strong>, {{ a.nombre }}
                                        <i v-if="a.id_alumno === alumno?.id_alumno" class="ti ti-check" aria-hidden="true"></i>
                                    </button>
                                </td>
                                <td class="mono">{{ a.dni }}</td>
                                <td>{{ a.curso?.nombre_curso || "Sin curso" }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div v-else-if="busqueda.trim().length >= 2 && !error" class="empty-state" role="status">
                    <i class="ti ti-user-search" aria-hidden="true"></i>
                    <p>No encontramos alumnos con esa búsqueda. Revisá el nombre o el DNI.</p>
                </div>
                <p v-else-if="busqueda.trim().length > 0" class="search-hint">Escribí al menos 2 caracteres para buscar.</p>
            </div>
        </div>

        <div v-if="alumno" class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-eye" aria-hidden="true"></i>
                    Vista previa
                </div>
                <button class="tb-btn primary sm" :disabled="!html" @click="imprimir">
                    <i class="ti ti-printer" aria-hidden="true"></i> Imprimir / PDF
                </button>
            </div>
            <div class="cert-hoja" v-html="html"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { obtenerAlumnos } from "../../../services/academico-service.js";
import { PLANTILLAS, renderizarPlantilla } from "../../../utils/certificados.js";

const tipo = ref("alumno-regular");
const busqueda = ref("");
const candidatos = ref([]);
const alumno = ref(null);
const html = ref("");
const error = ref("");
const buscando = ref(false);
let temporizador = null;
let secuenciaBusqueda = 0;

function normalizarAlumno(a) {
    return {
        ...a,
        curso: a.curso?.nombre_curso || a.nombre_curso || null,
    };
}

function buscar() {
    const secuencia = ++secuenciaBusqueda;
    clearTimeout(temporizador);
    error.value = "";
    candidatos.value = [];
    buscando.value = busqueda.value.trim().length >= 2;
    temporizador = setTimeout(async () => {
        if (busqueda.value.trim().length < 2) {
            buscando.value = false;
            return;
        }
        try {
            const res = await obtenerAlumnos({ q: busqueda.value.trim(), limit: 10 });
            if (!res.success) throw new Error(res.message || "No se pudo completar la búsqueda.");
            const data = res.data;
            if (secuencia !== secuenciaBusqueda) return;
            candidatos.value = (Array.isArray(data) ? data : []).slice(0, 10);
        } catch (e) {
            if (secuencia !== secuenciaBusqueda) return;
            candidatos.value = [];
            error.value = e?.message || "No se pudo buscar alumnos. Intentá de nuevo.";
        } finally {
            if (secuencia === secuenciaBusqueda) buscando.value = false;
        }
    }, 300);
}

function elegir(a) {
    alumno.value = normalizarAlumno(a);
    previsualizar();
}

function previsualizar() {
    error.value = "";
    try {
        html.value = renderizarPlantilla(tipo.value, { alumno: alumno.value });
    } catch (e) {
        error.value = e?.message || "No se pudo generar.";
        html.value = "";
    }
}

function imprimir() {
    window.print();
}

watch(tipo, () => {
    if (alumno.value) previsualizar();
});
</script>

<style scoped>
.seleccionado {
    background: #eff6ff;
}
.cert-alumno-select {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
}
.cert-alumno-select:hover { color: #a52420; }
.cert-alumno-select:focus-visible {
    outline: 2px solid #cd322c;
    outline-offset: 3px;
}
.seleccionado .cert-alumno-select { color: #a52420; }
.search-hint {
    margin: 0;
    color: var(--color-text-tertiary, #6b7280);
    font-size: 12px;
}
.cert-hoja {
    padding: 32px;
    background: #fff;
}
.cert-hoja :deep(.cert-membrete) {
    text-align: center;
    margin-bottom: 24px;
}
.cert-hoja :deep(.cert-inst) {
    font-size: 18px;
    font-weight: 700;
}
.cert-hoja :deep(.cert-sub) {
    font-size: 12px;
    color: #6b7280;
}
.cert-hoja :deep(.cert-titulo) {
    text-align: center;
    font-size: 22px;
    margin: 24px 0;
}
.cert-hoja :deep(.cert-cuerpo) {
    font-size: 15px;
    line-height: 1.8;
    text-align: justify;
}
.cert-hoja :deep(.cert-pie) {
    margin-top: 64px;
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #4b5563;
}
@media print {
    .certificados-wrapper .card:first-child {
        display: none;
    }
    .cert-hoja {
        padding: 0;
    }
}
</style>
