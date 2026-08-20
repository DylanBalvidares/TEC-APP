<template>
    <div class="usuarios-wrapper">
        <div v-if="vistaActiva === 'lista'" class="search-bar-wrapper">
                <div class="search-box">
                    <i class="ti ti-search"></i>
                    <input
                        v-model="searchText"
                        type="text"
                        placeholder="Buscar usuario por nombre, apellido o email..."
                        aria-label="Buscar usuarios"
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

            <div v-if="vistaActiva === 'lista'" class="card animate-fade-in">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-users" aria-hidden="true"></i>
                        Gestión de usuarios
                    </div>
                    <button
                        @click="cambiarVista('crear')"
                        class="tb-btn primary sm"
                    >
                        <i class="ti ti-plus" aria-hidden="true"></i> Nuevo
                    </button>
                </div>

            <div class="table-responsive">
                <div v-if="cargando" class="empty-state">
                    <i
                        class="ti ti-loader animate-spin"
                        style="font-size: 24px; color: #cd322c"
                    ></i>
                    <p>Cargando usuarios...</p>
                </div>

                <div
                    v-else-if="errorCarga"
                    class="error-banner"
                    style="margin: 16px"
                >
                    <i class="ti ti-alert-circle"></i> {{ errorCarga }}
                    <button
                        class="tb-btn sm outline"
                        @click="fetchUsuarios"
                        style="margin-left: auto"
                    >
                        Reintentar
                    </button>
                </div>

                <template v-else-if="filteredData.length > 0">
                    <table
                        class="mini"
                        aria-label="Listado de usuarios"
                    >
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th class="action-cell">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="usuario in paginatedData"
                                :key="usuario.id_usuario"
                                class="table-row"
                            >
                                <td>
                                    <strong>{{ usuario.apellido }}</strong
                                    >, {{ usuario.nombre }}
                                </td>
                                <td class="email-cell">{{ usuario.email }}</td>
                                <td>
                                    <span class="status-pill sp-cargo">
                                        {{ usuario.rol?.nombre_rol || "Sin rol" }}
                                    </span>
                                </td>

                                <td class="action-cell">
                                    <div class="action-buttons">
                                        <button
                                            @click="cambiarVista('detalles', usuario)"
                                            class="icon-btn view"
                                            title="Ver detalles"
                                            aria-label="Ver detalles"
                                        >
                                            <i class="ti ti-eye"></i>
                                        </button>
                                        <button
                                            @click="cambiarVista('editar', usuario)"
                                            class="icon-btn edit"
                                            title="Editar"
                                            aria-label="Editar"
                                        >
                                            <i class="ti ti-edit"></i>
                                        </button>
                                        <button
                                            @click="pedirConfirmacion(usuario)"
                                            class="icon-btn delete"
                                            title="Eliminar"
                                            aria-label="Eliminar"
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
                        class="ti ti-users"
                        style="font-size: 28px; opacity: 0.4"
                    ></i>
                    <p v-if="searchText">No hay usuarios que coincidan con "{{ searchText }}".</p>
                    <p v-else>No hay usuarios registrados todavía.</p>
                </div>
            </div>
        </div>

        <div
            v-if="vistaActiva === 'detalles' && usuarioSeleccionado"
            class="card animate-fade-in"
        >
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-info-circle"></i>
                    {{ usuarioSeleccionado.nombre }}
                    {{ usuarioSeleccionado.apellido }}
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
                        <span class="detail-label">Nombre completo</span>
                        <span class="detail-value">
                            {{ usuarioSeleccionado.nombre }}
                            {{ usuarioSeleccionado.apellido }}
                        </span>
                    </div>

                    <div class="detail-item">
                        <span class="detail-label">Email</span>
                        <span class="detail-value">{{
                            usuarioSeleccionado.email
                        }}</span>
                    </div>

                    <div class="detail-item">
                        <span class="detail-label">Rol</span>
                        <span class="detail-value">
                            {{
                                usuarioSeleccionado.rol?.nombre_rol || "Sin rol"
                            }}
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Contraseña</span>
                        <span class="detail-value"> ******** </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">ID Usuario</span>
                        <span class="detail-value">{{
                            usuarioSeleccionado.id_usuario || "No asignado"
                        }}</span>
                    </div>
                </div>
            </div>

            <div class="card-footer">
                <button @click="cambiarVista('lista')" class="tb-btn outline">
                    Cerrar
                </button>
                <button
                    @click="cambiarVista('editar', usuarioSeleccionado)"
                    class="tb-btn primary"
                >
                    <i class="ti ti-edit"></i> Editar
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
                                ? 'ti ti-plus'
                                : 'ti ti-edit'
                        "
                    ></i>
                    {{
                        vistaActiva === "crear"
                            ? "Nuevo usuario"
                            : "Editar usuario"
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

            <form @submit.prevent="guardarUsuario" class="form-body">                    <div class="form-row">
                    <div class="form-group">
                        <label>Nombre <span class="required">*</span></label>
                        <input ref="primerInputRef" v-model="form.nombre" :class="{ 'input-error': erroresForm.nombre }" @blur="validarCampo('nombre')" required />
                        <span v-if="erroresForm.nombre" class="field-error">{{ erroresForm.nombre }}</span>
                    </div>
                        <div class="form-group">
                            <label>Apellido <span class="required">*</span></label>
                            <input v-model="form.apellido" :class="{ 'input-error': erroresForm.apellido }" @blur="validarCampo('apellido')" required />
                            <span v-if="erroresForm.apellido" class="field-error">{{ erroresForm.apellido }}</span>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Email <span class="required">*</span></label>
                            <input v-model="form.email" type="email" :class="{ 'input-error': erroresForm.email }" @blur="validarCampo('email')" required />
                            <span v-if="erroresForm.email" class="field-error">{{ erroresForm.email }}</span>
                        </div>
                        <div class="form-group">
                            <label>Contraseña <span v-if="vistaActiva === 'crear'" class="required">*</span></label>
                            <input
                                v-model="form.contrasena"
                                type="password"
                                :required="vistaActiva === 'crear'"
                                :class="{ 'input-error': erroresForm.contrasena }"
                                @blur="validarCampo('contrasena')"
                                placeholder="Dejar en blanco para conservar la actual"
                            />
                            <span v-if="erroresForm.contrasena" class="field-error">{{ erroresForm.contrasena }}</span>
                        </div>
                    </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Rol</label>
                        <select v-model="form.id_rol" required>
                            <option :value="null" disabled>
                                Seleccione un rol...
                            </option>
                            <option
                                v-for="rol in listaRoles"
                                :key="rol.id_rol"
                                :value="rol.id_rol"
                            >
                                {{ rol.nombre_rol }}
                            </option>
                        </select>
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
                        <i class="ti ti-check"></i> Usuario guardado
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
                                ? "Guardando..."
                                : vistaActiva === "crear"
                                  ? "Registrar usuario"
                                  : "Actualizar usuario"
                        }}
                    </button>
                </div>
            </form>
        </div>

        <div
            v-if="usuarioAEliminar"
            class="modal-overlay"
            @click.self="usuarioAEliminar = null"
        >
            <div class="modal-card animate-fade-in">
                <div class="modal-header">
                    <i
                        class="ti ti-alert-triangle"
                        style="color: #cd322c; font-size: 20px"
                    ></i>
                    <h3>Eliminar usuario</h3>
                </div>

                <p class="modal-body">
                    ¿Seguro que querés eliminar a
                    <strong>
                        {{ usuarioAEliminar.nombre }}
                        {{ usuarioAEliminar.apellido }} </strong
                    >? Esta acción no se puede deshacer.
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
                        @click="usuarioAEliminar = null"
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
                        {{ eliminando ? "Eliminando..." : "Sí, eliminar" }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";

import {
    obtenerUsuarios,
    crearUsuario,
    modificarUsuario,
    eliminarUsuario,
    obtenerRoles,
} from "../../../services/usuarios-services.js";
import {
    validarRequerido,
    validarLongitudMinima,
    validarEmail,
    validarContrasena,
    validarFormulario,
} from "../../../utils/validators.js";
import { useTableControls } from "../../../composables/useTableControls.js";
import Pagination from "../../ui/Pagination.vue";

const usuarios = ref([]);

// ── Refs para autofocus ──────────────────────────────────────────────────
const primerInputRef = ref(null);

// ── Filtros y Paginación ────────────────────────────────────────────────
const filterFn = (item, q) => {
    const texto = `${item.nombre} ${item.apellido} ${item.email} ${item.rol?.nombre_rol || ""}`.toLowerCase();
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
} = useTableControls(usuarios, { pageSize: 10, filterFn });
const cargando = ref(false);
const guardando = ref(false);
const eliminando = ref(false);
const vistaActiva = ref("lista"); // 'lista' | 'crear' | 'editar' | 'detalles'
const usuarioSeleccionado = ref(null);
const usuarioAEliminar = ref(null);
const errorEliminar = ref("");

const errorCarga = ref("");
const errorGuardar = ref("");
const exitoGuardar = ref(false);

const listaRoles = ref([]);

const formVacio = () => ({
    id_usuario: null,
    nombre: "",
    apellido: "",
    email: "",
    contrasena: "",
    id_rol: null,
});

const form = ref(formVacio());

// ── Validación ────────────────────────────────────────────────────────────────
const erroresForm = ref({});

function getReglasValidacion() {
    const reglas = {
        nombre: (v) => validarRequerido(v, "El nombre") || validarLongitudMinima(v, 2, "El nombre"),
        apellido: (v) => validarRequerido(v, "El apellido") || validarLongitudMinima(v, 2, "El apellido"),
        email: validarEmail,
    };
    if (vistaActiva.value === "crear") {
        reglas.contrasena = (v) => validarContrasena(v, true);
    }
    return reglas;
}

function validarCampo(campo) {
    const reglas = getReglasValidacion();
    if (reglas[campo]) {
        erroresForm.value[campo] = reglas[campo](form.value[campo]);
    }
}

function validarTodo() {
    erroresForm.value = validarFormulario(form.value, getReglasValidacion());
    return Object.keys(erroresForm.value).length === 0;
}

function limpiarErrores() {
    erroresForm.value = {};
}

// ── Navegación entre vistas ──────────────────────────────────────────────────
const cambiarVista = (nuevaVista, usuario = null) => {
    vistaActiva.value = nuevaVista;
    errorGuardar.value = "";
    exitoGuardar.value = false;

    if (nuevaVista === "editar" && usuario) {
        form.value = {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            email: usuario.email,
            contrasena: "",
            id_rol: usuario.id_rol ?? usuario.rol?.id_rol ?? null,
        };
        limpiarErrores();
    } else if (nuevaVista === "crear") {
        form.value = formVacio();
        limpiarErrores();
        nextTick(() => primerInputRef.value?.focus());
    } else if (nuevaVista === "detalles" && usuario) {
        usuarioSeleccionado.value = usuario;
    }
};

// ── CRUD ─────────────────────────────────────────────────────────────────────
const fetchUsuarios = async () => {
    cargando.value = true;
    errorCarga.value = "";
    try {
        const res = await obtenerUsuarios();

        const data = res?.data || res;
        usuarios.value = Array.isArray(data) ? data : data?.data || [];
    } catch (e) {
        errorCarga.value =
            e?.response?.data?.message ||
            e?.response?.data?.mensaje ||
            e?.message ||
            "Error crítico de red al sincronizar el padrón de usuarios.";
    } finally {
        cargando.value = false;
    }
};

const fetchRoles = async () => {
    try {
        const res = await obtenerRoles();
        const data = res.data;
        listaRoles.value = Array.isArray(data) ? data : [];
    } catch {
        console.error("No se pudieron cargar los roles.");
    }
};

const guardarUsuario = async () => {
    errorGuardar.value = "";
    exitoGuardar.value = false;

    if (!validarTodo()) return;

    guardando.value = true;

    try {
        const payload = { ...form.value };

        let res;
        if (vistaActiva.value === "crear") {
            res = await crearUsuario(payload);
        } else {
            res = await modificarUsuario(payload);
        }
        if (res && !res.success) {
            errorGuardar.value = res.message || "Error al guardar";
            guardando.value = false;
            return;
        }
        exitoGuardar.value = true;
        await fetchUsuarios();
        setTimeout(() => cambiarVista("lista"), 800);
    } catch (e) {
        errorGuardar.value =
            e?.response?.data?.message ||
            "Error al guardar los datos del usuario. Intentá de nuevo.";
    } finally {
        guardando.value = false;
    }
};

const pedirConfirmacion = (usuario) => {
    usuarioAEliminar.value = usuario;
    errorEliminar.value = "";
};

const confirmarEliminar = async () => {
    eliminando.value = true;
    errorEliminar.value = "";

    try {
        const respuesta = await eliminarUsuario(
            usuarioAEliminar.value.id_usuario,
        );

        // Ajustá esta validación según cómo devuelva los datos tu API
        if (respuesta?.success) {
            usuarios.value = usuarios.value.filter(
                (u) => u.id_usuario !== usuarioAEliminar.value.id_usuario,
            );
            usuarioAEliminar.value = null;
        } else {
            errorEliminar.value = respuesta?.message || "Error al eliminar";
        }
    } catch (e) {
        errorEliminar.value =
            "Ocurrió un error inesperado al eliminar al usuario.";
    } finally {
        eliminando.value = false;
    }
};

// ── Lifecycle ────────────────────────────────────────────────────────────────
onMounted(() => {
    fetchUsuarios();
    fetchRoles();
});
</script>

<style scoped>
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

.usuarios-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 900px;
}

