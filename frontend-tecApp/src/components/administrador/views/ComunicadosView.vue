<template>
    <div class="comunicados-wrapper">
        <div v-if="vistaActiva === 'lista'" class="search-bar-wrapper">
            <div class="search-box">
                <i class="ti ti-search"></i>
                <input v-model="searchText" type="text" placeholder="Buscar comunicado por título o destino..." aria-label="Buscar comunicados" />
                <button v-if="searchText" class="search-clear" @click="searchText = ''; goToPage(1)" aria-label="Limpiar búsqueda"><i class="ti ti-x"></i></button>
            </div>
            <button class="tb-btn outline sm exportar-btn" @click="exportarComunicados">
                <i class="ti ti-download" aria-hidden="true"></i> Exportar
            </button>
        </div>

        <div v-if="vistaActiva === 'lista'" class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-speakerphone" aria-hidden="true"></i>
                    Gestión de Comunicados
                </div>
                <button @click="cambiarVista('crear')" class="tb-btn primary sm">
                    <i class="ti ti-plus" aria-hidden="true"></i> Nuevo
                </button>
            </div>

            <div class="table-responsive">
                <DataTable
                    :columnas="columnasComunicados"
                    :filas="paginatedData"
                    clave-fila="id_comunicado"
                    :total="totalItems"
                    :pagina="currentPage"
                    :por-pagina="pageSize"
                    :orden-key="sortKey"
                    :orden-dir="sortDir"
                    :cargando="cargando"
                    texto-carga="Cargando comunicados..."
                    :error="errorCarga"
                    etiqueta="Listado de comunicados"
                    icono-vacio="ti-speakerphone"
                    :busqueda-activa="!!searchText"
                    @ordenar="toggleSort"
                    @pagina="goToPage"
                    @por-pagina="setPageSize"
                    @reintentar="fetchComunicados"
                >
                    <template #celda-titulo="{ fila: comunicado }">
                        <strong>{{ comunicado.titulo }}</strong>
                    </template>
                    <template #celda-destino="{ fila: comunicado }">
                        <span style="text-transform: capitalize">
                            {{ comunicado.destino }}
                        </span>
                    </template>
                    <template #celda-importancia="{ fila: comunicado }">
                        <span :class="[
                            'status-pill',
                            claseImportancia(
                                comunicado.importancia,
                            ),
                        ]">
                            {{ comunicado.importancia }}
                        </span>
                    </template>
                    <template #celda-fecha_publicacion="{ fila: comunicado }">
                        {{
                            formatearFecha(comunicado.fecha_publicacion)
                        }}
                    </template>
                    <template #acciones="{ fila: comunicado }">
                        <div class="action-buttons">
                            <button @click="
                                cambiarVista('detalles', comunicado)
                                " class="icon-btn view" title="Ver detalles">
                                <i class="ti ti-eye"></i>
                            </button>
                            <button @click="
                                cambiarVista('editar', comunicado)
                                " class="icon-btn edit" title="Editar">
                                <i class="ti ti-edit"></i>
                            </button>
                            <button @click="pedirConfirmacion(comunicado)" class="icon-btn delete"
                                title="Eliminar">
                                <i class="ti ti-trash"></i>
                            </button>
                        </div>
                    </template>
                    <template #vacio>
                        <i class="ti ti-speakerphone" style="font-size: 28px; opacity: 0.4"></i>
                        <p v-if="searchText">No se encontraron comunicados que coincidan con "{{ searchText }}".</p>
                        <p v-else>No hay comunicados registrados todavía.</p>
                    </template>
                </DataTable>
            </div>
        </div>

        <div v-if="vistaActiva === 'detalles' && comunicadoSeleccionado" class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-info-circle"></i> Detalle del Comunicado
                </div>
                <button @click="cambiarVista('lista')" class="icon-btn" aria-label="Volver">
                    <i class="ti ti-arrow-left"></i>
                </button>
            </div>

            <div class="card-body details-view">
                <div class="detail-grid">
                    <div class="detail-item" style="grid-column: 1 / -1">
                        <span class="detail-label">Título</span>
                        <span class="detail-value" style="font-size: 1.1em; font-weight: bold">
                            {{ comunicadoSeleccionado.titulo }}
                        </span>
                    </div>

                    <div class="detail-item" style="grid-column: 1 / -1">
                        <span class="detail-label">Mensaje</span>
                        <div class="detail-value" style="
                                background: #f8f9fa;
                                padding: 12px;
                                border-radius: 6px;
                                white-space: pre-wrap;
                                border: 1px solid #eee;
                            ">
                            {{ comunicadoSeleccionado.mensaje }}
                        </div>
                    </div>

                    <div class="detail-item">
                        <span class="detail-label">Importancia</span>
                        <span :class="[
                            'status-pill',
                            claseImportancia(
                                comunicadoSeleccionado.importancia,
                            ),
                        ]" style="width: fit-content">
                            {{ comunicadoSeleccionado.importancia }}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Destino</span>
                        <span class="detail-value" style="text-transform: capitalize">
                            {{ comunicadoSeleccionado.destino }} <span v-if="comunicadoSeleccionado.destino === 'curso'">- {{ comunicadoSeleccionado.curso_destino }}</span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha de Publicación</span>
                        <span class="detail-value">
                            {{
                                formatearFecha(
                                    comunicadoSeleccionado.fecha_publicacion,
                                )
                            }}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Autor</span>
                        <span class="detail-value">
                            {{ nombreAutor(comunicadoSeleccionado.autor_id) }}
                        </span>
                    </div>
                </div>
            </div>

            <div class="card-footer">
                <button @click="cambiarVista('lista')" class="tb-btn outline">
                    Cerrar
                </button>
                <button @click="cambiarVista('editar', comunicadoSeleccionado)" class="tb-btn primary">
                    <i class="ti ti-edit"></i> Editar
                </button>
            </div>
        </div>

        <div v-if="['crear', 'editar'].includes(vistaActiva)" class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i :class="vistaActiva === 'crear'
                        ? 'ti ti-plus'
                        : 'ti ti-edit'
                        "></i>
                    {{
                        vistaActiva === "crear"
                            ? "Nuevo Comunicado"
                            : "Editar Comunicado"
                    }}
                </div>
                <button @click="cambiarVista('lista')" class="icon-btn" aria-label="Volver">
                    <i class="ti ti-arrow-left"></i>
                </button>
            </div>

            <form @submit.prevent="guardarComunicado" class="form-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Título del Comunicado</label>
                        <input ref="primerInputRef" v-model="form.titulo" type="text" placeholder="Ej: Suspensión de clases por desinfección"
                            required />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Mensaje</label>
                        <textarea v-model="form.mensaje" rows="5" placeholder="Escriba el cuerpo del comunicado aquí..."
                            required></textarea>
                    </div>
                </div>

                <div class="form-row triple">
                    <div class="form-group">
                        <label>Importancia</label>
                        <select v-model="form.importancia" required>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Destino</label>
                        <select v-model="form.destino" required>
                            <option value="todos">Todos</option>
                            <option value="profesores">Profesores</option>
                            <option value="alumnos">Alumnos</option>
                            <option value="autoridades">Autoridades</option>
                            <option value="curso">Curso Específico</option>
                        </select>
                    </div>
                    <div class="form-group" v-if="form.destino === 'curso'">
                        <label>Curso Destino</label>
                        <select v-model="form.curso_destino" required>
                            <option value="" disabled>Seleccione un curso...</option>
                            <option
                                v-for="curso in cursosDisponibles"
                                :key="curso.id_curso || curso.id"
                                :value="curso.nombre_curso"
                            >
                                {{ curso.nombre_curso }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Autor</label>
                        <select v-model="form.autor_id">
                            <option :value="null">Sistema (sin autor)</option>
                            <option
                                v-for="(nombre, id) in mapaAutores"
                                :key="id"
                                :value="Number(id)"
                            >
                                {{ nombre }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="card-footer" style="
                        padding: 14px 0 0 0;
                        border: none;
                        background: transparent;
                    ">
                    <div v-if="errorGuardar" class="error-banner">
                        <i class="ti ti-alert-circle"></i> {{ errorGuardar }}
                    </div>
                    <div v-if="exitoGuardar" class="exito-banner">
                        <i class="ti ti-check"></i> Comunicado guardado
                        correctamente.
                    </div>

                    <button type="button" @click="cambiarVista('lista')" class="tb-btn outline">
                        Cancelar
                    </button>
                    <button type="submit" class="tb-btn primary" :disabled="guardando">
                        <i class="ti ti-loader animate-spin" v-if="guardando"></i>
                        {{
                            guardando
                                ? "Guardando..."
                                : vistaActiva === "crear"
                                    ? "Publicar comunicado"
                                    : "Actualizar comunicado"
                        }}
                    </button>
                </div>
            </form>
        </div>

        <Modal v-model="modalEliminarAbierto" title="Eliminar Comunicado" variante="danger">
            <p class="modal-texto">
                ¿Seguro que querés eliminar el comunicado
                <strong>"{{ comunicadoAEliminar?.titulo }}"</strong
                > (destino: {{ comunicadoAEliminar?.destino }}, importancia: {{ comunicadoAEliminar?.importancia }})? Esta acción no se puede deshacer y los destinatarios ya no podrán verlo.
            </p>

            <div v-if="errorEliminar" class="error-banner" style="
                    margin-bottom: 16px;
                    width: 100%;
                    box-sizing: border-box;
                ">
                <i class="ti ti-alert-circle"></i> {{ errorEliminar }}
            </div>

            <template #footer>
                <button class="tb-btn outline" @click="modalEliminarAbierto = false">
                    Cancelar
                </button>
                <button class="tb-btn danger" @click="confirmarEliminar" :disabled="eliminando">
                    <i class="ti ti-loader animate-spin" v-if="eliminando"></i>
                    {{ eliminando ? "Eliminando..." : "Sí, eliminar" }}
                </button>
            </template>
        </Modal>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import Modal from "../../ui/Modal.vue";
import { toast } from "../../../services/toast-service.js";
import { exportarCsv } from "../../../utils/exportCsv.js";
// IMPORTANTE: Ajustá esta ruta al archivo de servicios que estés utilizando para los comunicados.
import {
    obtenerTodosComunicados,
    crearComunicado,
    actualizarComunicado,
    eliminarComunicado,
} from "../../../services/comunidad-service.js";
import { obtenerCursos } from "../../../services/academico-service.js";
import { obtenerUsuarios } from "../../../services/usuarios-services.js";
import { useTableControls } from "../../../composables/useTableControls.js";
import DataTable from "../../ui/DataTable.vue";

// ── Estado ──────────────────────────────────────────────────────────────────
const comunicados = ref([]);
const cursosDisponibles = ref([]);
const mapaAutores = ref({});
const cargando = ref(false);
const guardando = ref(false);
const eliminando = ref(false);
const vistaActiva = ref("lista"); // 'lista' | 'crear' | 'editar' | 'detalles'
const comunicadoSeleccionado = ref(null);
const comunicadoAEliminar = ref(null);
const modalEliminarAbierto = ref(false);

const errorCarga = ref("");
const errorGuardar = ref("");
const exitoGuardar = ref(false);
const errorEliminar = ref("");

const formVacio = () => ({
    id_comunicado: null,
    titulo: "",
    mensaje: "",
    importancia: "media",
    destino: "todos",
    curso_destino: "",
    autor_id: null,
});

const form = ref(formVacio());

// ── Filtros y Paginación ────────────────────────────────────────────────
const filterFn = (item, q) => {
    const texto = `${item.titulo} ${item.destino} ${item.importancia} ${item.mensaje || ""}`.toLowerCase();
    return texto.includes(q);
};
const {
    searchText,
    currentPage,
    pageSize,
    sortKey,
    sortDir,
    filteredData,
    paginatedData,
    totalItems,
    goToPage,
    setPageSize,
    toggleSort,
} = useTableControls(comunicados, { pageSize: 10, filterFn });

// ── Columnas del DataTable ─────────────────────────────────────────────────
const columnasComunicados = [
    { key: "titulo", titulo: "Título", ordenable: true },
    { key: "destino", titulo: "Destino", ordenable: true },
    { key: "importancia", titulo: "Importancia", ordenable: true },
    { key: "fecha_publicacion", titulo: "Fecha de Publicación", ordenable: true },
    { key: "__acciones", titulo: "Acciones" },
];

// ── Exportación CSV ──────────────────────────────────────────────────────────
const exportarComunicados = () => {
    try {
        exportarCsv(filteredData.value, {
            nombreArchivo: "comunicados",
            columnas: {
                Titulo: "titulo",
                Destino: "destino",
                Importancia: "importancia",
                Fecha: "fecha_publicacion",
            },
        });
        toast.success("Listado de comunicados exportado.");
    } catch (e) {
        toast.error(e?.message || "No se pudo exportar el listado.");
    }
};

// ── Refs para autofocus ──────────────────────────────────────────────
const primerInputRef = ref(null);

// ── Helpers ──────────────────────────────────────────────────────────────────
const claseImportancia = (importancia) => {
    switch (importancia) {
        case "alta":
            return "sp-alta";
        case "media":
            return "sp-media";
        case "baja":
            return "sp-baja";
        default:
            return "";
    }
};

const formatearFecha = (fecha) => {
    if (!fecha) return "Sin fecha";
    const opciones = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    };
    return new Date(fecha).toLocaleString("es-AR", opciones);
};

const nombreAutor = (autorId) => {
    if (autorId == null || autorId === "") return "Sistema";
    return mapaAutores.value[autorId] || `ID ${autorId}`;
};

// ── Navegación entre vistas ──────────────────────────────────────────────────
const cambiarVista = (nuevaVista, comunicado = null) => {
    vistaActiva.value = nuevaVista;
    errorGuardar.value = "";
    exitoGuardar.value = false;

    if (nuevaVista === "editar" && comunicado) {
        form.value = { ...comunicado };
    } else if (nuevaVista === "crear") {
        form.value = formVacio();
        nextTick(() => primerInputRef.value?.focus());
    } else if (nuevaVista === "detalles" && comunicado) {
        comunicadoSeleccionado.value = comunicado;
    }
};

// ── CRUD ─────────────────────────────────────────────────────────────────────
const fetchComunicados = async () => {
    cargando.value = true;
    errorCarga.value = "";
    try {
        const res = await obtenerTodosComunicados();
        const data = res?.data || res;
        comunicados.value = Array.isArray(data) ? data : [];
    } catch (error) {
        errorCarga.value =
            error?.response?.data?.message ||
            error?.response?.data?.mensaje ||
            error?.message ||
            "Error crítico al listar comunicados.";
    } finally {
        cargando.value = false;
    }
};

const guardarComunicado = async () => {
    errorGuardar.value = "";
    exitoGuardar.value = false;
    guardando.value = true;

    try {
        const payload = { ...form.value };

        if (payload.destino !== "curso") payload.curso_destino = null;
        if (!payload.autor_id) payload.autor_id = null;

        // Limpiamos id_comunicado para crear
        if (vistaActiva.value === "crear") {
            delete payload.id_comunicado;
            await crearComunicado(payload);
        } else {
            await actualizarComunicado(payload.id_comunicado, payload);
        }

        exitoGuardar.value = true;
        toast.success(
            vistaActiva.value === "crear"
                ? "Comunicado publicado correctamente."
                : "Comunicado actualizado correctamente.",
        );
        await fetchComunicados();
        cambiarVista("lista");
    } catch (e) {
        errorGuardar.value =
            e?.response?.data?.mensaje ||
            e?.response?.data ||
            "Error al guardar el comunicado. Intentá de nuevo.";
    } finally {
        guardando.value = false;
    }
};

const pedirConfirmacion = (comunicado) => {
    comunicadoAEliminar.value = comunicado;
    errorEliminar.value = "";
    modalEliminarAbierto.value = true;
};

const fetchCursos = async () => {
    try {
        const res = await obtenerCursos();
        const data = res?.data || res;
        cursosDisponibles.value = Array.isArray(data) ? data : data?.data || [];
    } catch {
        cursosDisponibles.value = [];
    }
};

const fetchAutores = async () => {
    try {
        const res = await obtenerUsuarios();
        const lista = res?.data?.data ?? res?.data ?? [];
        const mapa = {};
        if (Array.isArray(lista)) {
            for (const u of lista) {
                const id = u.id_usuario ?? u.id;
                if (id != null) {
                    mapa[id] =
                        `${u.nombre || ""} ${u.apellido || ""}`.trim() ||
                        u.email ||
                        `ID ${id}`;
                }
            }
        }
        mapaAutores.value = mapa;
    } catch {
        mapaAutores.value = {};
    }
};

const confirmarEliminar = async () => {
    eliminando.value = true;
    errorEliminar.value = "";

    try {
        await eliminarComunicado(comunicadoAEliminar.value.id_comunicado);
        comunicados.value = comunicados.value.filter(
            (c) => c.id_comunicado !== comunicadoAEliminar.value.id_comunicado,
        );
        modalEliminarAbierto.value = false;
        comunicadoAEliminar.value = null;
        toast.success("El comunicado fue eliminado correctamente.");
    } catch (e) {
        errorEliminar.value =
            "Ocurrió un error inesperado al eliminar el comunicado.";
    } finally {
        eliminando.value = false;
    }
};

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
    fetchComunicados();
    fetchCursos();
    fetchAutores();
});
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.22s ease-in-out;
}

