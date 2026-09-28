<template>
    <div class="planes-wrapper">
        <div v-if="vistaActiva === 'lista'" class="metrics animate-fade-in">
            <div class="metric-card">
                <div class="metric-label">
                    <i class="ti ti-layers" aria-hidden="true"></i>Total Planes
                </div>
                <div class="metric-value">{{ planes.length }}</div>
                <span class="metric-badge badge-green">
                    <i class="ti ti-check"></i>{{ cantVigentes }} vigente(s)
                </span>
            </div>
            <div class="metric-card">
                <div class="metric-label">
                    <i class="ti ti-book" aria-hidden="true"></i>Orientaciones
                </div>
                <div class="metric-value">{{ cantOrientaciones }}</div>
                <span class="metric-badge badge-gray">Un vigente por orientación</span>
            </div>
        </div>

        <div v-if="vistaActiva === 'lista'" class="search-bar-wrapper">
            <div class="search-box">
                <i class="ti ti-search"></i>
                <input v-model="searchText" type="text" placeholder="Buscar plan por nombre, código u orientación..." aria-label="Buscar planes" />
                <button v-if="searchText" class="search-clear" @click="searchText = ''; goToPage(1)" aria-label="Limpiar búsqueda"><i class="ti ti-x"></i></button>
            </div>
        </div>

        <div v-if="vistaActiva === 'lista'" class="card animate-fade-in" style="margin-top: 0">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-layers" aria-hidden="true"></i>
                    Planes de Estudio
                </div>
                <button @click="cambiarVista('crear')" class="tb-btn primary sm">
                    <i class="ti ti-plus" aria-hidden="true"></i> Nuevo Plan
                </button>
            </div>

            <div class="table-responsive">
                <DataTable
                    :columnas="columnasPlanes"
                    :filas="paginatedData"
                    clave-fila="id_plan"
                    :total="totalItems"
                    :pagina="currentPage"
                    :por-pagina="pageSize"
                    :orden-key="sortKey"
                    :orden-dir="sortDir"
                    :cargando="cargando"
                    texto-carga="Cargando planes de estudio..."
                    :error="errorCarga"
                    etiqueta="Listado de planes de estudio"
                    icono-vacio="ti-file-x"
                    :busqueda-activa="!!searchText"
                    @ordenar="toggleSort"
                    @pagina="goToPage"
                    @por-pagina="setPageSize"
                    @reintentar="fetchPlanes"
                >
                    <template #celda-nombre="{ fila: plan }">
                        <strong>{{ plan.nombre }}</strong>
                    </template>
                    <template #celda-codigo="{ fila: plan }">
                        <span class="mono">{{ plan.codigo }}</span>
                    </template>
                    <template #celda-estado="{ fila: plan }">
                        <span class="metric-badge" :class="plan.estado === 'vigente' ? 'badge-green' : 'badge-gray'">
                            {{ etiquetaEstado(plan.estado) }}
                        </span>
                    </template>
                    <template #celda-materias="{ fila: plan }">
                        {{ (plan.materiasPlan || []).length }}
                    </template>
                    <template #acciones="{ fila: plan }">
                        <div class="action-buttons">
                            <button @click="cambiarVista('detalles', plan)" class="icon-btn view" title="Ver detalles">
                                <i class="ti ti-eye"></i>
                            </button>
                            <button @click="cambiarVista('editar', plan)" class="icon-btn edit" title="Editar">
                                <i class="ti ti-edit"></i>
                            </button>
                            <button @click="pedirConfirmacion(plan)" class="icon-btn delete" title="Eliminar">
                                <i class="ti ti-trash"></i>
                            </button>
                        </div>
                    </template>
                    <template #vacio>
                        <i class="ti ti-file-x" style="font-size: 28px; opacity: 0.4"></i>
                        <p v-if="searchText">No se encontraron planes que coincidan con "{{ searchText }}".</p>
                        <p v-else>No hay planes de estudio registrados.</p>
                    </template>
                </DataTable>
            </div>
        </div>

        <!-- DETALLES + GESTIÓN DE CONTENIDO -->
        <div v-if="vistaActiva === 'detalles' && planSeleccionado" class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-clipboard-list"></i>
                    {{ planSeleccionado.nombre }}
                    <span class="metric-badge" :class="planSeleccionado.estado === 'vigente' ? 'badge-green' : 'badge-gray'" style="margin-left: 8px">
                        {{ etiquetaEstado(planSeleccionado.estado) }}
                    </span>
                </div>
                <button @click="cambiarVista('lista')" class="icon-btn" aria-label="Volver">
                    <i class="ti ti-arrow-left"></i>
                </button>
            </div>

            <div class="card-body details-view">
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Código</span>
                        <span class="detail-value mono">{{ planSeleccionado.codigo }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Orientación</span>
                        <span class="detail-value">{{ planSeleccionado.orientacion }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Duración</span>
                        <span class="detail-value">{{ planSeleccionado.duracion_anios ? `${planSeleccionado.duracion_anios} años` : "No definida" }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Vigencia</span>
                        <span class="detail-value">{{ rangoVigencia(planSeleccionado) }}</span>
                    </div>
                    <div class="detail-item" style="grid-column: span 2">
                        <span class="detail-label">Descripción</span>
                        <span class="detail-value">{{ planSeleccionado.descripcion || "Sin descripción registrada" }}</span>
                    </div>
                </div>

                <div class="info-box">
                    <i class="ti ti-info-circle"></i>
                    <p>
                        Solo puede haber <strong>un plan vigente por orientación</strong>.
                        Al activar uno, los demás vigentes de la misma orientación pasan a
                        histórico automáticamente. Los planes históricos son de solo lectura.
                    </p>
                </div>

                <div class="plan-acciones">
                    <button v-if="planSeleccionado.estado !== 'vigente'" @click="cambiarEstado('vigente')" class="tb-btn primary sm" :disabled="guardando">
                        <i class="ti ti-check"></i> Activar como vigente
                    </button>
                    <button v-if="planSeleccionado.estado === 'vigente'" @click="cambiarEstado('historico')" class="tb-btn outline sm" :disabled="guardando">
                        <i class="ti ti-archive"></i> Pasar a histórico
                    </button>
                    <button @click="clonarPlan" class="tb-btn outline sm" :disabled="clonando">
                        <i class="ti ti-copy" :class="{ 'animate-spin': clonando }"></i>
                        {{ clonando ? "Clonando..." : "Clonar plan" }}
                    </button>
                </div>
                <div v-if="errorContenido" class="error-banner" style="margin-top: 12px">
                    <i class="ti ti-alert-circle"></i> {{ errorContenido }}
                </div>

                <h3 class="plan-subtitulo"><i class="ti ti-books"></i> Materias por año</h3>
                <PlanEstudioDetalle :plan="planSeleccionado" @quitar-materia="quitarMateria" @quitar-correlativa="quitarCorrelativa" :editable="editable" />

                <div v-if="editable" class="card" style="margin-top: 16px">
                    <div class="card-header">
                        <div class="card-title"><i class="ti ti-plus"></i> Agregar materia al plan</div>
                    </div>
                    <form @submit.prevent="agregarMateria" class="form-body">
                        <div class="form-row">
                            <div class="form-group" style="grid-column: span 1">
                                <label for="sel-materia">Materia <span class="required">*</span></label>
                                <select id="sel-materia" v-model="formVinculo.id_materia" required>
                                    <option :value="null" disabled>Seleccionar...</option>
                                    <option v-for="m in materiasCatalogo" :key="m.id_materia" :value="m.id_materia">
                                        {{ m.nombre_materia }}
                                    </option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="sel-anio">Año <span class="required">*</span></label>
                                <select id="sel-anio" v-model="formVinculo.anio" required>
                                    <option :value="null" disabled>Seleccionar...</option>
                                    <option v-for="a in 7" :key="a" :value="a">{{ a }}º año</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="sel-cuat">Régimen</label>
                                <select id="sel-cuat" v-model="formVinculo.cuatrimestre">
                                    <option value="anual">Anual</option>
                                    <option value="1">1º cuatrimestre</option>
                                    <option value="2">2º cuatrimestre</option>
                                </select>
                            </div>
                        </div>
                        <div class="card-footer" style="padding: 14px 0 0 0; border: none; background: transparent">
                            <button type="submit" class="tb-btn primary sm" :disabled="guardando">
                                <i class="ti ti-plus"></i> Agregar al plan
                            </button>
                        </div>
                    </form>
                </div>

                <div v-if="editable" class="card" style="margin-top: 16px">
                    <div class="card-header">
                        <div class="card-title"><i class="ti ti-git-branch"></i> Agregar correlativa</div>
                    </div>
                    <form @submit.prevent="agregarCorrelativaForm" class="form-body">
                        <div class="form-row">
                            <div class="form-group" style="grid-column: span 1">
                                <label for="sel-corr-mat">Materia <span class="required">*</span></label>
                                <select id="sel-corr-mat" v-model="formCorr.id_plan_materia" required>
                                    <option :value="null" disabled>Seleccionar...</option>
                                    <option v-for="pm in vinculosPlan" :key="pm.id_plan_materia" :value="pm.id_plan_materia">
                                        {{ pm.materia?.nombre_materia }} ({{ pm.anio }}º)
                                    </option>
                                </select>
                            </div>
                            <div class="form-group" style="grid-column: span 1">
                                <label for="sel-corr-req">Requiere <span class="required">*</span></label>
                                <select id="sel-corr-req" v-model="formCorr.id_plan_materia_req" required>
                                    <option :value="null" disabled>Seleccionar...</option>
                                    <option v-for="pm in vinculosPlan" :key="pm.id_plan_materia" :value="pm.id_plan_materia">
                                        {{ pm.materia?.nombre_materia }} ({{ pm.anio }}º)
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="card-footer" style="padding: 14px 0 0 0; border: none; background: transparent">
                            <button type="submit" class="tb-btn primary sm" :disabled="guardando">
                                <i class="ti ti-plus"></i> Agregar correlativa
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div class="card-footer">
                <button @click="cambiarVista('lista')" class="tb-btn outline">Volver al listado</button>
                <button @click="cambiarVista('editar', planSeleccionado)" class="tb-btn primary">
                    <i class="ti ti-edit"></i> Modificar Plan
                </button>
            </div>
        </div>

        <!-- CREAR / EDITAR -->
        <div v-if="['crear', 'editar'].includes(vistaActiva)" class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i :class="vistaActiva === 'crear' ? 'ti ti-file-plus' : 'ti ti-edit'"></i>
                    {{ vistaActiva === "crear" ? "Registrar Nuevo Plan" : "Modificar Plan Existente" }}
                </div>
                <button @click="cambiarVista('lista')" class="icon-btn" aria-label="Volver">
                    <i class="ti ti-arrow-left"></i>
                </button>
            </div>

            <form @submit.prevent="guardarPlan" class="form-body">
                <div class="form-row">
                    <div class="form-group" style="grid-column: span 1">
                        <label for="nombre">Nombre del Plan <span class="required">*</span></label>
                        <input type="text" id="nombre" ref="primerInputRef" v-model="form.nombre"
                            :class="{ 'input-error': erroresForm.nombre }" @blur="validarCampo('nombre')"
                            required placeholder="Ej: Técnico en Informática" />
                        <span v-if="erroresForm.nombre" class="field-error">{{ erroresForm.nombre }}</span>
                    </div>
                    <div class="form-group" style="grid-column: span 1">
                        <label for="codigo">Código <span class="required">*</span></label>
                        <input type="text" id="codigo" v-model="form.codigo"
                            :class="{ 'input-error': erroresForm.codigo }" @blur="validarCampo('codigo')"
                            required placeholder="Ej: INF-2026" />
                        <span v-if="erroresForm.codigo" class="field-error">{{ erroresForm.codigo }}</span>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="grid-column: span 1">
                        <label for="orientacion">Orientación <span class="required">*</span></label>
                        <input type="text" id="orientacion" v-model="form.orientacion"
                            :class="{ 'input-error': erroresForm.orientacion }" @blur="validarCampo('orientacion')"
                            required placeholder="Ej: Informática, Ciclo Básico..." />
                        <span v-if="erroresForm.orientacion" class="field-error">{{ erroresForm.orientacion }}</span>
                    </div>
                    <div class="form-group">
                        <label for="duracion">Duración (años)</label>
                        <input type="number" id="duracion" v-model="form.duracion_anios" min="1" max="7" placeholder="Ej: 3" />
                    </div>
                    <div class="form-group">
                        <label for="estado">Estado</label>
                        <select id="estado" v-model="form.estado">
                            <option value="borrador">Borrador</option>
                            <option value="vigente">Vigente</option>
                            <option value="historico">Histórico</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="grid-column: span 2">
                        <label for="descripcion">Descripción (opcional)</label>
                        <textarea id="descripcion" v-model="form.descripcion" rows="3"
                            placeholder="Detalle del plan de estudios..."></textarea>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group" style="grid-column: span 1">
                        <label for="vig-desde">Vigencia desde</label>
                        <input type="date" id="vig-desde" v-model="form.fecha_vigencia_desde" />
                    </div>
                    <div class="form-group" style="grid-column: span 1">
                        <label for="vig-hasta">Vigencia hasta</label>
                        <input type="date" id="vig-hasta" v-model="form.fecha_vigencia_hasta" />
                    </div>
                </div>

                <div class="card-footer" style="padding: 14px 0 0 0; border: none; background: transparent">
                    <div v-if="errorGuardar" class="error-banner">
                        <i class="ti ti-alert-circle"></i> {{ errorGuardar }}
                    </div>
                    <div v-if="exitoGuardar" class="exito-banner">
                        <i class="ti ti-check"></i> El plan se guardó correctamente.
                    </div>
                    <button type="button" @click="cambiarVista('lista')" class="tb-btn outline">Cancelar</button>
                    <button type="submit" class="tb-btn primary" :disabled="guardando">
                        <i class="ti ti-loader animate-spin" v-if="guardando"></i>
                        {{ guardando ? "Guardando..." : vistaActiva === "crear" ? "Confirmar Plan" : "Actualizar Plan" }}
                    </button>
                </div>
            </form>
        </div>

        <Modal v-model="modalEliminarAbierto" title="Eliminar Plan" variante="danger">
            <p class="modal-texto">
                ¿Estás seguro de que querés eliminar el plan
                <strong>{{ planAEliminar?.nombre }}</strong>?
                {{ planAEliminar?.estado === "vigente" ? "Los planes vigentes no se pueden eliminar." : "Se quitarán también sus materias y correlativas." }}
            </p>
            <div v-if="errorEliminar" class="error-banner" style="margin-bottom: 16px; width: 100%; box-sizing: border-box">
                <i class="ti ti-alert-circle"></i> {{ errorEliminar }}
            </div>
            <template #footer>
                <button class="tb-btn outline" @click="modalEliminarAbierto = false">Cancelar</button>
                <button class="tb-btn danger" @click="confirmarEliminar" :disabled="eliminando">
                    <i class="ti ti-loader animate-spin" v-if="eliminando"></i>
                    {{ eliminando ? "Eliminando..." : "Eliminar plan" }}
                </button>
            </template>
        </Modal>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";
import Modal from "../../ui/Modal.vue";
import PlanEstudioDetalle from "../../ui/PlanEstudioDetalle.vue";
import { toast } from "../../../services/toast-service.js";
import {
    obtenerPlanes,
    obtenerPlan,
    crearPlan,
    modificarPlan,
    eliminarPlan,
    agregarMateriaAPlan,
    quitarMateriaDePlan,
    agregarCorrelativa,
    quitarCorrelativa as quitarCorrelativaApi,
    obtenerMaterias,
} from "../../../services/academico-service.js";
import {
    validarRequerido,
    validarLongitudMinima,
    validarFormulario,
} from "../../../utils/validators.js";
import { useTableControls } from "../../../composables/useTableControls.js";
import DataTable from "../../ui/DataTable.vue";

// ── Estado ─────────────────────────────────────────────────────────────
const planes = ref([]);
const materiasCatalogo = ref([]);

const cantVigentes = computed(() => planes.value.filter((p) => p.estado === "vigente").length);
const cantOrientaciones = computed(() => new Set(planes.value.map((p) => p.orientacion)).size);

const cargando = ref(false);
const guardando = ref(false);
const eliminando = ref(false);
const clonando = ref(false);

const vistaActiva = ref("lista");
const planSeleccionado = ref(null);
const planAEliminar = ref(null);
const modalEliminarAbierto = ref(false);

const errorCarga = ref("");
const errorGuardar = ref("");
const errorEliminar = ref("");
const errorContenido = ref("");
const exitoGuardar = ref(false);

const editable = computed(() => planSeleccionado.value && planSeleccionado.value.estado !== "historico");
const vinculosPlan = computed(() => planSeleccionado.value?.materiasPlan || []);

// ── Filtros y paginación ───────────────────────────────────────────────
const filterFn = (item, q) => {
    const texto = `${item.nombre} ${item.codigo} ${item.orientacion || ""}`.toLowerCase();
    return texto.includes(q);
};
const { searchText, currentPage, pageSize, sortKey, sortDir, filteredData, paginatedData, totalItems, goToPage, setPageSize, toggleSort } =
    useTableControls(planes, { pageSize: 10, filterFn });

// ── Columnas del DataTable ─────────────────────────────────────────────────
const columnasPlanes = [
    { key: "nombre", titulo: "Nombre", ordenable: true },
    { key: "codigo", titulo: "Código", ordenable: true },
    { key: "orientacion", titulo: "Orientación", ordenable: true },
    { key: "estado", titulo: "Estado", ordenable: true },
    { key: "materias", titulo: "Materias", ordenable: true, getter: (p) => (p.materiasPlan || []).length },
    { key: "__acciones", titulo: "Acciones" },
];

// ── Formularios ────────────────────────────────────────────────────────
const primerInputRef = ref(null);

const formVacio = () => ({
    id_plan: null,
    nombre: "",
    codigo: "",
    orientacion: "",
    descripcion: "",
    duracion_anios: null,
    estado: "borrador",
    fecha_vigencia_desde: "",
    fecha_vigencia_hasta: "",
});
const form = ref(formVacio());
const formVinculo = ref({ id_materia: null, anio: null, cuatrimestre: "anual" });
const formCorr = ref({ id_plan_materia: null, id_plan_materia_req: null });

const erroresForm = ref({});
const REGLAS_VALIDACION = {
    nombre: (v) => validarRequerido(v, "El nombre") || validarLongitudMinima(v, 3, "El nombre"),
    codigo: (v) => validarRequerido(v, "El código") || validarLongitudMinima(v, 2, "El código"),
    orientacion: (v) => validarRequerido(v, "La orientación") || validarLongitudMinima(v, 3, "La orientación"),
};

function validarCampo(campo) {
    if (REGLAS_VALIDACION[campo]) erroresForm.value[campo] = REGLAS_VALIDACION[campo](form.value[campo]);
}
function validarTodo() {
    erroresForm.value = validarFormulario(form.value, REGLAS_VALIDACION);
    return Object.keys(erroresForm.value).length === 0;
}
function limpiarErrores() {
    erroresForm.value = {};
}

function etiquetaEstado(estado) {
    return estado === "vigente" ? "Vigente" : estado === "historico" ? "Histórico" : "Borrador";
}
function rangoVigencia(plan) {
    if (!plan.fecha_vigencia_desde && !plan.fecha_vigencia_hasta) return "Sin rango definido";
    return `${plan.fecha_vigencia_desde || "…"} → ${plan.fecha_vigencia_hasta || "…"}`;
}

// ── Navegación ─────────────────────────────────────────────────────────
const cambiarVista = (nuevaVista, plan = null) => {
    vistaActiva.value = nuevaVista;
    errorGuardar.value = "";
    errorContenido.value = "";
    exitoGuardar.value = false;

    if (nuevaVista === "editar" && plan) {
        form.value = {
            id_plan: plan.id_plan,
            nombre: plan.nombre || "",
            codigo: plan.codigo || "",
            orientacion: plan.orientacion || "",
            descripcion: plan.descripcion || "",
            duracion_anios: plan.duracion_anios ?? null,
            estado: plan.estado || "borrador",
            fecha_vigencia_desde: plan.fecha_vigencia_desde || "",
            fecha_vigencia_hasta: plan.fecha_vigencia_hasta || "",
        };
        limpiarErrores();
    } else if (nuevaVista === "crear") {
        form.value = formVacio();
        limpiarErrores();
        nextTick(() => primerInputRef.value?.focus());
    } else if (nuevaVista === "detalles" && plan) {
        planSeleccionado.value = plan;
        formVinculo.value = { id_materia: null, anio: null, cuatrimestre: "anual" };
        formCorr.value = { id_plan_materia: null, id_plan_materia_req: null };
    }
};

// ── Carga ──────────────────────────────────────────────────────────────
const fetchPlanes = async () => {
    cargando.value = true;
    errorCarga.value = "";
    try {
        const [resPlanes, resMat] = await Promise.all([obtenerPlanes(), obtenerMaterias()]);
        planes.value = Array.isArray(resPlanes.data) ? resPlanes.data : [];
        materiasCatalogo.value = Array.isArray(resMat.data) ? resMat.data : [];
        if (planSeleccionado.value) await refrescarSeleccionado();
    } catch (error) {
        console.error("Error al obtener planes:", error);
        errorCarga.value = "Error al cargar los planes de estudio del servidor.";
    } finally {
        cargando.value = false;
    }
};

const refrescarSeleccionado = async () => {
    if (!planSeleccionado.value) return;
    const res = await obtenerPlan(planSeleccionado.value.id_plan);
    if (res.success) {
        planSeleccionado.value = res.data;
        const idx = planes.value.findIndex((p) => p.id_plan === res.data.id_plan);
        if (idx >= 0) planes.value[idx] = res.data;
    }
};

// ── CRUD plan ──────────────────────────────────────────────────────────
const guardarPlan = async () => {
    errorGuardar.value = "";
    exitoGuardar.value = false;
    if (!validarTodo()) return;
    guardando.value = true;
    try {
        const payload = { ...form.value };
        if (!payload.duracion_anios) payload.duracion_anios = null;
        if (!payload.fecha_vigencia_desde) payload.fecha_vigencia_desde = null;
        if (!payload.fecha_vigencia_hasta) payload.fecha_vigencia_hasta = null;
        const res = vistaActiva.value === "crear" ? await crearPlan(payload) : await modificarPlan(payload);
        if (!res.success) throw new Error(res.message);
        exitoGuardar.value = true;
        toast.success(vistaActiva.value === "crear" ? "Plan creado correctamente." : "Plan actualizado correctamente.");
        await fetchPlanes();
        cambiarVista("lista");
    } catch (e) {
        errorGuardar.value = e?.message || "No se pudo guardar el plan.";
    } finally {
        guardando.value = false;
    }
};

const pedirConfirmacion = (plan) => {
    planAEliminar.value = plan;
    errorEliminar.value = "";
    modalEliminarAbierto.value = true;
};

const confirmarEliminar = async () => {
    eliminando.value = true;
    errorEliminar.value = "";
    try {
        const respuesta = await eliminarPlan(planAEliminar.value.id_plan);
        if (respuesta.success) {
            planes.value = planes.value.filter((p) => p.id_plan !== planAEliminar.value.id_plan);
            modalEliminarAbierto.value = false;
            planAEliminar.value = null;
            toast.success("Plan eliminado correctamente.");
        } else {
            errorEliminar.value = respuesta.message;
        }
    } catch (e) {
        errorEliminar.value = "Ocurrió un error inesperado al eliminar el plan.";
    } finally {
        eliminando.value = false;
    }
};

// ── Gestión de contenido ───────────────────────────────────────────────
const cambiarEstado = async (nuevoEstado) => {
    errorContenido.value = "";
    guardando.value = true;
    try {
        const res = await modificarPlan({ id_plan: planSeleccionado.value.id_plan, estado: nuevoEstado });
        if (!res.success) throw new Error(res.message);
        toast.success(nuevoEstado === "vigente" ? "Plan activado como vigente." : "Plan pasado a histórico.");
        await fetchPlanes();
    } catch (e) {
        errorContenido.value = e?.message || "No se pudo cambiar el estado.";
    } finally {
        guardando.value = false;
    }
};

const agregarMateria = async () => {
    errorContenido.value = "";
    if (!formVinculo.value.id_materia || !formVinculo.value.anio) {
        errorContenido.value = "Seleccioná la materia y el año.";
        return;
    }
    guardando.value = true;
    try {
        const res = await agregarMateriaAPlan(planSeleccionado.value.id_plan, {
            id_materia: formVinculo.value.id_materia,
            anio: formVinculo.value.anio,
            cuatrimestre: formVinculo.value.cuatrimestre,
        });
        if (!res.success) throw new Error(res.message);
        toast.success("Materia agregada al plan.");
        formVinculo.value = { id_materia: null, anio: null, cuatrimestre: "anual" };
        await fetchPlanes();
    } catch (e) {
        errorContenido.value = e?.message || "No se pudo agregar la materia.";
    } finally {
        guardando.value = false;
    }
};

const quitarMateria = async (idPlanMateria) => {
    errorContenido.value = "";
    try {
        const res = await quitarMateriaDePlan(idPlanMateria);
        if (!res.success) throw new Error(res.message);
        toast.success("Materia quitada del plan.");
        await fetchPlanes();
    } catch (e) {
        errorContenido.value = e?.message || "No se pudo quitar la materia.";
    }
};

const agregarCorrelativaForm = async () => {
    errorContenido.value = "";
    if (!formCorr.value.id_plan_materia || !formCorr.value.id_plan_materia_req) {
        errorContenido.value = "Seleccioná la materia y su requerida.";
        return;
    }
    guardando.value = true;
    try {
        const res = await agregarCorrelativa(formCorr.value.id_plan_materia, formCorr.value.id_plan_materia_req);
        if (!res.success) throw new Error(res.message);
        toast.success("Correlativa agregada.");
        formCorr.value = { id_plan_materia: null, id_plan_materia_req: null };
        await fetchPlanes();
    } catch (e) {
        errorContenido.value = e?.message || "No se pudo agregar la correlativa.";
    } finally {
        guardando.value = false;
    }
};

const quitarCorrelativa = async (idPlanMateria, idReq) => {
    errorContenido.value = "";
    try {
        const res = await quitarCorrelativaApi(idPlanMateria, idReq);
        if (!res.success) throw new Error(res.message);
        toast.success("Correlativa eliminada.");
        await fetchPlanes();
    } catch (e) {
        errorContenido.value = e?.message || "No se pudo quitar la correlativa.";
    }
};

const clonarPlan = async () => {
    errorContenido.value = "";
    clonando.value = true;
    try {
        const origen = planSeleccionado.value;
        const resPlan = await crearPlan({
            nombre: `${origen.nombre} (copia)`,
            codigo: `${origen.codigo}-COPIA`,
            orientacion: origen.orientacion,
            descripcion: origen.descripcion,
            duracion_anios: origen.duracion_anios,
            estado: "borrador",
        });
        if (!resPlan.success) throw new Error(resPlan.message);
        const idNuevo = resPlan.data.id_plan;
        const mapaIds = {};
        for (const pm of origen.materiasPlan || []) {
            const resPm = await agregarMateriaAPlan(idNuevo, {
                id_materia: pm.id_materia,
                anio: pm.anio,
                cuatrimestre: pm.cuatrimestre,
            });
            if (!resPm.success) throw new Error(resPm.message);
            mapaIds[pm.id_plan_materia] = resPm.data.id_plan_materia;
        }
        for (const pm of origen.materiasPlan || []) {
            for (const c of pm.correlativas || []) {
                const nuevoOrigen = mapaIds[pm.id_plan_materia];
                const nuevoReq = mapaIds[c.id_plan_materia_req];
                if (nuevoOrigen && nuevoReq) await agregarCorrelativa(nuevoOrigen, nuevoReq);
            }
        }
        toast.success("Plan clonado como borrador.");
        await fetchPlanes();
    } catch (e) {
        errorContenido.value = e?.message || "No se pudo clonar el plan.";
    } finally {
        clonando.value = false;
    }
};

onMounted(() => {
    fetchPlanes();
});
</script>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.22s ease-in-out;
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
}
.plan-acciones {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
}
.plan-subtitulo {
    margin: 20px 0 8px;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;
}
.mono {
    font-family: monospace;
}
</style>