/* Card */
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

/* Tabla */
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
.email-cell {
    color: var(--color-text-tertiary, #6b7280);
}

/* Badges / Pills */
.status-pill {
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 4px;
    font-weight: 600;
    display: inline-block;
    text-transform: capitalize;
}
.sp-cargo {
    background: #e0f2fe;
    color: #0369a1;
}
.sp-activo {
    background: #eaf3de;
    color: #3b6d11;
}
.sp-baja {
    background: #fee2e2;
    color: #991b1b;
}
.sp-licencia {
    background: #fef08a;
    color: #854d0e;
}

/* Acciones tabla */
.action-cell {
    text-align: right;
    width: 110px;
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

/* Botones Generales */
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
.tb-btn.danger {
    background: #cd322c;
    color: white;
}
.tb-btn.danger:hover {
    background: #a52420;
}
.tb-btn.sm {
    padding: 6px 12px;
    font-size: 12px;
}
.tb-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Formulario */
.form-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
}
.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}
.form-row.triple {
    grid-template-columns: 1fr 1fr 1fr;
}
.form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.form-group label {
    font-size: 12px;
    font-weight: 600;
    color: #4b5563;
}
.form-group input,
.form-group select {
    padding: 9px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 13px;
    outline: none;
    background: white;
    transition:
        border-color 0.2s,
        box-shadow 0.2s;
}
.form-group input:focus,
.form-group select:focus {
    border-color: #cd322c;
    box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.1);
}

/* Detalles */
.details-view {
    display: flex;
    flex-direction: column;
    gap: 20px;
}
.detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}
.detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    background: #f9fafb;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid #f3f4f6;
}
.detail-label {
    font-size: 11px;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 600;
}
.detail-value {
    font-size: 14px;
    color: #111827;
    font-weight: 500;
}

/* Banners */
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
.exito-banner {
    display: flex;
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

/* Empty state */
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
    background: rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
}
.modal-card {
    background: #fff;
    border-radius: 10px;
    padding: 24px;
    width: 100%;
    max-width: 400px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
.modal-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
}
.modal-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
}
.modal-body {
    font-size: 13px;
    color: #4b5563;
    margin-bottom: 20px;
    line-height: 1.6;
}
.modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}
</style>