.animate-spin {
    animation: spin 0.85s linear infinite;
    display: inline-block;
}

.noticias-wrapper {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 950px;
    width: 100%;
}

.metric-card {
    background: var(--color-background-secondary, #fff);
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
}

/* ── Tarjetas Base ── */
.card {
    background: var(--color-background-primary, #fff);
    border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 8px;
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

.card-body {
    padding: 20px;
}

.card-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
}

.card-title {
    font-size: 13.5px;
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

/* ── Botones ── */
.tb-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    border: 1px solid transparent;
    font-family: inherit;
}

.tb-btn.sm {
    padding: 6px 12px;
    font-size: 12px;
}

.tb-btn.primary {
    background-color: #cd322c;
    color: white;
}

.tb-btn.primary:hover:not(:disabled) {
    background-color: #b52b25;
}

.tb-btn.outline {
    background-color: transparent;
    border-color: #d1d5db;
    color: #374151;
}

.tb-btn.outline:hover:not(:disabled) {
    background-color: #f3f4f6;
}

.tb-btn.danger {
    background-color: #ef4444;
    color: white;
}

.tb-btn.danger:hover:not(:disabled) {
    background-color: #dc2626;
}

.icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: #6b7280;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
}

.icon-btn:hover {
    background: #f3f4f6;
    color: #111827;
}

.icon-btn.view:hover {
    color: #3b82f6;
    background: #eff6ff;
}

.icon-btn.edit:hover {
    color: #eab308;
    background: #fefce8;
}

.icon-btn.delete:hover {
    color: #ef4444;
    background: #fef2f2;
}

/* ── Toolbar de búsqueda ─────────────────────────────────────────────────── */
.search-bar-wrapper {
    margin-bottom: 12px;
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

/* ── Banners y Alertas ── */
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
    color: #6b7280;
    gap: 8px;
    font-size: 13.5px;
}

.error-banner,
.exito-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
}

