<template>
    <div class="alumnos-wrapper">
        <div v-if="vistaActiva === 'lista'" class="metrics animate-fade-in">
            <div class="metric-card">
                <div class="metric-label">
                    <i class="ti ti-school" aria-hidden="true"></i>Total Alumnos
                </div>
                <div class="metric-value">{{ alumnos.length }}</div>
                <span class="metric-badge badge-green">
                    <i class="ti ti-arrow-up"></i>Activos en sistema
                </span>
            </div>
            <div class="metric-card">
                <div class="metric-label">
                    <i class="ti ti-chart-pie" aria-hidden="true"></i>Asistencia
                    Promedio
                </div>
                <div class="metric-value">81%</div>
                <span class="metric-badge badge-gray"
                    >Ciclo lectivo actual</span
                >
            </div>
        </div>

        <div v-if="vistaActiva === 'lista'" class="search-bar-wrapper">
                <div class="search-box">
                    <i class="ti ti-search"></i>
                    <input
                        v-model="searchText"
                        type="text"
                        placeholder="Buscar alumno por nombre, apellido o DNI..."
                        aria-label="Buscar alumnos"
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
            </div>

            <div
                v-if="vistaActiva === 'lista'"
                class="card animate-fade-in"
                style="margin-top: 0"
            >
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-users" aria-hidden="true"></i>
                        Gestión de Alumnos
                    </div>
                    <div class="card-header-actions">
                        <label class="toggle-bajas" title="Mostrar alumnos dados de baja">
                            <input type="checkbox" v-model="mostrarBajas" />
                            <span class="toggle-label">Ver bajas</span>
                        </label>
                        <button
                            @click="cambiarVista('crear')"
                            class="tb-btn primary sm"
                        >
                            <i class="ti ti-plus" aria-hidden="true"></i> Nuevo Alumno
                        </button>
                    </div>
                </div>

            <div class="table-responsive">
                <div v-if="cargando" class="empty-state">
                    <i
                        class="ti ti-loader animate-spin"
                        style="font-size: 24px; color: #cd322c"
                    ></i>
                    <p>Cargando legajos de alumnos...</p>
                </div>

                <div
                    v-else-if="errorCarga"
                    class="error-banner"
                    style="margin: 16px"
                >
                    <i class="ti ti-alert-circle"></i> {{ errorCarga }}
                    <button
                        class="tb-btn sm outline"
                        @click="fetchAlumnos"
                        style="margin-left: auto"
                    >
                        Reintentar
                    </button>
                </div>

                <template v-else-if="filteredData.length > 0">
                    <table
                        class="mini"
                        aria-label="Listado de alumnos"
                    >
                        <thead>
                            <tr>
                                <th>Alumno</th>
                                <th>DNI</th>
                                <th>Curso asignado</th>
                                <th>Estado</th>
                                <th class="action-cell">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="alumno in paginatedData"
                                :key="alumno.id_alumno"
                                class="table-row"
                                :class="{ 'row-baja': alumno.estado === 'baja' }"
                            >
                                <td>
                                    <strong>{{ alumno.apellido }}</strong
                                    >, {{ alumno.nombre }}
                                </td>
                                <td class="mono">{{ alumno.dni }}</td>
                                <td>
                                    {{
                                        alumno.curso?.nombre_curso || "Sin asignar"
                                    }}
                                </td>
                                <td>
                                    <span
                                        :class="['status-pill', claseEstado(alumno.estado || 'activo')]"
                                    >
                                        {{ etiquetaEstado[alumno.estado] || (alumno.estado || 'Activo') }}
                                    </span>
                                </td>
                                <td class="action-cell">
                                    <div class="action-buttons">
                                        <button
                                            @click="
                                                cambiarVista('detalles', alumno)
                                            "
                                            class="icon-btn view"
                                            title="Ver legajo completo"
                                        >
                                            <i class="ti ti-eye"></i>
                                        </button>
                                        <button
                                            v-if="alumno.estado !== 'baja'"
                                            @click="cambiarVista('editar', alumno)"
                                            class="icon-btn edit"
                                            title="Editar"
                                        >
                                            <i class="ti ti-edit"></i>
                                        </button>
                                        <button
                                            v-if="alumno.estado !== 'baja'"
                                            @click="pedirConfirmacion(alumno)"
                                            class="icon-btn delete"
                                            title="Dar de baja"
                                        >
                                            <i class="ti ti-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <Pagination
                        :current-page="currentPage"
                        :total-items="totalItems"
                        :page-size="pageSize"
                        @page-change="goToPage"
                        @page-size-change="setPageSize"
                    />
                </template>

                <div v-else class="empty-state">
                    <i
                        class="ti ti-user-x"
                        style="font-size: 28px; opacity: 0.4"
                    ></i>
                    <p v-if="searchText">
                        No se encontraron alumnos que coincidan con "{{ searchText }}".
                    </p>
                    <p v-else>
                        No se encontraron alumnos registrados en la institución.
                    </p>
                </div>
            </div>
        </div>

        <div
            v-if="vistaActiva === 'detalles' && alumnoSeleccionado"
            class="card animate-fade-in"
        >
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-id-badge"></i>
                    Legajo Digital — {{ alumnoSeleccionado.apellido }},
                    {{ alumnoSeleccionado.nombre }}
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
                        <span class="detail-label">Apellido y Nombre</span>
                        <span class="detail-value"
                            >{{ alumnoSeleccionado.apellido }},
                            {{ alumnoSeleccionado.nombre }}</span
                        >
                    </div>
                    <div class="detail-item">
                        <span class="detail-label"
                            >Documento Nacional de Identidad (DNI)</span
                        >
                        <span class="detail-value mono">{{
                            alumnoSeleccionado.dni
                        }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label"
                            >División / Curso Actual</span
                        >
                        <span class="detail-value">{{
                            alumnoSeleccionado.curso?.nombre_curso ||
                            "No matriculado"
                        }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Fecha de Nacimiento</span>
                        <span class="detail-value">{{
                            formatDate(alumnoSeleccionado.fecha_nacimiento) ||
                            "No registrada"
                        }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label"
                            >Tutor / Responsable Legal</span
                        >{{ alumnoSeleccionado.nombre_tutor || "N/A" }}
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Tutor Teléfono</span>
                        <span class="detail-value">{{
                            alumnoSeleccionado.telefono_tutor || "S/T"
                        }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Domicilio</span>
                        <span class="detail-value">{{
                            alumnoSeleccionado.domicilio || "No registrado"
                        }}</span>
                    </div>

                    <div class="detail-item">
                        <span class="detail-label">ID de usuario</span>
                        <span class="detail-value">{{
                            alumnoSeleccionado.id_usuario || "Aún no registrado como usuario"
                        }}</span>
                    </div>
                </div>

                <div class="info-box">
                    <i class="ti ti-activity"></i>
                    <p>
                        Módulo de historial académico unificado: Próximamente se
                        integrarán las inasistencias acumuladas y boletín de
                        calificaciones de las materias correspondientes a
                        {{
                            alumnoSeleccionado.curso?.nombre_curso ||
                            "su curso asignado"
                        }}.
                    </p>
                </div>
            </div>

            <div class="card-footer">
                <button @click="cambiarVista('lista')" class="tb-btn outline">
                    Volver al listado
                </button>
                <button
                    @click="cambiarVista('editar', alumnoSeleccionado)"
                    class="tb-btn primary"
                >
                    <i class="ti ti-edit"></i> Editar Ficha
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
                                ? 'ti ti-user-plus'
                                : 'ti ti-edit'
                        "
                    ></i>
                    {{
                        vistaActiva === "crear"
                            ? "Inscribir Nuevo Alumno"
                            : "Modificar Ficha de Alumno"
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

            <form @submit.prevent="guardarAlumno" class="form-body">
                <div class="form-row">
                    <div class="form-group">
                        <label for="nombre">Nombre <span class="required">*</span></label>
                        <input
                            id="nombre"
                            ref="primerInputRef"
                            v-model="form.nombre"
                            type="text"
                            placeholder="Ej: Valentina"
                            :class="{ 'input-error': erroresForm.nombre }"
                            @blur="validarCampo('nombre')"
                            required
                        />
                        <span v-if="erroresForm.nombre" class="field-error">{{ erroresForm.nombre }}</span>
                    </div>
                    <div class="form-group">
                        <label for="apellido">Apellido <span class="required">*</span></label>
                        <input
                            id="apellido"
                            v-model="form.apellido"
                            type="text"
                            placeholder="Ej: Ríos"
                            :class="{ 'input-error': erroresForm.apellido }"
                            @blur="validarCampo('apellido')"
                            required
                        />
                        <span v-if="erroresForm.apellido" class="field-error">{{ erroresForm.apellido }}</span>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="dni">Número de DNI <span class="required">*</span></label>
                        <input
                            id="dni"
                            v-model="form.dni"
                            type="text"
                            placeholder="Ej: 45321098"
                            :class="{ 'input-error': erroresForm.dni }"
                            @blur="validarCampo('dni')"
                            required
                        />
                        <span v-if="erroresForm.dni" class="field-error">{{ erroresForm.dni }}</span>
                    </div>

                    <div class="form-group">
                        <label for="id_curso">Curso / División asignada</label>
                        <select id="id_curso" v-model="form.id_curso">
                            <option value="">Sin asignar (Opcional)</option>
                            <option
                                v-for="curso in cursosDisponibles"
                                :key="curso.id_curso"
                                :value="curso.id_curso"
                            >
                                {{ curso.nombre_curso }}
                            </option>
                        </select>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="fecha_nacimiento"
                            >Fecha de Nacimiento</label
                        >
                        <input
                            id="fecha_nacimiento"
                            v-model="form.fecha_nacimiento"
                            type="text"
                            placeholder="DD/MM/AAAA"
                            :class="{ 'input-error': erroresForm.fecha_nacimiento }"
                            @blur="validarCampo('fecha_nacimiento')"
                        />
                        <span v-if="erroresForm.fecha_nacimiento" class="field-error">{{ erroresForm.fecha_nacimiento }}</span>
                    </div>

                    <div class="form-group">
                        <label for="domicilio">Domicilio</label>
                        <input
                            id="domicilio"
                            v-model="form.domicilio"
                            type="text"
                            placeholder="Ej: Av. Rivadavia 123"
                        />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="nombre_tutor">Nombre del Tutor</label>
                        <input
                            id="nombre_tutor"
                            v-model="form.nombre_tutor"
                            type="text"
                            placeholder="Ej: Roberto Ríos"
                        />
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label for="telefono_tutor">Teléfono del Tutor</label>
                        <input
                            id="telefono_tutor"
                            v-model="form.telefono_tutor"
                            type="tel"
                            placeholder="Ej: 2364123456"
                            :class="{ 'input-error': erroresForm.telefono_tutor }"
                            @blur="validarCampo('telefono_tutor')"
                        />
                        <span v-if="erroresForm.telefono_tutor" class="field-error">{{ erroresForm.telefono_tutor }}</span>
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
                        <i class="ti ti-check"></i> Los cambios en el legajo se
                        guardaron correctamente.
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
                                ? "Guardando legajo..."
                                : vistaActiva === "crear"
                                  ? "Confirmar Inscripción"
                                  : "Actualizar Alumno"
                        }}
                    </button>
                </div>
            </form>
        </div>

        <div
            v-if="alumnoAEliminar"
            class="modal-overlay"
            @click.self="alumnoAEliminar = null"
        >
            <div class="modal-card animate-fade-in">
                <div class="modal-header">
                    <i
                        class="ti ti-alert-triangle"
                        style="color: #cd322c; font-size: 20px"
                    ></i>
                    <h3>Dar de baja legajo institucional</h3>
                </div>

                <p class="modal-body">
                    ¿Estás seguro de que querés dar de baja a
                    <strong
                        >{{ alumnoAEliminar.nombre }}
                        {{ alumnoAEliminar.apellido }}</strong
                    >
                    (DNI: {{ alumnoAEliminar.dni }})? El alumno quedará marcado como
                    <strong>"Baja"</strong> y no aparecerá en listas activas, pero su
                    historial de asistencias y notas se preservará. Podés reactivarlo
                    después editando su ficha.
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
                        @click="alumnoAEliminar = null"
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
                                ? "Dando de baja..."
                                : "Sí, dar de baja"
                        }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import {
    obtenerAlumnos,
    crearAlumno,
    modificarAlumno,
    darDeBajaAlumno,
    obtenerCursos,
} from "../../../services/academico-service.js";
import { formatDate, toDisplayDate, parseDisplayDate } from "../../../utils/formatters.js";
import {
    validarRequerido,
    validarLongitudMinima,
    validarDNI,
    validarTelefono,
    validarFechaFormato,
    validarFormulario,
} from "../../../utils/validators.js";
import { useTableControls } from "../../../composables/useTableControls.js";
import Pagination from "../../ui/Pagination.vue";

// ── Estado Reactivo ──────────────────────────────────────────────────────────
const alumnos = ref([]);
const cursosDisponibles = ref([]);
const cargando = ref(false);
const guardando = ref(false);
const eliminando = ref(false);

const vistaActiva = ref("lista");
const alumnoSeleccionado = ref(null);
const alumnoAEliminar = ref(null);

const errorCarga = ref("");
const errorGuardar = ref("");
const errorEliminar = ref("");
const exitoGuardar = ref(false);

const mostrarBajas = ref(false);

const etiquetaEstado = {
    activo: "Activo",
    egresado: "Egresado",
    baja: "Baja",
    condicional: "Condicional",
};

const claseEstado = (estado) => {
    switch (estado) {
        case "activo": return "sp-activo";
        case "egresado": return "sp-egresado";
        case "baja": return "sp-baja";
        case "condicional": return "sp-condicional";
        default: return "";
    }
};

// ── Filtros y Paginación ────────────────────────────────────────────────
const filterFn = (item, q) => {
    // Si no se están mostrando bajas, ocultar alumnos con estado 'baja'
    if (!mostrarBajas.value && item.estado === "baja") return false;
    const texto = `${item.nombre} ${item.apellido} ${item.dni} ${item.curso?.nombre_curso || ""}`.toLowerCase();
    return texto.includes(q);
};
const {
    searchText,
    currentPage,
    pageSize,
    filters,
    filteredData,
    paginatedData,
    totalItems,
    totalPages,
    setFilter,
    clearFilters,
    goToPage,
    setPageSize,
    getUniqueOptions,
} = useTableControls(alumnos, { pageSize: 10, filterFn });

const formVacio = () => ({
    id_alumno: null,
    nombre: "",
    apellido: "",
    dni: "",
    fecha_nacimiento: "",
    nombre_tutor: "",
    telefono_tutor: "",
    domicilio: "",
    id_curso: "",
});
const form = ref(formVacio());

// ── Validación ────────────────────────────────────────────────────────────────
const erroresForm = ref({});

const REGLAS_VALIDACION = {
    nombre: (v) => validarRequerido(v, "El nombre") || validarLongitudMinima(v, 2, "El nombre"),
    apellido: (v) => validarRequerido(v, "El apellido") || validarLongitudMinima(v, 2, "El apellido"),
    dni: validarDNI,
    telefono_tutor: (v) => v ? validarTelefono(v, false) : "",
    fecha_nacimiento: (v) => v ? validarFechaFormato(v) : "",
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
const cambiarVista = (nuevaVista, alumno = null) => {
    vistaActiva.value = nuevaVista;
    errorGuardar.value = "";
    exitoGuardar.value = false;

    if (nuevaVista === "editar" && alumno) {
        form.value = {
            ...alumno,
            id_curso: alumno.id_curso || "",
            fecha_nacimiento: toDisplayDate(alumno.fecha_nacimiento),
        };
        limpiarErrores();
    } else if (nuevaVista === "crear") {
        form.value = formVacio();
        limpiarErrores();
        nextTick(() => primerInputRef.value?.focus());
    } else if (nuevaVista === "detalles" && alumno) {
        alumnoSeleccionado.value = alumno;
    }
};

// ── Controladores CRUD Async con Manejo de Errores Corregido ─────────────────
const fetchAlumnos = async () => {
    cargando.value = true;
    errorCarga.value = "";
    try {
        const res = await obtenerAlumnos();
        // Soporta tanto si el array viene directo en res o dentro de res.data
        const data = res?.data || res;
        alumnos.value = Array.isArray(data) ? data : [];
    } catch (error) {
        errorCarga.value =
            error?.response?.data?.message ||
            error?.response?.data?.mensaje ||
            error?.message ||
            "Error crítico de red al sincronizar el padrón de alumnos.";
    } finally {
        cargando.value = false;
    }
};

const fetchCursos = async () => {
    try {
        const res = await obtenerCursos();
        const data = res?.data || res;
        cursosDisponibles.value = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error(
            "No se pudieron cargar los cursos disponibles:",
            error?.response?.data?.message || error?.message || error,
        );
    }
};

const guardarAlumno = async () => {
    errorGuardar.value = "";
    exitoGuardar.value = false;

    if (!validarTodo()) return;

    guardando.value = true;

    try {
        const payload = { 
            ...form.value,
            fecha_nacimiento: parseDisplayDate(form.value.fecha_nacimiento),
        };
        if (payload.id_curso === "") {
            payload.id_curso = null;
        }

        if (vistaActiva.value === "crear") {
            await crearAlumno(payload);
        } else {
            await modificarAlumno(payload);
        }
        exitoGuardar.value = true;
        await fetchAlumnos();
        setTimeout(() => cambiarVista("lista"), 800);
    } catch (error) {
        errorGuardar.value =
            error?.response?.data?.message ||
            error?.response?.data?.mensaje ||
            error?.message ||
            "No se pudo actualizar la ficha del alumno.";
    } finally {
        guardando.value = false;
    }
};

const pedirConfirmacion = (alumno) => {
    alumnoAEliminar.value = alumno;
    errorEliminar.value = "";
};

const confirmarEliminar = async () => {
    eliminando.value = true;
    errorEliminar.value = "";

    try {
        const respuesta = await darDeBajaAlumno(alumnoAEliminar.value.id_alumno);

        if (respuesta && respuesta.success === false) {
            errorEliminar.value =
                respuesta.message ||
                respuesta.mensaje ||
                "No se pudo completar la baja.";
        } else {
            // Refrescamos la lista completa desde la API para reflejar el cambio de estado
            await fetchAlumnos();
            alumnoAEliminar.value = null;
        }
    } catch (error) {
        errorEliminar.value =
            error?.response?.data?.message ||
            error?.response?.data?.mensaje ||
            error?.message ||
            "Ocurrió un error inesperado al dar de baja el registro.";
    } finally {
        eliminando.value = false;
    }
};

// ── Hooks de entrada ─────────────────────────────────────────────────────────
onMounted(() => {
    fetchAlumnos();
    fetchCursos();
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
.input-error {
    border-color: #ef4444 !important;
}
.field-error {
    font-size: 11px;
    color: #ef4444;
    margin-top: 2px;
}
.required {
    color: #cd322c;
    margin-left: 2px;
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

/* ── Filtro de bajas ───────────────────────────────────────────────── */
.card-header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
}
.toggle-bajas {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    cursor: pointer;
    color: #6b7280;
    padding: 4px 8px;
    border-radius: 5px;
    border: 1px solid #e5e7eb;
    transition: all 0.12s;
    user-select: none;
}
.toggle-bajas:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
}
.toggle-bajas input[type="checkbox"] {
    margin: 0;
    accent-color: #cd322c;
}
.toggle-label {
    font-weight: 500;
}

/* ── Badges de estado para alumnos ─────────────────────────────────── */
.sp-activo {
    background: #eaf3de;
    color: #3b6d11;
}
.sp-egresado {
    background: #e0f2fe;
    color: #0369a1;
}
.sp-baja {
    background: #fef2f2;
    color: #991b1b;
}
.sp-condicional {
    background: #fef08a;
    color: #a16207;
}

/* ── Fila de alumno dado de baja ───────────────────────────────────── */
.row-baja {
    opacity: 0.55;
}
.row-baja:hover {
    opacity: 1;
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
