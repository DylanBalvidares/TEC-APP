<template>
    <div class="auditoria-wrapper">
        <div class="search-bar-wrapper">
            <label class="filtro-inline">
                <span>Entidad</span>
                <select :value="filtros.entidad" @change="cambiarFiltro('entidad', $event.target.value)">
                    <option value="">Todas</option>
                    <option v-for="e in entidades" :key="e" :value="e">{{ e }}</option>
                </select>
            </label>
            <label class="filtro-inline">
                <span>Acción</span>
                <select :value="filtros.accion" @change="cambiarFiltro('accion', $event.target.value)">
                    <option value="">Todas</option>
                    <option v-for="a in acciones" :key="a" :value="a">{{ a }}</option>
                </select>
            </label>
            <button class="tb-btn outline sm exportar-btn" @click="exportar">
                <i class="ti ti-download" aria-hidden="true"></i> Exportar
            </button>
        </div>

        <div class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-history" aria-hidden="true"></i>
                    Auditoría de cambios
                </div>
                <span class="metric-badge badge-gray">{{ total }} registros</span>
            </div>

            <div class="table-responsive">
                <div v-if="cargando" class="empty-state" role="status">
                    <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
                    <p>Cargando auditoría...</p>
                </div>

                <div v-else-if="error" class="error-banner" style="margin: 16px" role="alert">
                    <i class="ti ti-alert-circle"></i> {{ error }}
                    <button class="tb-btn sm outline" style="margin-left: auto" @click="cargar">
                        Reintentar
                    </button>
                </div>

                <template v-else-if="registros.length > 0">
                    <ol class="timeline">
                        <li v-for="r in registros" :key="r.id_auditoria" class="timeline-item">
                            <span class="timeline-dot" :class="`accion-${r.accion}`"></span>
                            <div class="timeline-info">
                                <div class="timeline-titulo">
                                    <strong>{{ r.accion }}</strong>
                                    <span class="status-pill sp-cargo">{{ r.entidad }}</span>
                                    <span v-if="r.id_entidad" class="mono">#{{ r.id_entidad }}</span>
                                </div>
                                <div class="timeline-sub">
                                    {{ formatearFecha(r.fecha) }}
                                    <span v-if="r.id_usuario"> · usuario #{{ r.id_usuario }}</span>
                                    <span v-if="r.ip"> · {{ r.ip }}</span>
                                </div>
                            </div>
                        </li>
                    </ol>
                    <Pagination
                        :current-page="pagina"
                        :total-items="total"
                        :page-size="porPagina"
                        @page-change="irAPagina"
                        @page-size-change="cambiarTamano"
                    />
                </template>

                <div v-else class="empty-state">
                    <i class="ti ti-history-off" style="font-size: 28px; opacity: 0.4"></i>
                    <p>No hay registros de auditoría para los filtros elegidos.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { obtenerAuditoria } from "../../../services/admin-service.js";
import { exportarCsv } from "../../../utils/exportCsv.js";
import { toast } from "../../../services/toast-service.js";
import Pagination from "../../ui/Pagination.vue";

const registros = ref([]);
const total = ref(0);
const pagina = ref(1);
const porPagina = ref(20);
const cargando = ref(false);
const error = ref("");
const filtros = reactive({ entidad: "", accion: "" });

const entidades = ["usuario", "alumno", "rol", "curso", "materia"];
const acciones = ["crear", "modificar", "eliminar", "baja"];

function formatearFecha(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

async function cargar() {
    cargando.value = true;
    error.value = "";
    try {
        const params = { page: pagina.value, limit: porPagina.value };
        if (filtros.entidad) params.entidad = filtros.entidad;
        if (filtros.accion) params.accion = filtros.accion;
        const res = await obtenerAuditoria(params);
        if (!res.success) throw new Error(res.message);
        registros.value = res.data;
        total.value = res.total;
    } catch (e) {
        error.value = e?.message || "No se pudo cargar la auditoría.";
        registros.value = [];
        total.value = 0;
    } finally {
        cargando.value = false;
    }
}

function cambiarFiltro(clave, valor) {
    filtros[clave] = valor;
    pagina.value = 1;
    cargar();
}

function irAPagina(p) {
    pagina.value = p;
    cargar();
}

function cambiarTamano(n) {
    porPagina.value = n;
    pagina.value = 1;
    cargar();
}

async function exportar() {
    try {
        const params = { page: 1, limit: 1000 };
        if (filtros.entidad) params.entidad = filtros.entidad;
        if (filtros.accion) params.accion = filtros.accion;
        const res = await obtenerAuditoria(params);
        if (!res.success) throw new Error(res.message);
        exportarCsv(res.data, {
            nombreArchivo: "auditoria",
            columnas: {
                ID: "id_auditoria",
                Fecha: "fecha",
                Accion: "accion",
                Entidad: "entidad",
                ID_Entidad: "id_entidad",
                Usuario: "id_usuario",
                IP: "ip",
            },
        });
        toast.success("Auditoría exportada.");
    } catch (e) {
        toast.error(e?.message || "No se pudo exportar la auditoría.");
    }
}

onMounted(cargar);
</script>

<style scoped>
.timeline {
    list-style: none;
    margin: 0;
    padding: 12px 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
}
.timeline-item {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 0.5px solid #e5e7eb;
}
.timeline-item:last-child {
    border-bottom: none;
}
.timeline-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #9ca3af;
    margin-top: 5px;
    flex-shrink: 0;
}
.timeline-dot.accion-crear {
    background: #3b6d11;
}
.timeline-dot.accion-modificar {
    background: #0369a1;
}
.timeline-dot.accion-eliminar,
.timeline-dot.accion-baja {
    background: #cd322c;
}
.timeline-info {
    display: flex;
    flex-direction: column;
    gap: 3px;
}
.timeline-titulo {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    text-transform: capitalize;
}
.timeline-sub {
    font-size: 11.5px;
    color: #6b7280;
}
</style>