.error-banner {
    background: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
}

.exito-banner {
    background: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
}

/* ── Tablas ── */
.status-pill {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 600;
    display: inline-block;
    text-transform: capitalize;
    white-space: nowrap;
}
.sp-alta {
    background: #fee2e2;
    color: #991b1b;
}
.sp-media {
    background: #fef3c7;
    color: #92400e;
}
.sp-baja {
    background: #e0f2fe;
    color: #0369a1;
}
.table-responsive {
    width: 100%;
    overflow-x: auto;
    padding: 12px;
}

.mini {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
}

.mini th {
    text-align: left;
    padding: 8px 10px;
    color: #6b7280;
    font-weight: 500;
    font-size: 11.5px;
    border-bottom: 1px solid #e5e7eb;
}

.mini td {
    padding: 9px 10px;
    border-bottom: 0.5px solid #e5e7eb;
    color: #111827;
    vertical-align: middle;
}

.table-row:hover {
    background: #f9fafb;
}

.mono {
    font-family: monospace;
    font-size: 11.5px;
    color: #4b5563;
}

.action-cell {
    text-align: right;
    width: 130px;
}

.action-buttons {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
}

/* ── Thumbnail de Noticias ── */
.noticia-titulo-cell {
    display: flex;
    align-items: center;
    gap: 10px;
}

