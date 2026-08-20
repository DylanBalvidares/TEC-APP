<template>
    <div class="noticias-wrapper">
        <div v-if="vistaActiva === 'lista'" class="metrics animate-fade-in">
            <div class="metric-card">
                <div class="metric-label">
                    <i class="ti ti-article" aria-hidden="true"></i>Total
                    Noticias
                </div>
                <div class="metric-value">{{ noticias.length }}</div>
                <span class="metric-badge badge-green">
                    <i class="ti ti-check"></i>Publicadas
                </span>
            </div>
            <div class="metric-card">
                <div class="metric-label">
                    <i class="ti ti-broadcast" aria-hidden="true"></i>Alcance
                </div>
                <div class="metric-value">Comunidad</div>
                <span class="metric-badge badge-gray">Visible para todos</span>
            </div>
        </div>

        <!-- ── LISTA ─────────────────────────────────────────────────────── -->
        <div v-if="vistaActiva === 'lista'" class="search-bar-wrapper">
            <div class="search-box">
                <i class="ti ti-search"></i>
                <input v-model="searchText" type="text" placeholder="Buscar noticia por título..." aria-label="Buscar noticias" />
                <button v-if="searchText" class="search-clear" @click="searchText = ''; goToPage(1)" aria-label="Limpiar búsqueda"><i class="ti ti-x"></i></button>
            </div>
        </div>

        <div
            v-if="vistaActiva === 'lista'"
            class="card animate-fade-in"
            style="margin-top: 0"
        >
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-news" aria-hidden="true"></i>
                    Tablón de Anuncios
                </div>
                <button
                    @click="cambiarVista('crear')"
                    class="tb-btn primary sm"
                >
                    <i class="ti ti-plus" aria-hidden="true"></i> Nueva Noticia
                </button>
            </div>

            <div class="table-responsive">
                <div v-if="cargando" class="empty-state">
                    <i
                        class="ti ti-loader animate-spin"
                        style="font-size: 24px; color: #cd322c"
                    ></i>
                    <p>Cargando noticias de la comunidad...</p>
                </div>

                <div
                    v-else-if="errorCarga"
                    class="error-banner"
                    style="margin: 16px"
                >
                    <i class="ti ti-alert-circle"></i> {{ errorCarga }}
                    <button
                        class="tb-btn sm outline"
                        @click="fetchNoticias"
                        style="margin-left: auto"
                    >
                        Reintentar
                    </button>
                </div>

                <template v-else-if="filteredData.length > 0">
                    <table
                        class="mini"
                        aria-label="Listado de noticias"
                    >
                        <thead>
                            <tr>
                                <th>Título del Comunicado</th>
                                <th>Fecha</th>
                                <th class="action-cell">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="noticia in paginatedData"
                                :key="noticia.id_noticia"
                            class="table-row"
                        >
                            <td>
                                <div class="noticia-titulo-cell">
                                    <img
                                        v-if="noticia.imagen_url"
                                        :src="noticia.imagen_url"
                                        class="thumb"
                                        :alt="noticia.titulo"
                                    />
                                    <div v-else class="thumb fallback-thumb">
                                        <i class="ti ti-photo-off"></i>
                                    </div>
                                    <strong>{{ noticia.titulo }}</strong>
                                </div>
                            </td>
                            <td class="mono">
                                {{ formatearFecha(noticia.fecha) }}
                            </td>
                            <td class="action-cell">
                                <div class="action-buttons">
                                    <button
                                        @click="
                                            cambiarVista('detalles', noticia)
                                        "
                                        class="icon-btn view"
                                        title="Leer noticia completa"
                                    >
                                        <i class="ti ti-eye"></i>
                                    </button>
                                    <button
                                        @click="cambiarVista('editar', noticia)"
                                        class="icon-btn edit"
                                        title="Editar comunicado"
                                    >
                                        <i class="ti ti-edit"></i>
                                    </button>
                                    <button
                                        @click="pedirConfirmacion(noticia)"
                                        class="icon-btn delete"
                                        title="Eliminar"
                                    >
                                        <i class="ti ti-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
                        </template>

                        <div v-else class="empty-state">
                            <i
                                class="ti ti-notes-off"
                                style="font-size: 28px; opacity: 0.4"
                            ></i>
                            <p v-if="searchText">No se encontraron noticias que coincidan con "{{ searchText }}".</p>
                            <p v-else>No hay noticias ni comunicados publicados actualmente.</p>
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

        <!-- ── DETALLES ───────────────────────────────────────────────────── -->
        <div
            v-if="vistaActiva === 'detalles' && noticiaSeleccionada"
            class="card animate-fade-in"
        >
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-file-text"></i>
                    Comunicado Institucional
                </div>
                <button
                    @click="cambiarVista('lista')"
                    class="icon-btn"
                    aria-label="Volver"
                >
                    <i class="ti ti-arrow-left"></i>
                </button>
            </div>

            <div class="card-body details-view">
                <div class="imagen-preview-container">
                    <div
                        v-if="noticiaSeleccionada.imagen_url"
                        class="imagen-preview"
                    >
                        <img
                            :src="noticiaSeleccionada.imagen_url"
                            :alt="noticiaSeleccionada.titulo"
                        />
                    </div>
                    <div v-else class="fallback-detail">
                        <i class="ti ti-photo-off"></i>
                        <span>Comunicado sin imagen adjunta</span>
                    </div>
                </div>

                <div class="detail-grid">
                    <div class="detail-item" style="grid-column: span 2">
                        <span class="detail-label">Título del Comunicado</span>
                        <span
                            class="detail-value"
                            style="font-size: 16px; font-weight: 600"
                        >
                            {{ noticiaSeleccionada.titulo }}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha de Publicación</span>
                        <span class="detail-value mono">{{
                            formatearFecha(noticiaSeleccionada.fecha)
                        }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">ID Noticia</span>
                        <span class="detail-value mono"
                            >#{{ noticiaSeleccionada.id_noticia }}</span
                        >
                    </div>
                </div>

                <div
                    class="info-box"
                    style="
                        background: #f9fafb;
                        border-color: #e5e7eb;
                        color: #374151;
                        display: block;
                    "
                >
                    <span
                        class="detail-label"
                        style="display: block; margin-bottom: 8px"
                        >Cuerpo del mensaje:</span
                    >
                    <p style="white-space: pre-wrap; font-size: 13.5px">
                        {{ noticiaSeleccionada.contenido }}
                    </p>
                </div>
            </div>

            <div class="card-footer">
                <button @click="cambiarVista('lista')" class="tb-btn outline">
                    Volver al listado
                </button>
                <button
                    @click="cambiarVista('editar', noticiaSeleccionada)"
                    class="tb-btn primary"
                >
                    <i class="ti ti-edit"></i> Editar Noticia
                </button>
            </div>
        </div>

        <!-- ── CREAR / EDITAR ─────────────────────────────────────────────── -->
        <div
            v-if="['crear', 'editar'].includes(vistaActiva)"
            class="card animate-fade-in"
        >
            <div class="card-header">
                <div class="card-title">
                    <i
                        :class="
                            vistaActiva === 'crear'
                                ? 'ti ti-file-plus'
                                : 'ti ti-edit'
                        "
                    ></i>
                    {{
                        vistaActiva === "crear"
                            ? "Redactar Nueva Noticia"
                            : "Modificar Noticia"
                    }}
                </div>
                <button
                    @click="cambiarVista('lista')"
                    class="icon-btn"
                    aria-label="Volver"
                >
                    <i class="ti ti-arrow-left"></i>
                </button>
            </div>

            <form @submit.prevent="guardarNoticia" class="form-body">
                <!-- Título -->
                <div class="form-row">
                    <div class="form-group" style="grid-column: span 2">
                        <label for="titulo">
                            Título del Comunicado
                            <span class="required">*</span>
                        </label>
                        <input
                            id="titulo"
                            ref="primerInputRef"
                            v-model="form.titulo"
                            type="text"
                            placeholder="Ej: Inscripciones abiertas ciclo lectivo..."
                            :class="{ 'input-error': erroresForm.titulo }"
                            @blur="validarCampo('titulo')"
                            required
                        />
                        <span v-if="erroresForm.titulo" class="field-error">{{
                            erroresForm.titulo
                        }}</span>
                    </div>
                </div>

                <!-- FIX: campo fecha agregado — faltaba en el template original -->
                <div class="form-row">
                    <div class="form-group">
                        <label for="fecha">
                            Fecha de Publicación <span class="required">*</span>
                        </label>
                        <input
                            id="fecha"
                            v-model="form.fecha"
                            type="text"
                            placeholder="DD/MM/AAAA"
                            :class="{ 'input-error': erroresForm.fecha }"
                            @blur="validarCampo('fecha')"
                            required
                        />
                        <span v-if="erroresForm.fecha" class="field-error">{{
                            erroresForm.fecha
                        }}</span>
                    </div>
                </div>

                <!-- Imagen -->
                <div class="form-row">
                    <div class="form-group" style="grid-column: span 2">
                        <label>Imagen del Comunicado (Opcional)</label>
                        <div
                            class="file-upload-area"
                            @click="$refs.inputImagen.click()"
                            @dragover.prevent
                            @drop.prevent="manejarDrop"
                        >
                            <input
                                ref="inputImagen"
                                type="file"
                                accept="image/*"
                                style="display: none"
                                @change="manejarArchivo"
                            />
                            <div
                                v-if="imagenPreview"
                                class="imagen-preview-form"
                            >
                                <img :src="imagenPreview" alt="Preview" />
                                <button
                                    type="button"
                                    class="btn-quitar-imagen"
                                    @click.stop="quitarImagen"
                                >
                                    ✕
                                </button>
                            </div>
                            <div v-else class="file-placeholder">
                                <i
                                    class="ti ti-photo-up"
                                    style="font-size: 22px; opacity: 0.4"
                                ></i>
                                <span
                                    >Hacé clic o arrastrá una imagen aquí</span
                                >
                                <span style="font-size: 11px; opacity: 0.5"
                                    >PNG, JPG, WEBP — máximo 5MB</span
                                >
                            </div>
                        </div>
                        <span v-if="erroresForm.imagen" class="field-error">{{
                            erroresForm.imagen
                        }}</span>
                    </div>
                </div>

                <!-- Contenido -->
                <div class="form-row">
                    <div class="form-group" style="grid-column: span 2">
                        <label for="contenido">
                            Contenido del Mensaje
                            <span class="required">*</span>
                        </label>
                        <textarea
                            id="contenido"
                            v-model="form.contenido"
                            rows="6"
                            placeholder="Redactá el cuerpo de la noticia aquí..."
                            :class="{ 'input-error': erroresForm.contenido }"
                            @blur="validarCampo('contenido')"
                            required
                        ></textarea>
                        <div class="textarea-footer">
                            <span
                                v-if="erroresForm.contenido"
                                class="field-error"
                                >{{ erroresForm.contenido }}</span
                            >
                            <span
                                class="char-count"
                                :class="{
                                    'char-limit': form.contenido.length > 4800,
                                }"
                            >
                                {{ form.contenido.length }} / 5000
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Footer -->
                <div
                    class="card-footer"
                    style="
                        padding: 14px 0 0 0;
                        border: none;
                        background: transparent;
                    "
                >
                    <div v-if="errorGuardar" class="error-banner">
                        <i class="ti ti-alert-circle"></i> {{ errorGuardar }}
                    </div>
                    <div v-if="exitoGuardar" class="exito-banner">
                        <i class="ti ti-check"></i>
                        {{
                            vistaActiva === "crear"
                                ? "Noticia publicada correctamente."
                                : "Cambios guardados."
                        }}
                    </div>
                    <button
                        type="button"
                        @click="cambiarVista('lista')"
                        class="tb-btn outline"
                        :disabled="guardando"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        class="tb-btn primary"
                        :disabled="guardando || !formularioValido"
                    >
                        <i
                            class="ti ti-loader animate-spin"
                            v-if="guardando"
                        ></i>
                        {{
                            guardando
                                ? "Publicando..."
                                : vistaActiva === "crear"
                                  ? "Publicar Noticia"
                                  : "Guardar Cambios"
                        }}
                    </button>
                </div>
            </form>
        </div>

        <!-- ── MODAL ELIMINAR ─────────────────────────────────────────────── -->
        <div
            v-if="noticiaAEliminar"
            class="modal-overlay"
            @click.self="noticiaAEliminar = null"
        >
            <div class="modal-card animate-fade-in">
                <div class="modal-header">
                    <i
                        class="ti ti-alert-triangle"
                        style="color: #cd322c; font-size: 20px"
                    ></i>
                    <h3>Eliminar Comunicado</h3>
                </div>
                <p class="modal-body">
                    ¿Estás seguro de que querés borrar
                    <strong>"{{ noticiaAEliminar.titulo }}"</strong>? Esta
                    acción es permanente.
                </p>
                <div
                    v-if="errorEliminar"
                    class="error-banner"
                    style="
                        margin-bottom: 16px;
                        width: 100%;
                        box-sizing: border-box;
                    "
                >
                    <i class="ti ti-alert-circle"></i> {{ errorEliminar }}
                </div>
                <div class="modal-footer">
                    <button
                        class="tb-btn outline"
                        @click="noticiaAEliminar = null"
                        :disabled="eliminando"
                    >
                        Cancelar
                    </button>
                    <button
                        class="tb-btn danger"
                        @click="confirmarEliminar"
                        :disabled="eliminando"
                    >
                        <i
                            class="ti ti-loader animate-spin"
                            v-if="eliminando"
                        ></i>
                        {{
                            eliminando
                                ? "Eliminando..."
                                : "Eliminar de forma definitiva"
                        }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import {
    obtenerNoticias,
    crearNoticia,
    actualizarNoticia,
    eliminarNoticia,
} from "../../../services/comunidad-service.js";

import { useAuthStore } from "../../../stores/auth.js";

import { toDisplayDate, parseDisplayDate } from "../../../utils/formatters.js";
import { validarFechaFormato } from "../../../utils/validators.js";
import { useTableControls } from "../../../composables/useTableControls.js";
import Pagination from "../../ui/Pagination.vue";

const authStore = useAuthStore();
// ── Estado ────────────────────────────────────────────────────────────────────
const noticias = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const eliminando = ref(false);

const vistaActiva = ref("lista");
const noticiaSeleccionada = ref(null);
const noticiaAEliminar = ref(null);

const errorCarga = ref("");
const errorGuardar = ref("");
const errorEliminar = ref("");
const exitoGuardar = ref(false);

// ── Filtros y Paginación ────────────────────────────────────────────────
const filterFn = (item, q) => {
    const texto = `${item.titulo} ${item.contenido || ""}`.toLowerCase();
    return texto.includes(q);
};
const {
    searchText,
    currentPage,
    pageSize,
    filteredData,
    paginatedData,
    totalItems,
    goToPage,
    setPageSize,
} = useTableControls(noticias, { pageSize: 10, filterFn });

// ── Refs para autofocus ──────────────────────────────────────────────
const primerInputRef = ref(null);

const imagenPreview = ref("");
const archivoImagen = ref(null);
const inputImagen = ref(null);

const erroresForm = ref({
    titulo: "",
    contenido: "",
    fecha: "",
    imagen: "",
});

const formVacio = () => ({
    id_noticia: null,
    titulo: "",
    contenido: "",
    fecha: toDisplayDate(new Date().toISOString()),
    autor_id: null,
    imagen_url: null,
});

const form = ref(formVacio());

// ── Validación ────────────────────────────────────────────────────────────────
const REGLAS = {
    titulo(v) {
        if (!v?.trim()) return "El título es obligatorio";
        if (v.trim().length < 5) return "El título debe tener al menos 5 caracteres";
        if (v.length > 200) return "Máximo 200 caracteres";
        return "";
    },
    contenido(v) {
        if (!v?.trim()) return "El contenido es obligatorio";
        if (v.trim().length < 10) return "El contenido debe tener al menos 10 caracteres";
        if (v.length > 5000) return "Máximo 5000 caracteres";
        return "";
    },
    fecha(v) {
        if (!v) return "La fecha es obligatoria";
        return validarFechaFormato(v);
    },
};

function validarCampo(campo) {
    if (REGLAS[campo]) erroresForm.value[campo] = REGLAS[campo](form.value[campo]);
}

function validarTodo() {
    Object.keys(REGLAS).forEach(validarCampo);
    return Object.values(erroresForm.value).every((e) => !e);
}

const formularioValido = computed(
    () =>
        form.value.titulo?.trim() &&
        form.value.contenido?.trim() &&
        form.value.fecha &&
        !Object.values(erroresForm.value).some(Boolean),
);

// ── Imagen ────────────────────────────────────────────────────────────────────
const MAX_BYTES = 5 * 1024 * 1024;

function procesarArchivo(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
        erroresForm.value.imagen = "El archivo debe ser una imagen (PNG, JPG, WEBP)";
        return;
    }
    if (file.size > MAX_BYTES) {
        erroresForm.value.imagen = "La imagen no puede superar los 5 MB";
        return;
    }
    erroresForm.value.imagen = "";
    archivoImagen.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        imagenPreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
}

