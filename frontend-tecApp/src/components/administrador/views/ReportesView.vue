<template>
    <div class="reportes-wrapper">
        <div v-if="error" class="error-banner" style="margin-bottom: 12px" role="alert">
            <i class="ti ti-alert-circle"></i> {{ error }}
            <button class="tb-btn sm outline" style="margin-left: auto" @click="cargar">
                Reintentar
            </button>
        </div>

        <div v-if="cargando" class="empty-state" role="status">
            <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
            <p>Generando reportes...</p>
        </div>

        <template v-else>
            <div class="card animate-fade-in">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-chart-bar" aria-hidden="true"></i>
                        Retención por curso
                    </div>
                    <button class="tb-btn outline sm exportar-btn" @click="exportarRetencion">
                        <i class="ti ti-download" aria-hidden="true"></i> Exportar
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="mini" aria-label="Retención por curso">
                        <thead>
                            <tr>
                                <th>Curso</th>
                                <th>Activos</th>
                                <th>Bajas</th>
                                <th>Total</th>
                                <th>Retención</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="r in retencion" :key="r.id_curso" class="table-row">
                                <td><strong>{{ r.nombre }}</strong></td>
                                <td>{{ r.activos }}</td>
                                <td>{{ r.bajas }}</td>
                                <td>{{ r.total }}</td>
                                <td>
                                    <div class="prog-bar">
                                        <div class="prog-fill g" :style="{ width: r.retencion_pct + '%' }"></div>
                                    </div>
                                    {{ r.retencion_pct }}%
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card animate-fade-in">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-star" aria-hidden="true"></i>
                        Promedios por materia
                    </div>
                    <button class="tb-btn outline sm exportar-btn" @click="exportarPromedios">
                        <i class="ti ti-download" aria-hidden="true"></i> Exportar
                    </button>
                </div>
                <div class="table-responsive">
                    <table class="mini" aria-label="Promedios por materia">
                        <thead>
                            <tr>
                                <th>Materia</th>
                                <th>Promedio</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="m in promedios" :key="m.id_materia" class="table-row">
                                <td><strong>{{ m.nombre }}</strong></td>
                                <td>{{ m.promedio ?? "—" }}</td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-if="promedios.length === 0" class="empty-state">
                        <p>Todavía no hay calificaciones cargadas.</p>
                    </div>
                </div>
            </div>

            <div class="card animate-fade-in">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-users" aria-hidden="true"></i>
                        Altas y bajas
                    </div>
                </div>
                <div class="table-responsive">
                    <table class="mini" aria-label="Altas y bajas de alumnos">
                        <thead>
                            <tr>
                                <th>Estado</th>
                                <th>Cantidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(cantidad, estado) in altasBajas" :key="estado" class="table-row">
                                <td style="text-transform: capitalize">{{ estado }}</td>
                                <td>{{ cantidad }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { obtenerResumenReportes } from "../../../services/admin-service.js";
import { exportarCsv } from "../../../utils/exportCsv.js";
import { toast } from "../../../services/toast-service.js";

const retencion = ref([]);
const promedios = ref([]);
const altasBajas = ref({});
const cargando = ref(false);
const error = ref("");

async function cargar() {
    cargando.value = true;
    error.value = "";
    try {
        const res = await obtenerResumenReportes();
        if (!res.success) throw new Error(res.message);
        const d = res.data || {};
        retencion.value = d.retencion || [];
        promedios.value = d.promediosPorMateria || [];
        altasBajas.value = d.altasBajas || {};
    } catch (e) {
        error.value = e?.message || "No se pudieron generar los reportes.";
    } finally {
        cargando.value = false;
    }
}

function exportarRetencion() {
    try {
        exportarCsv(retencion.value, {
            nombreArchivo: "reporte-retencion",
            columnas: {
                Curso: "nombre",
                Activos: "activos",
                Bajas: "bajas",
                Total: "total",
                Retencion: "retencion_pct",
            },
        });
        toast.success("Reporte de retención exportado.");
    } catch (e) {
        toast.error(e?.message || "No se pudo exportar.");
    }
}

function exportarPromedios() {
    try {
        exportarCsv(promedios.value, {
            nombreArchivo: "reporte-promedios",
            columnas: { Materia: "nombre", Promedio: "promedio" },
        });
        toast.success("Reporte de promedios exportado.");
    } catch (e) {
        toast.error(e?.message || "No se pudo exportar.");
    }
}

onMounted(cargar);
</script>
