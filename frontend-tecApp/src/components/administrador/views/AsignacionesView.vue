<template>
    <div class="alumnos-wrapper">
        <div v-if="vistaActiva === 'lista'" class="metrics animate-fade-in">
            <div class="metric-card">
                <div class="metric-label">
                    <i class="ti ti-briefcase" aria-hidden="true"></i>Total
                    Asignaciones
                </div>
                <div class="metric-value">{{ asignaciones.length }}</div>
                <span class="metric-badge badge-green">
                    <i class="ti ti-check"></i>Materias cubiertas
                </span>
            </div>
            <div class="metric-card">
                <div class="metric-label">
                    <i class="ti ti-school" aria-hidden="true"></i>Gestión
                    Académica
                </div>
                <div class="metric-value">Activa</div>
                <span class="metric-badge badge-gray"
                    >Ciclo lectivo actual</span
                >
            </div>
        </div>

        <div v-if="vistaActiva === 'lista'" class="search-bar-wrapper">
            <div class="search-box">
                <i class="ti ti-search"></i>
                <input v-model="searchText" type="text" placeholder="Buscar asignación por profesor, materia o curso..." aria-label="Buscar asignaciones" />
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
                    <i class="ti ti-chalkboard" aria-hidden="true"></i>
                    Asignaciones de Materias
                </div>
                <button
                    @click="cambiarVista('crear')"
                    class="tb-btn primary sm"
                >
                    <i class="ti ti-plus" aria-hidden="true"></i> Nueva
                    Asignación
                </button>
            </div>

            <div class="table-responsive">
                <div v-if="cargando" class="empty-state">
                    <i
                        class="ti ti-loader animate-spin"
                        style="font-size: 24px; color: #cd322c"
                    ></i>
                    <p>Cargando registros de asignaciones...</p>
                </div>

                <div
                    v-else-if="errorCarga"
                    class="error-banner"
                    style="margin: 16px"
                >
                    <i class="ti ti-alert-circle"></i> {{ errorCarga }}
                    <button
                        class="tb-btn sm outline"
                        @click="fetchDependenciasYDatos"
                        style="margin-left: auto"
                    >
                        Reintentar
                    </button>
                </div>

                <template v-else-if="filteredData.length > 0">
                    <table
                        class="mini"
                        aria-label="Listado de asignaciones"
                    >
                        <thead>
                            <tr>
                                <th>Profesor Designado</th>
                                <th>Materia</th>
                                <th>Curso / División</th>
                                <th class="action-cell">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="asignacion in paginatedData"
                                :key="asignacion.id_asignacion"
                            class="table-row"
                        >
                            <td>
                                <strong
                                    >{{
                                        asignacion.profesorAsignacion.apellido
                                    }}
                                    {{ asignacion.profesorAsignacion.nombre }}
                                </strong>
                            </td>
                            <td>
                                {{
                                    asignacion.materiaAsignacion
                                        .nombre_materia || "N/A"
                                }}
                            </td>
                            <td>
                                {{
                                    asignacion.cursoAsignacion.nombre_curso ||
                                    "Sin asignar"
                                }}
                            </td>

                            <td class="action-cell">
                                <div class="action-buttons">
                                    <button
                                        @click="
                                            cambiarVista('detalles', asignacion)
                                        "
                                        class="icon-btn view"
                                        title="Ver detalles"
                                    >
                                        <i class="ti ti-eye"></i>
                                    </button>
                                    <button
                                        @click="
                                            cambiarVista('editar', asignacion)
                                        "
                                        class="icon-btn edit"
                                        title="Editar"
                                    >
                                        <i class="ti ti-edit"></i>
                                    </button>
                                    <button
                                        @click="pedirConfirmacion(asignacion)"
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
                                class="ti ti-file-x"
                                style="font-size: 28px; opacity: 0.4"
                            ></i>
                            <p v-if="searchText">No se encontraron asignaciones que coincidan con "{{ searchText }}".</p>
                            <p v-else>No se encontraron asignaciones de materias registradas.</p>
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

        <div
            v-if="vistaActiva === 'detalles' && asignacionSeleccionada"
            class="card animate-fade-in"
        >
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-clipboard-list"></i>
                    Detalle de Asignación —
                    {{ asignacionSeleccionada.materia?.nombre_materia }}
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
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Profesor Titular</span>
                        <span class="detail-value">
                            {{
                                asignacionSeleccionada.profesorAsignacion
                                    .apellido
                            }}
                            {{
                                asignacionSeleccionada.profesorAsignacion.nombre
                            }}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Materia Dictada</span>
                        <span class="detail-value">{{
                            asignacionSeleccionada.materiaAsignacion
                                .nombre_materia
                        }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Curso Asignado</span>
                        <span class="detail-value">{{
                            asignacionSeleccionada.cursoAsignacion.nombre_curso
                        }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Nivel / Turno</span>
                        <span class="detail-value">
                            {{ asignacionSeleccionada.cursoAsignacion.nivel }}
                            {{ asignacionSeleccionada.cursoAsignacion.turno }}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Aula</span>
                        <span class="detail-value mono">{{
                            asignacionSeleccionada.cursoAsignacion.aula ||
                            "No definida"
                        }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Estado del Curso</span>
                        <span class="detail-value">{{
                            asignacionSeleccionada.curso?.estado || "Activo"
                        }}</span>
                    </div>
                </div>

                <div class="info-box">
                    <i class="ti ti-calendar-event"></i>
                    <p>
                        Esta asignación vincula al profesor con el registro de
                        calificaciones y asistencias de los alumnos matriculados
                        en
                        <strong>{{
                            asignacionSeleccionada.curso?.nombre_curso
                        }}</strong>
                        para la materia correspondiente.
                    </p>
                </div>
            </div>

            <div class="card-footer">
                <button @click="cambiarVista('lista')" class="tb-btn outline">
                    Volver al listado
                </button>
                <button
                    @click="cambiarVista('editar', asignacionSeleccionada)"
                    class="tb-btn primary"
                >
                    <i class="ti ti-edit"></i> Modificar Asignación
                </button>
            </div>
        </div>

        <div
            v-if="['crear', 'editar'].includes(vistaActiva)"
            class="card animate-fade-in"
        >
            <div class="card-header">
                <div class="card-title">
                    <i
                        :class="
                            vistaActiva === 'crear'
                                ? 'ti ti-clipboard-plus'
                                : 'ti ti-edit'
                        "
                    ></i>
                    {{
                        vistaActiva === "crear"
                            ? "Registrar Nueva Asignación"
                            : "Modificar Asignación Existente"
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

            <form @submit.prevent="guardarAsignacion" class="form-body">
                <div class="form-row">
                    <div class="form-group">
                        <label for="id_profesor">Profesor Titular <span class="required">*</span></label>
                        <select
                            id="id_profesor"
                            ref="primerInputRef"
                            v-model="form.id_profesor"
                            :class="{ 'input-error': erroresForm.id_profesor }"
                            @blur="validarCampo('id_profesor')"
                            required
                        >
                            <option value="" disabled>
                                Seleccione un profesor...
                            </option>
                            <option
                                v-for="profesor in profesoresDisponibles"
                                :key="profesor.id_profesor"
                                :value="profesor.id_profesor"
                            >
                                {{ profesor.nombre }}, {{ profesor.apellido }}
                            </option>
                        </select>
                        <span v-if="erroresForm.id_profesor" class="field-error">{{ erroresForm.id_profesor }}</span>
                    </div>

                    <div class="form-group">
                        <label for="id_materia">Materia a Dictar <span class="required">*</span></label>
                        <select
                            id="id_materia"
                            v-model="form.id_materia"
                            :class="{ 'input-error': erroresForm.id_materia }"
                            @blur="validarCampo('id_materia')"
                            required
                        >
                            <option value="" disabled>
                                Seleccione una materia...
                            </option>
                            <option
                                v-for="materia in materiasDisponibles"
                                :key="materia.id_materia"
                                :value="materia.id_materia"
                            >
                                {{ materia.nombre_materia }}
                            </option>
                        </select>
                        <span v-if="erroresForm.id_materia" class="field-error">{{ erroresForm.id_materia }}</span>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group" style="grid-column: span 2">
                        <label for="id_curso">Curso / División <span class="required">*</span></label>
                        <select id="id_curso" v-model="form.id_curso" :class="{ 'input-error': erroresForm.id_curso }" @blur="validarCampo('id_curso')" required>
                            <option value="" disabled>
                                Seleccione el curso al que se asigna...
                            </option>
                            <option
                                v-for="curso in cursosDisponibles"
                                :key="curso.id_curso"
                                :value="curso.id_curso"
                            >
                                {{ curso.nombre_curso }} ({{ curso.nivel }} -
                                Turno: {{ curso.turno }})
                            </option>
                        </select>
                        <span v-if="erroresForm.id_curso" class="field-error">{{ erroresForm.id_curso }}</span>
                    </div>
                </div>

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
                        <i class="ti ti-check"></i> La asignación se guardó
                        correctamente.
                    </div>
                    <button
                        type="button"
                        @click="cambiarVista('lista')"
                        class="tb-btn outline"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        class="tb-btn primary"
                        :disabled="guardando"
                    >
                        <i
                            class="ti ti-loader animate-spin"
                            v-if="guardando"
                        ></i>
                        {{
                            guardando
                                ? "Guardando registro..."
                                : vistaActiva === "crear"
                                  ? "Confirmar Asignación"
                                  : "Actualizar Asignación"
                        }}
                    </button>
                </div>
            </form>
        </div>

        <div
            v-if="asignacionAEliminar"
            class="modal-overlay"
            @click.self="asignacionAEliminar = null"
        >
            <div class="modal-card animate-fade-in">
                <div class="modal-header">
                    <i
                        class="ti ti-alert-triangle"
                        style="color: #cd322c; font-size: 20px"
                    ></i>
                    <h3>Dar de baja asignación</h3>
                </div>

                <p class="modal-body">
                    ¿Estás seguro de que querés desvincular a
                    <strong
                        >{{ asignacionAEliminar.profesorAsignacion?.apellido }},
                        {{ asignacionAEliminar.profesorAsignacion?.nombre }}</strong
                    >
                    de la materia
                    <strong>{{
                        asignacionAEliminar.materiaAsignacion?.nombre_materia
                    }}</strong>
                    en el curso
                    <strong>{{
                        asignacionAEliminar.cursoAsignacion?.nombre_curso
                    }}</strong
                    >? Esta operación no eliminará al profesor ni al curso, solo
                    su relación. Esta acción también eliminará las notas
                    asociadas a esta asignación.
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
                        @click="asignacionAEliminar = null"
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
                        {{ eliminando ? "Eliminando..." : "Eliminar vínculo" }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
// IMPORTANTE: Ajustar estas rutas según la estructura de tus servicios en tec-app-gestion
import {
    obtenerAsignaciones,
    crearAsignacion,
    modificarAsignacion,
    eliminarAsignacion,
    obtenerProfesores,
    obtenerMaterias,
    obtenerCursos,
} from "../../../services/academico-service.js";
import {
    validarRequerido,
    validarFormulario,
} from "../../../utils/validators.js";
import { useTableControls } from "../../../composables/useTableControls.js";
import Pagination from "../../ui/Pagination.vue";

// ── Estado Reactivo ──────────────────────────────────────────────────────────
const asignaciones = ref([]);
const profesoresDisponibles = ref([]);
const materiasDisponibles = ref([]);
const cursosDisponibles = ref([]);

const cargando = ref(false);
const guardando = ref(false);
const eliminando = ref(false);

const vistaActiva = ref("lista");
const asignacionSeleccionada = ref(null);
const asignacionAEliminar = ref(null);

const errorCarga = ref("");
const errorGuardar = ref("");
const errorEliminar = ref("");
const exitoGuardar = ref(false);

// ── Filtros y Paginación ────────────────────────────────────────────────
const filterFn = (item, q) => {
    const texto = `${item.profesorAsignacion?.apellido || ""} ${item.profesorAsignacion?.nombre || ""} ${item.materiaAsignacion?.nombre_materia || ""} ${item.cursoAsignacion?.nombre_curso || ""}`.toLowerCase();
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
} = useTableControls(asignaciones, { pageSize: 10, filterFn });

// ── Refs para autofocus ──────────────────────────────────────────────
const primerInputRef = ref(null);

// ── Payload del formulario para la tabla intermedia
const formVacio = () => ({
    id_asignacion: null,
    id_profesor: "",
    id_materia: "",
    id_curso: "",
});
const form = ref(formVacio());

// ── Validación ────────────────────────────────────────────────────────────────
const erroresForm = ref({});

const REGLAS_VALIDACION = {
    id_profesor: (v) => validarRequerido(v, "El profesor"),
    id_materia: (v) => validarRequerido(v, "La materia"),
    id_curso: (v) => validarRequerido(v, "El curso"),
};

function validarCampo(campo) {
    if (REGLAS_VALIDACION[campo]) {
        erroresForm.value[campo] = REGLAS_VALIDACION[campo](form.value[campo]);
    }
}

function validarTodo() {
    erroresForm.value = validarFormulario(form.value, REGLAS_VALIDACION);
    return Object.keys(erroresForm.value).length === 0;
}

function limpiarErrores() {
    erroresForm.value = {};
}

// ── Navegación de Flujos ─────────────────────────────────────────────────────
const cambiarVista = (nuevaVista, asignacion = null) => {
    vistaActiva.value = nuevaVista;
    errorGuardar.value = "";
    exitoGuardar.value = false;

    if (nuevaVista === "editar" && asignacion) {
        form.value = {
            id_asignacion: asignacion.id_asignacion,
            id_profesor:
                asignacion.id_profesor ||
                asignacion.profesor?.id_profesor ||
                "",
            id_materia:
                asignacion.id_materia || asignacion.materia?.id_materia || "",
            id_curso: asignacion.id_curso || asignacion.curso?.id_curso || "",
        };
        limpiarErrores();
    } else if (nuevaVista === "crear") {
        form.value = formVacio();
        limpiarErrores();
        nextTick(() => primerInputRef.value?.focus());
    } else if (nuevaVista === "detalles" && asignacion) {
        asignacionSeleccionada.value = asignacion;
    }
};

const fetchProfesores = async () => {
    cargando.value = true;
    errorCarga.value = "";
    try {
        const res = await obtenerProfesores();
        profesoresDisponibles.value = Array.isArray(res.data) ? res.data : [];
    } catch {
        errorCarga.value =
            "Error crítico de red al sincronizar el padrón de profesores.";
    } finally {
        cargando.value = false;
    }
};

const fetchMaterias = async () => {
    cargando.value = true;
    errorCarga.value = "";
    try {
        const res = await obtenerMaterias();
        materiasDisponibles.value = Array.isArray(res.data) ? res.data : [];
    } catch {
        errorCarga.value =
            "Error crítico de red al sincronizar el padrón de materias.";
    } finally {
        cargando.value = false;
    }
};

const fetchCursos = async () => {
    try {
        const res = await obtenerCursos();
        cursosDisponibles.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
        console.error("No se pudieron cargar los cursos disponibles:", e);
    }
};

const fetchAsignaciones = async () => {
    try {
        const res = await obtenerAsignaciones();
        asignaciones.value = Array.isArray(res.data) ? res.data : [];
    } catch (e) {
        console.error("No se pudieron cargar las asignaciones disponibles:", e);
    }
};

// ── Controladores CRUD Async ──────────────────────────────────────────────────
/*
const fetchDependenciasYDatos = async () => {
    cargando.value = true;
    errorCarga.value = "";
    try {
        // Cargar todas las listas en paralelo para optimizar la velocidad
        const [resAsig, resProf, resMat, resCurs] = await Promise.all([
            obtenerAsignaciones(),
            obtenerProfesores(),
            obtenerMaterias(),
            obtenerCursos(),
        ]);

        asignaciones.value = Array.isArray(resAsig.data) ? resAsig.data : [];
        profesoresDisponibles.value = Array.isArray(resProf.data)
            ? resProf.data
            : [];
        materiasDisponibles.value = Array.isArray(resMat.data)
            ? resMat.data
            : [];
        cursosDisponibles.value = Array.isArray(resCurs.data)
            ? resCurs.data
            : [];
    } catch (error) {
        console.error("Error al sincronizar datos:", error);
        errorCarga.value =
            "Error crítico al sincronizar registros e información vinculada.";
    } finally {
        cargando.value = false;
    }
};
*/

const guardarAsignacion = async () => {
    errorGuardar.value = "";
    exitoGuardar.value = false;

    if (!validarTodo()) return;

    guardando.value = true;

    try {
        if (vistaActiva.value === "crear") {
            await crearAsignacion(form.value);
        } else {
            await modificarAsignacion(form.value);
        }
        exitoGuardar.value = true;
        // Refrescamos solo las asignaciones para ver los cambios
        const resAsig = await obtenerAsignaciones();
        asignaciones.value = Array.isArray(resAsig.data) ? resAsig.data : [];

        setTimeout(() => cambiarVista("lista"), 800);
    } catch (e) {
        errorGuardar.value =
            e?.response?.data?.mensaje ||
            "No se pudo registrar ni actualizar la asignación.";
    } finally {
        guardando.value = false;
    }
};

const pedirConfirmacion = (asignacion) => {
    asignacionAEliminar.value = asignacion;
    errorEliminar.value = "";
};

const confirmarEliminar = async () => {
    eliminando.value = true;
    errorEliminar.value = "";

    try {
        const respuesta = await eliminarAsignacion(
            asignacionAEliminar.value.id_asignacion,
        );
        // Ajustar esto según cómo devuelva la respuesta tu backend
        if (respuesta.success || respuesta.status === 200) {
            asignaciones.value = asignaciones.value.filter(
                (a) =>
                    a.id_asignacion !== asignacionAEliminar.value.id_asignacion,
            );
            asignacionAEliminar.value = null;
        } else {
            errorEliminar.value = respuesta.message || respuesta.data?.mensaje;
        }
    } catch {
        errorEliminar.value =
            "Ocurrió un error inesperado al dar de baja la asignación.";
    } finally {
        eliminando.value = false;
    }
};

// ── Hooks de entrada ─────────────────────────────────────────────────────────
onMounted(() => {
    //fetchDependenciasYDatos();
    fetchProfesores();
    fetchMaterias();
    fetchCursos();
    fetchAsignaciones();
});
</script>

<style scoped>
/* Transiciones y Microanimaciones */
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

.alumnos-wrapper {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 950px;
    width: 100%;
}

/* Tablero de métricas */
.metrics {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
}
.metric-card {
    background: var(--color-background-secondary, #ffffff);
    border-radius: 8px;
    padding: 14px 18px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
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

/* UI Container Card */
.card {
    background: var(--color-background-primary, #fff);
    border: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
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

/* Tabla Estilo Compacto */
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
    color: var(--color-text-tertiary, #6b7280);
    font-weight: 500;
    font-size: 11.5px;
    border-bottom: 1px solid #e5e7eb;
}
.mini td {
    padding: 9px 10px;
    border-bottom: 0.5px solid #e5e7eb;
    color: var(--color-text-primary, #111827);
    vertical-align: middle;
}
.table-row:hover {
    background: var(--color-background-secondary, #f9fafb);
}
.mono {
    font-family: monospace;
    font-size: 11.5px;
    color: #4b5563;
}

/* Estado Badges */
.status-pill {
    font-size: 10.5px;
    padding: 2px 7px;
    border-radius: 4px;
    font-weight: 600;
    display: inline-block;
}
.sp-active {
    background: #eaf3de;
    color: #3b6d11;
}
.sp-pending {
    background: #fef08a;
    color: #a16207;
}
.sp-inactive {
    background: #fef2f2;
    color: #991b1b;
}

/* Control de Acciones */
.action-cell {
    text-align: right;
    width: 110px;
}
.action-buttons {
    display: flex;
    gap: 4px;
    justify-content: flex-end;
    align-items: center;
}
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
.icon-btn i {
    pointer-events: none;
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

/* Botonería Semántica */
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
.tb-btn.danger {
    background: #cd322c;
    color: white;
}
.tb-btn.danger:hover {
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

/* Formularios de Inscripción */
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
.form-group input,
.form-group select {
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 12.5px;
    outline: none;
    transition:
        border-color 0.15s,
        box-shadow 0.15s;
    background: #fff;
}
.form-group input:focus,
.form-group select:focus {
    border-color: #cd322c;
    box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.08);
}

/* Legajos / Detalles estructurados */
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

/* Callouts Informativos */
.info-box {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    padding: 12px;
    border-radius: 6px;
    color: #1e3a8a;
    font-size: 12px;
    line-height: 1.5;
}
.info-box i {
    font-size: 15px;
    color: #3b82f6;
    margin-top: 1px;
}

/* Banners y Alertas de Servidor */
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

/* Capa de Modales */
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