function manejarArchivo(event) {
    procesarArchivo(event.target.files[0]);
}
function manejarDrop(event) {
    procesarArchivo(event.dataTransfer.files[0]);
}

function quitarImagen() {
    imagenPreview.value = "";
    archivoImagen.value = null;
    erroresForm.value.imagen = "";
    if (inputImagen.value) inputImagen.value.value = "";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatearFecha(fechaStr) {
    if (!fechaStr) return "-";
    const parte = fechaStr.split("T")[0];
    const [year, month, day] = parte.split("-");
    return `${day}/${month}/${year}`;
}

// ── Navegación ────────────────────────────────────────────────────────────────
function cambiarVista(nuevaVista, noticia = null) {
    vistaActiva.value = nuevaVista;
    errorGuardar.value = "";
    exitoGuardar.value = false;
    erroresForm.value = { titulo: "", contenido: "", fecha: "", imagen: "" };
    quitarImagen();

    if (nuevaVista === "editar" && noticia) {
        form.value = {
            ...noticia,
            fecha: toDisplayDate(noticia.fecha),
        };
        if (noticia.imagen_url) imagenPreview.value = noticia.imagen_url;
    } else if (nuevaVista === "crear") {
        form.value = formVacio();
        form.value.autor_id = authStore.usuario?.id || null;
        nextTick(() => primerInputRef.value?.focus());
    } else if (nuevaVista === "detalles" && noticia) {
        noticiaSeleccionada.value = noticia;
    }
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
async function fetchNoticias() {
    cargando.value = true;
    errorCarga.value = "";
    try {
        const res = await obtenerNoticias();
        // CORRECCIÓN: Usar 'res' (o res.data dependiendo de cómo retorne tu Axios) en lugar de 'data' que no existía.
        noticias.value = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
    } catch (error) { // CORRECCIÓN: Se agregó (error)
        errorCarga.value =
            error?.response?.data?.message ||
            error?.response?.data?.mensaje ||
            error?.message ||
            "Error crítico al listar noticias.";
    } finally {
        cargando.value = false;
    }
}

async function guardarNoticia() {
    if (!validarTodo()) return;

    errorGuardar.value = "";
    exitoGuardar.value = false;
    guardando.value = true;

    try {
        const payload = new FormData();
        payload.append("titulo", form.value.titulo);
        payload.append("contenido", form.value.contenido);
        payload.append("fecha", parseDisplayDate(form.value.fecha));

        const idUsuario =
            form.value.autor_id && form.value.autor_id !== "undefined"
                ? form.value.autor_id
                : 1;

        payload.append("autor_id", idUsuario);

        if (archivoImagen.value) {
            payload.append("imagen", archivoImagen.value);
        }

        if (vistaActiva.value === "crear") {
            const nueva = await crearNoticia(payload);
            if (nueva && !nueva.success) {
                errorGuardar.value = nueva.message || "Error al crear la noticia.";
                guardando.value = false;
                return;
            }
            noticias.value.unshift(nueva.data || nueva);
        } else {
            const actualizada = await actualizarNoticia(
                form.value.id_noticia,
                payload,
            );
            if (actualizada && !actualizada.success) {
                errorGuardar.value = actualizada.message || "Error al actualizar.";
                guardando.value = false;
                return;
            }
            const idx = noticias.value.findIndex(
                (n) => n.id_noticia === form.value.id_noticia,
            );
            if (idx !== -1)
                noticias.value[idx] = actualizada.data || actualizada;
        }

        exitoGuardar.value = true;
        setTimeout(() => cambiarVista("lista"), 900);
    } catch (e) {
        console.error("Error en guardarNoticia:", e);
        errorGuardar.value =
            e?.response?.data?.mensaje || "No se pudo guardar la noticia.";
    } finally {
        guardando.value = false;
    }
}

function pedirConfirmacion(noticia) {
    noticiaAEliminar.value = noticia;
    errorEliminar.value = "";
}

async function confirmarEliminar() {
    eliminando.value = true;
    errorEliminar.value = "";
    try {
        const res = await eliminarNoticia(noticiaAEliminar.value.id_noticia);
        if (res && !res.success) {
            errorEliminar.value = res.message || "Error al eliminar.";
            return;
        }
        noticias.value = noticias.value.filter(
            (n) => n.id_noticia !== noticiaAEliminar.value.id_noticia,
        );
        noticiaAEliminar.value = null;
    } catch (e) {
        errorEliminar.value = e?.message || "Ocurrió un error al eliminar el comunicado.";
    } finally {
        eliminando.value = false;
    }
}

onMounted(fetchNoticias);
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.22s ease-in-out;
}
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(3px);
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

/* Métricas */
.metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
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
.metric-label {
    font-size: 11px;
    color: var(--color-text-tertiary, #6b7280);
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 500;
}
.metric-label i {
    color: #cd322c;
    font-size: 13px;
}
.metric-value {
    font-size: 24px;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
    line-height: 1.1;
}
.metric-badge {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 2px;
    width: fit-content;
}
.badge-green {
    background: #eaf3de;
    color: #3b6d11;
}
.badge-gray {
    background: #f3f4f6;
    color: #4b5563;
}

/* Card */
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

/* Tabla */
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
    width: 110px;
}
.action-buttons {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
}

/* Thumbnail */
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
    font-size: 14px;
}

