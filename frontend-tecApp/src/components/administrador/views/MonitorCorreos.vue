<template>
    <div class="monitor-wrapper">
        <!-- ── Tarjetas de resumen ─────────────────────────────────────── -->
        <div class="stat-cards">
            <div class="stat-card">
                <div class="stat-icon si-total">
                    <i class="ti ti-mail" aria-hidden="true"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ estadisticas.total }}</span>
                    <span class="stat-label">Total de emails</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon si-ok">
                    <i class="ti ti-check" aria-hidden="true"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ estadisticas.enviados }}</span>
                    <span class="stat-label">Enviados</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon si-fail">
                    <i class="ti ti-x" aria-hidden="true"></i>
                </div>
                <div class="stat-info">
                    <span class="stat-value">{{ estadisticas.fallidos }}</span>
                    <span class="stat-label">Fallidos</span>
                </div>
            </div>
        </div>

        <!-- ── Card principal ──────────────────────────────────────────── -->
        <div class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-mail" aria-hidden="true"></i>
                    Historial de emails
                </div>
                <button
                    @click="recargar"
                    class="icon-btn"
                    title="Actualizar"
                    aria-label="Actualizar historial"
                    :disabled="cargando"
                >
                    <i
                        class="ti ti-refresh"
                        :class="{ 'animate-spin': cargando }"
                    ></i>
                </button>
            </div>

            <!-- Toolbar: búsqueda + filtros -->
            <div class="toolbar">
                <div class="search-box">
                    <i class="ti ti-search"></i>
                    <input
                        v-model="searchText"
                        type="text"
                        placeholder="Buscar por destinatario o asunto..."
                        aria-label="Buscar en el historial"
                    />
                    <button
                        v-if="searchText"
                        class="search-clear"
                        @click="searchText = ''; goToPage(1)"
                        aria-label="Limpiar búsqueda"
                    >
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div class="filter-row">
                    <div class="form-group inline">
                        <label for="filtro-estado">Estado</label>
                        <select
                            id="filtro-estado"
                            v-model="filtro.estado"
                            @change="goToPage(1)"
                        >
                            <option value="">Todos</option>
                            <option value="enviado">Enviados</option>
                            <option value="fallido">Fallidos</option>
                        </select>
                    </div>
                    <div class="form-group inline">
                        <label for="filtro-desde">Desde</label>
                        <input
                            id="filtro-desde"
                            type="date"
                            v-model="filtro.fecha_desde"
                        />
                    </div>
                    <div class="form-group inline">
                        <label for="filtro-hasta">Hasta</label>
                        <input
                            id="filtro-hasta"
                            type="date"
                            v-model="filtro.fecha_hasta"
                        />
                    </div>
                    <button
                        @click="aplicarFiltros"
                        class="tb-btn primary sm"
                        :disabled="cargando"
                    >
                        <i class="ti ti-filter" aria-hidden="true"></i>
                        Aplicar
                    </button>
                    <button
                        @click="limpiarFiltros"
                        class="tb-btn outline sm"
                        :disabled="cargando"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            <div class="table-responsive">
                <div v-if="cargando" class="empty-state">
                    <i
                        class="ti ti-loader animate-spin"
                        style="font-size: 24px; color: #cd322c"
                    ></i>
                    <p>Cargando historial...</p>
                </div>

                <div
                    v-else-if="errorCarga"
                    class="error-banner"
                    style="margin: 16px"
                >
                    <i class="ti ti-alert-circle"></i> {{ errorCarga }}
                    <button
                        class="tb-btn sm outline"
                        @click="cargarHistorial"
                        style="margin-left: auto"
                    >
                        Reintentar
                    </button>
                </div>

                <template v-else-if="filteredData.length > 0">
                    <table class="mini" aria-label="Historial de emails">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Fecha de envío</th>
                                <th>Remitente</th>
                                <th>Destinatario</th>
                                <th>Asunto</th>
                                <th>Estado</th>
                                <th>Lectura</th>
                                <th class="action-cell">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="email in paginatedData"
                                :key="email.id"
                                class="table-row"
                                :class="{ 'row-unread': !email.leido }"
                            >
                                <td class="mono">{{ email.id }}</td>
                                <td class="nowrap">
                                    {{ formatFechaHora(email.fecha_envio) }}
                                </td>
                                <td>
                                    <span
                                        v-if="email.remitente == null"
                                        class="email-cell"
                                        >Sistema</span
                                    >
                                    <span v-else class="remitente-cell">
                                        <span class="mono"
                                            >ID {{ email.remitente }}</span
                                        >
                                        <span
                                            v-if="rolRemitente(email.remitente)"
                                            class="status-pill sp-rol"
                                            >{{
                                                rolRemitente(email.remitente)
                                            }}</span
                                        >
                                    </span>
                                </td>
                                <td class="email-cell">
                                    {{ email.destinatario }}
                                </td>
                                <td
                                    class="asunto-cell"
                                    :title="email.asunto"
                                >
                                    {{ email.asunto }}
                                </td>
                                <td>
                                    <span
                                        :class="[
                                            'status-pill',
                                            email.estado === 'enviado'
                                                ? 'sp-activo'
                                                : 'sp-baja',
                                        ]"
                                    >
                                        {{
                                            email.estado === "enviado"
                                                ? "Enviado"
                                                : "Fallido"
                                        }}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        :class="[
                                            'status-pill',
                                            email.leido
                                                ? 'sp-leido'
                                                : 'sp-pendiente',
                                        ]"
                                    >
                                        {{ email.leido ? "Leído" : "Pendiente" }}
                                    </span>
                                </td>
                                <td class="action-cell">
                                    <div class="action-buttons">
                                        <button
                                            v-if="!email.leido"
                                            @click="marcarLeido(email.id)"
                                            class="icon-btn check"
                                            title="Marcar como leído"
                                            aria-label="Marcar como leído"
                                            :disabled="marcandoId === email.id"
                                        >
                                            <i
                                                class="ti"
                                                :class="
                                                    marcandoId === email.id
                                                        ? 'ti-loader animate-spin'
                                                        : 'ti-check'
                                                "
                                            ></i>
                                        </button>
                                        <span v-else class="email-cell"
                                            >—</span
                                        >
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </template>

                <div v-else class="empty-state">
                    <i
                        class="ti ti-mail-off"
                        style="font-size: 28px; opacity: 0.4"
                    ></i>
                    <p v-if="searchText || hayFiltrosActivos">
                        No se encontraron emails que coincidan con los
                        criterios.
                    </p>
                    <p v-else>No hay emails registrados todavía.</p>
                </div>
            </div>
            <Pagination
                :current-page="currentPage"
                :total-items="totalItems"
                :page-size="pageSize"
                @page-change="goToPage"
                @page-size-change="setPageSize"
            />
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import {
    obtenerHistorialGlobal,
    marcarCorreoLeido,
} from "../../../services/comunidad-service.js";
import { obtenerUsuarios } from "../../../services/usuarios-services.js";
import { useTableControls } from "../../../composables/useTableControls.js";
import Pagination from "../../ui/Pagination.vue";

