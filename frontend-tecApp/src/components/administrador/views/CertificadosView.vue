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
                        <input v-model="busqueda" placeholder="Ej: Perez o 12345678" @input="buscar" />
                    </div>
                </div>
                <div v-if="error" class="error-banner" role="alert">
                    <i class="ti ti-alert-circle"></i> {{ error }}
                </div>
                <div v-if="candidatos.length > 0" class="table-responsive">
                    <table class="mini" aria-label="Alumnos encontrados">
                        <tbody>
                            <tr
                                v-for="a in candidatos"
                                :key="a.id_alumno"
                                class="table-row"
                                :class="{ seleccionado: a.id_alumno === alumno?.id_alumno }"
                                @click="elegir(a)"
                                style="cursor: pointer"
                            >
                                <td><strong>{{ a.apellido }}</strong>, {{ a.nombre }}</td>
                                <td class="mono">{{ a.dni }}</td>
                                <td>{{ a.curso?.nombre_curso || "Sin curso" }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
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
let temporizador = null;

function normalizarAlumno(a) {
    return {
        ...a,
        curso: a.curso?.nombre_curso || a.nombre_curso || null,
    };
}

function buscar() {
    clearTimeout(temporizador);
    temporizador = setTimeout(async () => {
        if (busqueda.value.trim().length < 2) {
            candidatos.value = [];
            return;
        }
        const res = await obtenerAlumnos({ q: busqueda.value.trim(), limit: 10 });
        const data = res.success ? res.data : [];
        candidatos.value = (Array.isArray(data) ? data : []).slice(0, 10);
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