/* Fallback detalles */
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
    font-size: 28px;
    opacity: 0.4;
}

/* Botones */
.icon-btn {
    width: 28px;
    height: 28px;
    border-radius: 5px;
    border: 1px solid #e5e7eb;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.12s;
    color: #4b5563;
    font-size: 14px;
    padding: 0;
}
.icon-btn:hover {
    background: #f3f4f6;
}
.icon-btn.view:hover {
    background: #f0f9ff;
    border-color: #bae6fd;
    color: #0284c7;
}
.icon-btn.edit:hover {
    background: #f3f4f6;
    color: #111827;
}
.icon-btn.delete:hover {
    background: #fef2f2;
    border-color: #fca5a5;
    color: #ef4444;
}
.tb-btn {
    padding: 7px 14px;
    border-radius: 6px;
    border: 1px solid transparent;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    transition: all 0.12s;
}
.tb-btn.primary {
    background: #cd322c;
    color: #fff;
    border-color: #cd322c;
}
.tb-btn.primary:hover:not(:disabled) {
    background: #a52420;
}
.tb-btn.outline {
    background: white;
    color: #4b5563;
    border-color: #d1d5db;
}
.tb-btn.outline:hover:not(:disabled) {
    background: #f9fafb;
}
.tb-btn.danger {
    background: #cd322c;
    color: white;
}
.tb-btn.danger:hover:not(:disabled) {
    background: #a52420;
}
.tb-btn.sm {
    padding: 5px 10px;
    font-size: 11.5px;
}
.tb-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Formulario */
.form-body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 20px;
}
.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}
.form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}
.form-group label {
    font-size: 11.5px;
    font-weight: 600;
    color: #4b5563;
}
.required {
    color: #cd322c;
    margin-left: 2px;
}
.form-group input,
.form-group textarea {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 12.5px;
    outline: none;
    transition:
        border-color 0.15s,
        box-shadow 0.15s;
    background: #fff;
    font-family: inherit;
}
.form-group textarea {
    resize: vertical;
    min-height: 100px;
}
.form-group input:focus,
.form-group textarea:focus {
    border-color: #cd322c;
    box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.08);
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
    min-height: 16px;
}
.char-count {
    font-size: 11px;
    color: #9ca3af;
    margin-left: auto;
}
.char-limit {
    color: #ef4444;
    font-weight: 500;
}