const filtro = ref({
    estado: "",
    fecha_desde: "",
    fecha_hasta: "",
    limit: 100,
});

const emails = ref([]);
const estadisticas = ref({
    total: 0,
    enviados: 0,
    fallidos: 0,
});
const mapaRemitentes = ref({}); // id_usuario -> nombre del rol
const cargando = ref(false);
const errorCarga = ref("");
const marcandoId = ref(null);

// ── Búsqueda local + paginación ──────────────────────────────────────────
const filterFn = (item, q) =>
    `${item.destinatario || ""} ${item.asunto || ""}`.toLowerCase().includes(q);
const {
    searchText,
    currentPage,
    pageSize,
    filteredData,
    paginatedData,
    totalItems,
    goToPage,
    setPageSize,
} = useTableControls(emails, { pageSize: 10, filterFn });

const hayFiltrosActivos = computed(
    () => filtro.value.estado !== "" || filtro.value.fecha_desde !== "" || filtro.value.fecha_hasta !== "",
);

// ── Helpers ──────────────────────────────────────────────────────────────
function formatFechaHora(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return String(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function rolRemitente(idRemitente) {
    return mapaRemitentes.value[idRemitente] || "";
}

// ── Carga de datos ───────────────────────────────────────────────────────
const cargarRemitentes = async () => {
    try {
        const res = await obtenerUsuarios();
        const lista = res?.data?.data ?? res?.data ?? [];
        const mapa = {};
        if (Array.isArray(lista)) {
            for (const u of lista) {
                const id = u.id_usuario ?? u.id;
                if (id != null) {
                    mapa[id] =
                        u.rol?.nombre_rol || u.nombre_rol || "";
                }
            }
        }
        mapaRemitentes.value = mapa;
    } catch {
        // Si falla, la columna muestra solo el ID crudo
        mapaRemitentes.value = {};
    }
};

const cargarHistorial = async () => {
    cargando.value = true;
    errorCarga.value = "";
    try {
        const params = { limit: filtro.value.limit || 100 };
        if (filtro.value.estado) params.estado = filtro.value.estado;
        if (filtro.value.fecha_desde)
            params.fecha_desde = filtro.value.fecha_desde;
        if (filtro.value.fecha_hasta)
            params.fecha_hasta = filtro.value.fecha_hasta;

        const result = await obtenerHistorialGlobal(params);
        if (result && result.success === false) {
            throw new Error(
                result.mensaje ||
                    result.message ||
                    "No se pudo obtener el historial.",
            );
        }
        const lista = Array.isArray(result?.lista) ? result.lista : [];
        emails.value = lista;
        estadisticas.value = {
            total: result?.total ?? lista.length,
            enviados: lista.filter((e) => e.estado === "enviado").length,
            fallidos: lista.filter((e) => e.estado === "fallido").length,
        };
    } catch (e) {
        errorCarga.value =
            "No se pudo cargar el historial de emails. Verificá la conexión con el servidor.";
    } finally {
        cargando.value = false;
    }
};

const aplicarFiltros = async () => {
    goToPage(1);
    await cargarHistorial();
};

const limpiarFiltros = async () => {
    filtro.value.estado = "";
    filtro.value.fecha_desde = "";
    filtro.value.fecha_hasta = "";
    searchText.value = "";
    goToPage(1);
    await cargarHistorial();
};

const recargar = async () => {
    await cargarHistorial();
};

const marcarLeido = async (id) => {
    marcandoId.value = id;
    try {
        const result = await marcarCorreoLeido(id);
        if (result && result.success === false) return;
        const idx = emails.value.findIndex((e) => e.id === id);
        if (idx !== -1) {
            emails.value[idx].leido = true;
        }
    } finally {
        marcandoId.value = null;
    }
};

onMounted(async () => {
    await Promise.all([cargarHistorial(), cargarRemitentes()]);
});
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.25s ease-in-out;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}
.animate-spin {
    animation: spin 0.8s linear infinite;
    display: inline-block;
}

.monitor-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1100px;
}