.thumb {
    width: 40px;
    height: 40px;
    object-fit: cover;
    border-radius: 5px;
    flex-shrink: 0;
    border: 1px solid #e5e7eb;
}

.fallback-thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f3f4f6;
    color: #9ca3af;
    font-size: 18px;
}

/* ── Vista de Detalles ── */
.details-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.fallback-detail {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 24px;
    background: #f9fafb;
    border: 1px dashed #e5e7eb;
    border-radius: 8px;
    color: #9ca3af;
    font-size: 12px;
    margin-bottom: 4px;
}

.fallback-detail i {
    font-size: 24px;
}

.imagen-preview-container {
    width: 100%;
}

.imagen-preview img {
    width: 100%;
    max-height: 350px;
    object-fit: cover;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
}

.detail-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    background: #ffffff;
    padding: 16px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.detail-label {
    font-size: 11px;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    font-weight: 600;
}

/* ── Formularios ── */
.form-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.form-group label {
    font-size: 12.5px;
    font-weight: 500;
    color: #374151;
}

.required {
    color: #ef4444;
}

input[type="text"],
input[type="date"],
textarea {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13.5px;
    font-family: inherit;
    transition: all 0.2s;
    outline: none;
    box-sizing: border-box;
}

input:focus,
textarea:focus {
    border-color: #cd322c;
    box-shadow: 0 0 0 3px rgba(205, 50, 44, 0.1);
}