/* Upload */
.file-upload-area {
    border: 1.5px dashed #d1d5db;
    border-radius: 8px;
    cursor: pointer;
    transition:
        border-color 0.15s,
        background 0.15s;
    overflow: hidden;
    min-height: 90px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.file-upload-area:hover {
    border-color: #cd322c;
    background: #fef2f2;
}
.file-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 20px;
    color: #6b7280;
    font-size: 12px;
    text-align: center;
}
.imagen-preview-form {
    position: relative;
    width: 100%;
}
.imagen-preview-form img {
    width: 100%;
    max-height: 200px;
    object-fit: cover;
    display: block;
}
.btn-quitar-imagen {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.55);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    font-size: 11px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}
.btn-quitar-imagen:hover {
    background: rgba(205, 50, 44, 0.85);
}

/* Imagen en detalles */
.imagen-preview-container {
    margin-bottom: 4px;
}
.imagen-preview {
    border-radius: 6px;
    overflow: hidden;
}
.imagen-preview img {
    width: 100%;
    max-height: 260px;
    object-fit: cover;
    display: block;
}

/* Detalles */
.details-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}
.detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #f9fafb;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #f3f4f6;
}
.detail-label {
    font-size: 10.5px;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 600;
    letter-spacing: 0.3px;
}
.detail-value {
    font-size: 13.5px;
    color: #111827;
    font-weight: 500;
}
.info-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    padding: 12px;
    border-radius: 6px;
    color: #1e3a8a;
    font-size: 12px;
    line-height: 1.5;
}

/* Banners */
.error-banner {
    display: inline-flex;
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
.exito-banner {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #eaf3de;
    border: 1px solid #bbf7d0;
    color: #166534;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    margin-right: auto;
}
.empty-state {
    padding: 36px 16px;
    text-align: center;
    color: #9ca3af;
    font-size: 12.5px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
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

/* Modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
}
.modal-card {
    background: #fff;
    border-radius: 8px;
    padding: 22px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}
.modal-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 10px;
}
.modal-header h3 {
    font-size: 14.5px;
    font-weight: 600;
    color: #111827;
}
.modal-body {
    font-size: 12.5px;
    color: #4b5563;
    margin-bottom: 18px;
    line-height: 1.5;
}
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>