/* ── Tarjetas de resumen ───────────────────────────────────────────────── */
.stat-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
}
.stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--color-background-primary, #fff);
    border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    padding: 14px 16px;
}
.stat-icon {
    width: 38px;
    height: 38px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;
}
.si-total {
    background: #f3f4f6;
    color: #4b5563;
}
.si-ok {
    background: #eaf3de;
    color: #3b6d11;
}
.si-fail {
    background: #fee2e2;
    color: #991b1b;
}
.stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
}
.stat-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-text-primary, #111827);
    line-height: 1;
}
.stat-label {
    font-size: 12px;
    color: var(--color-text-tertiary, #6b7280);
}

/* ── Card ──────────────────────────────────────────────────────────────── */
.card {
    background: var(--color-background-primary, #fff);
    border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    overflow: hidden;
}
.card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #fafafa;
}
.card-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
    display: flex;
    align-items: center;
    gap: 8px;
}
.card-title i {
    font-size: 16px;
    color: #cd322c;
}

/* ── Toolbar ───────────────────────────────────────────────────────────── */
.toolbar {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 20px 0 20px;
}
.search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0 12px;
    background: white;
    transition: border-color 0.15s, box-shadow 0.15s;
    max-width: 400px;
}
.search-box:focus-within {
    border-color: #cd322c;
    box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.08);
}
.search-box i {
    color: #9ca3af;
    font-size: 16px;
    flex-shrink: 0;
}
.search-box input {
    border: none;
    outline: none;
    padding: 8px 0;
    font-size: 13px;
    flex: 1;
    background: transparent;
    color: #111827;
}
.search-box input::placeholder {
    color: #9ca3af;
}
.search-clear {
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 4px;
    display: flex;
    align-items: center;
    border-radius: 4px;
}
.search-clear:hover {
    color: #4b5563;
    background: #f3f4f6;
}
.filter-row {
    display: flex;
    align-items: flex-end;
    gap: 12px;
    flex-wrap: wrap;
}
.form-group.inline {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.form-group.inline label {
    font-size: 11.5px;
    font-weight: 600;
    color: #4b5563;
}
.form-group.inline select,
.form-group.inline input {
    padding: 7px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 12.5px;
    outline: none;
    background: #fff;
    color: #111827;
    transition: border-color 0.15s, box-shadow 0.15s;
}
.form-group.inline select:focus,
.form-group.inline input:focus {
    border-color: #cd322c;
    box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.08);
}