.input-error {
    border-color: #ef4444 !important;
}

.field-error {
    font-size: 11px;
    color: #ef4444;
}

.textarea-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 4px;
}

.char-count {
    font-size: 11px;
    color: #6b7280;
    margin-left: auto;
}

.char-limit {
    color: #ef4444;
    font-weight: bold;
}

/* ── Subida de Archivos (Drag & Drop) ── */
.file-upload-area {
    border: 2px dashed #d1d5db;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    cursor: pointer;
    background: #f9fafb;
    transition: all 0.2s;
}

.file-upload-area:hover {
    border-color: #cd322c;
    background: #fef2f2;
}

.file-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #6b7280;
    font-size: 13px;
}

.imagen-preview-form {
    position: relative;
    display: inline-block;
}

.imagen-preview-form img {
    max-height: 180px;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.btn-quitar-imagen {
    position: absolute;
    top: -10px;
    right: -10px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* ── Modal de Confirmación ── */
.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(17, 24, 39, 0.6);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
}

.modal-card {
    background: white;
    border-radius: 8px;
    width: 100%;
    max-width: 450px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    overflow: hidden;
}

.modal-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
}

.modal-body {
    padding: 20px;
    margin: 0;
    font-size: 14px;
    color: #4b5563;
    line-height: 1.5;
}

.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    background: #f9fafb;
    border-top: 1px solid #e5e7eb;
}

@media (max-width: 768px) {
    .metrics {
        grid-template-columns: 1fr;
    }

    .form-row,
    .detail-grid {
        grid-template-columns: 1fr;
    }

    .form-group[style*="grid-column: span 2"] {
        grid-column: span 1 !important;
    }
}
</style>