/* ── Botones ───────────────────────────────────────────────────────────── */
.tb-btn {
    padding: 8px 16px;
    border-radius: 6px;
    border: 1px solid transparent;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.15s;
}
.tb-btn.primary {
    background: #cd322c;
    color: #fff;
    border-color: #cd322c;
}
.tb-btn.primary:hover {
    background: #a52420;
}
.tb-btn.outline {
    background: white;
    color: #4b5563;
    border-color: #d1d5db;
}
.tb-btn.outline:hover {
    background: #f9fafb;
    color: #111827;
}
.tb-btn.sm {
    padding: 6px 12px;
    font-size: 12px;
}
.tb-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* ── Tabla ─────────────────────────────────────────────────────────────── */
.table-responsive {
    width: 100%;
    overflow-x: auto;
    padding: 16px;
}
.mini {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}
.mini th {
    text-align: left;
    padding: 8px 10px;
    color: var(--color-text-tertiary, #6b7280);
    font-weight: 500;
    font-size: 12px;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
}
.mini td {
    padding: 10px;
    border-bottom: 0.5px solid #e5e7eb;
    color: var(--color-text-primary, #111827);
    vertical-align: middle;
}
.table-row:hover {
    background: var(--color-background-secondary, #f9fafb);
}
.row-unread {
    background: #fffdf5;
}
.row-unread:hover {
    background: #fef9ec;
}
.row-unread .asunto-cell {
    font-weight: 600;
}
.email-cell {
    color: var(--color-text-tertiary, #6b7280);
}
.mono {
    font-family: monospace;
    font-size: 12px;
    color: #4b5563;
    white-space: nowrap;
}
.nowrap {
    white-space: nowrap;
}
.asunto-cell {
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.remitente-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
}

/* ── Pills ─────────────────────────────────────────────────────────────── */
.status-pill {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 600;
    display: inline-block;
    text-transform: capitalize;
    white-space: nowrap;
}
.sp-activo {
    background: #eaf3de;
    color: #3b6d11;
}
.sp-baja {
    background: #fee2e2;
    color: #991b1b;
}
.sp-rol {
    background: #e0f2fe;
    color: #0369a1;
}
.sp-leido {
    background: #f3f4f6;
    color: #4b5563;
}
.sp-pendiente {
    background: #fef3c7;
    color: #92400e;
}

/* ── Acciones ──────────────────────────────────────────────────────────── */
.action-cell {
    text-align: right;
    width: 90px;
    vertical-align: middle;
}
.action-buttons {
    display: flex;
    flex-direction: row;
    gap: 4px;
    justify-content: flex-end;
    align-items: center;
}
.icon-btn {
    width: 30px;
    height: 30px;
    min-width: 30px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    color: #4b5563;
    font-size: 15px;
    line-height: 1;
    padding: 0;
}
.icon-btn i {
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
}
.icon-btn:hover {
    background: #f3f4f6;
}
.icon-btn.check:hover {
    background: #eaf3de;
    border-color: #bbf7d0;
    color: #3b6d11;
}
.icon-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* ── Banners / estados ─────────────────────────────────────────────────── */
.error-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fef2f2;
    border: 1px solid #fee2e2;
    color: #991b1b;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    margin-right: auto;
}
.empty-state {
    padding: 40px 20px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

/* ── Responsive ────────────────────────────────────────────────────────── */
@media (max-width: 700px) {
    .stat-cards {
        grid-template-columns: 1fr;
    }
}
</style>
