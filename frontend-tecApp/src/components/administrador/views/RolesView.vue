<template>
    <div class="roles-wrapper">
        <div class="roles-grid">
            <!-- ── Panel izquierdo: listado de roles ── -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-shield" aria-hidden="true"></i>
                        Roles del sistema
                    </div>
                    <button
                        @click="abrirModalRol('crear')"
                        class="tb-btn primary sm"
                    >
                        <i class="ti ti-plus" aria-hidden="true"></i> Nuevo
                    </button>
                </div>

                <div v-if="cargando" class="empty-state">
                    <i
                        class="ti ti-loader animate-spin"
                        style="font-size: 24px; color: #cd322c"
                    ></i>
                    <p>Cargando roles...</p>
                </div>

                <div
                    v-else-if="errorCarga"
                    class="error-banner"
                    style="margin: 16px"
                >
                    <i class="ti ti-alert-circle"></i> {{ errorCarga }}
                    <button
                        class="tb-btn sm outline"
                        @click="fetchRoles"
                        style="margin-left: auto"
                    >
                        Reintentar
                    </button>
                </div>

                <template v-else>
                    <div
                        v-for="rol in roles"
                        :key="rol.id_rol"
                        class="rol-item"
                        :class="{ selected: rolSeleccionado?.id_rol === rol.id_rol }"
                        @click="intentarSeleccionarRol(rol)"
                    >
                        <div class="rol-avatar">
                            {{ iniciales(rol.nombre_rol) }}
                        </div>
                        <div class="rol-info">
                            <div class="rol-nombre">
                                {{ rol.nombre_rol }}
                                <span
                                    v-if="rol.es_sistema"
                                    class="status-pill sp-sistema"
                                >
                                    sistema
                                </span>
                            </div>
                            <div class="rol-sub">
                                {{ conteoTexto(rol) }}
                            </div>
                        </div>
                        <div
                            class="rol-acciones"
                            @click.stop
                        >
                            <button
                                class="icon-btn edit"
                                title="Editar nombre"
                                aria-label="Editar rol"
                                :disabled="rol.es_sistema"
                                @click="abrirModalRol('editar', rol)"
                            >
                                <i class="ti ti-edit"></i>
                            </button>
                            <button
                                class="icon-btn delete"
                                title="Eliminar"
                                aria-label="Eliminar rol"
                                :disabled="rol.es_sistema"
                                @click="pedirConfirmacion(rol)"
                            >
                                <i class="ti ti-trash"></i>
                            </button>
                        </div>
                    </div>

                    <div v-if="roles.length === 0" class="empty-state">
                        <p>No hay roles registrados todavía.</p>
                    </div>
                </template>
            </div>

            <!-- ── Panel derecho: permisos del rol seleccionado ── -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-lock" aria-hidden="true"></i>
                        Permisos
                    </div>
                    <span v-if="rolSeleccionado" class="rol-encabezado">
                        {{ rolSeleccionado.nombre_rol }}
                    </span>
                </div>

                <div
                    v-if="!rolSeleccionado"
                    class="empty-state"
                >
                    <i
                        class="ti ti-mouse"
                        style="font-size: 28px; opacity: 0.4"
                    ></i>
                    <p>Seleccioná un rol para administrar sus permisos.</p>
                </div>

                <template v-else>
                    <div v-if="cargandoPermisos" class="empty-state">
                        <i
                            class="ti ti-loader animate-spin"
                            style="font-size: 24px; color: #cd322c"
                        ></i>
                        <p>Cargando permisos...</p>
                    </div>

                    <template v-else>
                        <div class="permisos-toolbar">
                            <div class="search-box sm">
                                <i class="ti ti-search"></i>
                                <input
                                    v-model="busquedaPermisos"
                                    type="text"
                                    placeholder="Buscar permiso..."
                                    aria-label="Buscar permiso"
                                />
                                <button
                                    v-if="busquedaPermisos"
                                    class="search-clear"
                                    @click="busquedaPermisos = ''"
                                    aria-label="Limpiar búsqueda"
                                >
                                    <i class="ti ti-x"></i>
                                </button>
                            </div>
                            <span class="contador-permisos">
                                {{ permisosSeleccionados.length }} de
                                {{ catalogoPermisos.length }} seleccionados
                            </span>
                        </div>

                        <div
                            v-if="gruposPermisos.length === 0"
                            class="empty-state"
                        >
                            <i
                                class="ti ti-search"
                                style="font-size: 28px; opacity: 0.4"
                            ></i>
                            <p>
                                Sin resultados para "{{ busquedaPermisos }}".
                            </p>
                        </div>

                        <div
                            v-for="grupo in gruposPermisos"
                            :key="grupo.clave"
                            class="permiso-grupo"
                        >
                            <div class="permiso-grupo-titulo">
                                <span>{{ grupo.titulo }}</span>
                                <span class="grupo-acciones">
                                    <button
                                        class="link-btn"
                                        @click="seleccionarGrupo(grupo, true)"
                                    >
                                        Todos
                                    </button>
                                    <span class="link-sep">·</span>
                                    <button
                                        class="link-btn"
                                        @click="seleccionarGrupo(grupo, false)"
                                    >
                                        Ninguno
                                    </button>
                                </span>
                            </div>
                            <div class="permiso-grilla">
                                <label
                                    v-for="permiso in grupo.items"
                                    :key="permiso.id_permiso"
                                    class="permiso-check"
                                    :title="permiso.nombre_permiso"
                                >
                                    <input
                                        type="checkbox"
                                        :value="permiso.id_permiso"
                                        v-model="permisosSeleccionados"
                                    />
                                    <span class="permiso-nombre">
                                        {{ permiso.etiqueta }}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div class="card-footer">
                            <div
                                v-if="hayCambiosSinGuardar"
                                class="cambios-banner"
                            >
                                <i class="ti ti-alert-circle"></i>
                                Cambios sin guardar
                            </div>
                            <div v-else-if="exitoGuardar" class="exito-banner">
                                <i class="ti ti-check"></i>
                                Permisos guardados correctamente.
                            </div>
                            <div v-if="errorGuardar" class="error-banner">
                                <i class="ti ti-alert-circle"></i>
                                {{ errorGuardar }}
                            </div>
                            <button
                                class="tb-btn primary"
                                :disabled="guardando"
                                @click="guardarPermisos"
                            >
                                <i
                                    class="ti ti-loader animate-spin"
                                    v-if="guardando"
                                ></i>
                                {{
                                    guardando
                                        ? "Guardando..."
                                        : "Guardar permisos"
                                }}
                            </button>
                        </div>
                    </template>
                </template>
            </div>
        </div>

        <!-- ── Modal crear/renombrar rol ── -->
        <div
            v-if="modalRol.abierto"
            class="modal-overlay"
            @click.self="modalRol.abierto = false"
        >
            <div class="modal-card animate-fade-in">
                <div class="modal-header">
                    <i
                        class="ti ti-shield"
                        style="color: #cd322c; font-size: 20px"
                    ></i>
                    <h3>
                        {{
                            modalRol.modo === "crear"
                                ? "Nuevo rol"
                                : "Renombrar rol"
                        }}
                    </h3>
                </div>

                <label class="field-label">Nombre del rol</label>
                <input
                    v-model="modalRol.nombre"
                    ref="nombreRolRef"
                    class="field-input modal-input"
                    maxlength="50"
                    placeholder="Ej: auxiliar administrativo"
                    @keyup.enter="guardarRol"
                />

                <div
                    v-if="errorModal"
                    class="error-banner"
                    style="margin-top: 12px"
                >
                    <i class="ti ti-alert-circle"></i> {{ errorModal }}
                </div>

                <div class="modal-footer" style="margin-top: 20px">
                    <button
                        class="tb-btn outline"
                        @click="modalRol.abierto = false"
                    >
                        Cancelar
                    </button>
                    <button
                        class="tb-btn primary"
                        :disabled="guardandoRol || !modalRol.nombre.trim()"
                        @click="guardarRol"
                    >
                        <i
                            class="ti ti-loader animate-spin"
                            v-if="guardandoRol"
                        ></i>
                        {{ guardandoRol ? "Guardando..." : "Guardar" }}
                    </button>
                </div>
            </div>
        </div>

        <!-- ── Modal confirmar eliminación ── -->
        <div
            v-if="rolAEliminar"
            class="modal-overlay"
            @click.self="rolAEliminar = null"
        >
            <div class="modal-card animate-fade-in">
                <div class="modal-header">
                    <i
                        class="ti ti-alert-triangle"
                        style="color: #cd322c; font-size: 20px"
                    ></i>
                    <h3>Eliminar rol</h3>
                </div>

                <p class="modal-body">
                    ¿Seguro que querés eliminar el rol
                    <strong>{{ rolAEliminar.nombre_rol }}</strong
                    >? Los usuarios que lo tengan asignado quedarán sin rol.
                </p>

                <div
                    v-if="errorEliminar"
                    class="error-banner"
                    style="margin-bottom: 16px"
                >
                    <i class="ti ti-alert-circle"></i> {{ errorEliminar }}
                </div>

                <div class="modal-footer">
                    <button
                        class="tb-btn outline"
                        @click="rolAEliminar = null"
                    >
                        Cancelar
                    </button>
                    <button
                        class="tb-btn danger"
                        :disabled="eliminando"
                        @click="confirmarEliminar"
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

        <!-- ── Modal cambios sin guardar ── -->
        <div
            v-if="rolPendiente"
            class="modal-overlay"
            @click.self="rolPendiente = null"
        >
            <div class="modal-card animate-fade-in">
                <div class="modal-header">
                    <i
                        class="ti ti-alert-triangle"
                        style="color: #cd322c; font-size: 20px"
                    ></i>
                    <h3>Cambios sin guardar</h3>
                </div>

                <p class="modal-body">
                    Modificaste los permisos de
                    <strong>{{ rolSeleccionado?.nombre_rol }}</strong> pero no
                    los guardaste. Si cambiás de rol, esos cambios se perderán.
                </p>

                <div class="modal-footer">
                    <button class="tb-btn outline" @click="rolPendiente = null">
                        Seguir editando
                    </button>
                    <button
                        class="tb-btn danger"
                        @click="confirmarCambioRol"
                    >
                        Descartar y cambiar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from "vue";

import {
    obtenerRoles,
    crearRol,
    modificarRol,
    eliminarRol,
    obtenerTodosPermisos,
    obtenerPermisosDeRol,
    asignarPermisosARol,
} from "../../../services/usuarios-services.js";

const roles = ref([]);
const catalogoPermisos = ref([]);
const rolSeleccionado = ref(null);
const permisosSeleccionados = ref([]);
const permisosOriginales = ref([]);
const rolPendiente = ref(null);
const busquedaPermisos = ref("");
const conteoPermisos = ref({});

const cargando = ref(false);
const cargandoPermisos = ref(false);
const guardando = ref(false);
const guardandoRol = ref(false);
const eliminando = ref(false);

const errorCarga = ref("");
const errorGuardar = ref("");
const errorModal = ref("");
const errorEliminar = ref("");
const exitoGuardar = ref(false);

const modalRol = ref({ abierto: false, modo: "crear", nombre: "", id: null });
const rolAEliminar = ref(null);
const nombreRolRef = ref(null);

const iniciales = (nombre) =>
    (nombre || "")
        .split(/[\s_]+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

// ── Etiquetas amigables para permisos con formato actor_verbo_recurso ────
const VERBOS = {
    ver: "Ver",
    crear: "Crear",
    editar: "Editar",
    eliminar: "Eliminar",
    gestionar: "Gestionar",
    asignar: "Asignar",
    registrar: "Registrar",
    enviar: "Enviar",
    configurar: "Configurar",
};

const TITULOS_RECURSO = {
    alumno: "Alumnos",
    alumnos: "Alumnos",
    todos_alumnos: "Todos los alumnos",
    mis_notas: "Mis notas",
    notas_hijo: "Notas de mi hijo",
    nota: "Notas",
    todos_notas: "Todas las notas",
    profesor: "Profesores",
    todos_profesores: "Todos los profesores",
    curso: "Cursos",
    cursos: "Cursos",
    todos_cursos: "Todos los cursos",
    mi_curso: "Mi curso",
    alumnos_de_curso: "Alumnos del curso",
    materia: "Materias",
    materias: "Materias",
    todos_materias: "Todas las materias",
    asignacion: "Asignaciones",
    asignaciones: "Asignaciones",
    todos_asignaciones: "Todas las asignaciones",
    usuario: "Usuarios",
    asistencias: "Asistencias",
    mis_asistencias: "Mis asistencias",
    asistencias_hijo: "Asistencias de mi hijo",
    perfil: "Perfil",
    perfil_alumno: "Perfil de alumno",
    perfil_hijo: "Perfil de mi hijo",
    noticia: "Noticias",
    mis_noticias: "Mis noticias",
    comunicado: "Comunicados",
    rol: "Roles",
    roles: "Roles",
    permisos: "Permisos",
    prestamo: "Préstamos",
    prestamos: "Préstamos",
    recurso: "Recursos",
    recursos: "Recursos",
    inventario: "Inventario",
    devolucion: "Devoluciones",
    sanciones: "Sanciones",
    sanciones_hijo: "Sanciones de mi hijo",
    horario: "Horarios",
    calendario: "Calendario",
    reportes: "Reportes",
    sistema: "Sistema",
    logs_sistema: "Registros del sistema",
    email_alumno: "Email de alumnos",
    cualquier_contenido: "Contenido general",
};

// Tokens plurales que se fusionan con su forma singular para no duplicar grupos
const CANON_RECURSO = {
    prestamos: "prestamo",
    recursos: "recurso",
    roles: "rol",
};

const SINGULAR_RECURSO = {    alumnos: "alumno",
    todos_alumnos: "todos los alumnos",
    profesores: "profesor",
    todos_profesores: "todos los profesores",
    cursos: "curso",
    todos_cursos: "todos los cursos",
    materias: "materia",
    todos_materias: "todas las materias",
    asignaciones: "asignación",
    todos_asignaciones: "todas las asignaciones",
    usuarios: "usuario",
    asistencias: "asistencias",
    notas: "nota",
    todos_notas: "todas las notas",
    noticias: "noticia",
    roles: "rol",
    prestamos: "préstamo",
    recursos: "recurso",
    sanciones: "sanción",
    horarios: "horario",
};

const prettify = (token) =>
    (token || "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

function parsearPermiso(nombre) {
    const partes = (nombre || "").split("_").filter(Boolean);
    // Caso especial: recurso_verbo (ej. comunicado_crear)
    if (partes.length === 2 && TITULOS_RECURSO[partes[0]] && VERBOS[partes[1]]) {
        return { verbo: partes[1], recurso: partes[0] };
    }
    if (partes.length >= 3) {
        return { verbo: partes[1], recurso: partes.slice(2).join("_") };
    }
    return { verbo: "", recurso: nombre || "general" };
}

function tituloRecurso(recurso) {
    return TITULOS_RECURSO[recurso] || prettify(recurso);
}

function etiquetaPermiso(nombre) {
    const { verbo, recurso } = parsearPermiso(nombre);
    const verboTxt = VERBOS[verbo] || (verbo ? prettify(verbo) : "");
    const recursoTxt =
        SINGULAR_RECURSO[recurso] || recurso.replace(/_/g, " ");
    return verboTxt ? `${verboTxt} ${recursoTxt}` : prettify(nombre);
}

// Catálogo enriquecido con grupo y etiqueta
const permisosProcesados = computed(() =>
    catalogoPermisos.value.map((p) => {
        const { recurso } = parsearPermiso(p.nombre_permiso);
        const canon = CANON_RECURSO[recurso] || recurso || "general";
        return {
            ...p,
            claveRecurso: canon,
            tituloGrupo: tituloRecurso(canon),
            etiqueta: etiquetaPermiso(
                p.nombre_permiso.replace(new RegExp(`${recurso}$`), canon),
            ),
        };
    }),
);

const gruposPermisos = computed(() => {
    const q = busquedaPermisos.value.trim().toLowerCase();
    const grupos = new Map();
    for (const permiso of permisosProcesados.value) {
        if (
            q &&
            !`${permiso.etiqueta} ${permiso.nombre_permiso}`
                .toLowerCase()
                .includes(q)
        ) {
            continue;
        }
        if (!grupos.has(permiso.claveRecurso)) {
            grupos.set(permiso.claveRecurso, {
                clave: permiso.claveRecurso,
                titulo: permiso.tituloGrupo,
                items: [],
            });
        }
        grupos.get(permiso.claveRecurso).items.push(permiso);
    }
    return [...grupos.values()].sort((a, b) =>
        a.titulo.localeCompare(b.titulo, "es"),
    );
});

const hayCambiosSinGuardar = computed(() => {
    if (!rolSeleccionado.value) return false;
    const actual = [...permisosSeleccionados.value].sort((a, b) => a - b);
    const original = [...permisosOriginales.value].sort((a, b) => a - b);
    return (
        actual.length !== original.length ||
        actual.some((id, i) => id !== original[i])
    );
});

const conteoTexto = (rol) => {
    const n = conteoPermisos.value[rol.id_rol];
    if (n === undefined) return "";
    return n === 1 ? "1 permiso" : `${n} permisos`;
};

const seleccionarGrupo = (grupo, valor) => {
    const ids = grupo.items.map((p) => p.id_permiso);
    if (valor) {
        const set = new Set(permisosSeleccionados.value);
        ids.forEach((id) => set.add(id));
        permisosSeleccionados.value = [...set];
    } else {
        const quitar = new Set(ids);
        permisosSeleccionados.value = permisosSeleccionados.value.filter(
            (id) => !quitar.has(id),
        );
    }
};

const fetchRoles = async () => {
    cargando.value = true;
    errorCarga.value = "";
    try {
        const res = await obtenerRoles();
        const data = res?.data || res;
        const lista = Array.isArray(data) ? data : data?.data || [];
        // Compat: la tabla roles no tiene columna es_sistema; los 8 roles
        // del seed (id 1-8) se tratan como sistema.
        roles.value = lista.map((r) => ({
            ...r,
            es_sistema: r?.es_sistema ?? (Number(r?.id_rol) >= 1 && Number(r?.id_rol) <= 8),
        }));
        cargarConteos();
    } catch (e) {
        errorCarga.value =
            e?.response?.data?.message ||
            e?.response?.data?.mensaje ||
            e?.message ||
            "Error al cargar los roles.";
    } finally {
        cargando.value = false;
    }
};

const cargarConteos = async () => {
    const entradas = await Promise.allSettled(
        roles.value.map(async (rol) => {
            const res = await obtenerPermisosDeRol(rol.id_rol);
            const data = res?.data || res;
            const lista = Array.isArray(data) ? data : data?.data || [];
            return [rol.id_rol, lista.length];
        }),
    );
    const mapa = {};
    for (const e of entradas) {
        if (e.status === "fulfilled") mapa[e.value[0]] = e.value[1];
    }
    conteoPermisos.value = mapa;
};

const fetchCatalogoPermisos = async () => {
    const res = await obtenerTodosPermisos();
    const data = res?.data || res;
    catalogoPermisos.value = Array.isArray(data) ? data : [];
};

const intentarSeleccionarRol = (rol) => {
    if (
        hayCambiosSinGuardar.value &&
        rol?.id_rol !== rolSeleccionado.value?.id_rol
    ) {
        rolPendiente.value = rol;
        return;
    }
    seleccionarRol(rol);
};

const confirmarCambioRol = async () => {
    const destino = rolPendiente.value;
    rolPendiente.value = null;
    if (destino) await seleccionarRol(destino);
};

const seleccionarRol = async (rol) => {
    rolSeleccionado.value = rol;
    errorGuardar.value = "";
    exitoGuardar.value = false;
    busquedaPermisos.value = "";
    cargandoPermisos.value = true;
    try {
        const res = await Promise.race([
            obtenerPermisosDeRol(rol.id_rol),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Tiempo de espera agotado")), 15000),
            ),
        ]);
        const data = res?.data || res;
        const crudo = Array.isArray(data) ? data : data?.data || [];
        const nombres = crudo.map((p) =>
            typeof p === "string" ? p : p?.nombre_permiso,
        );

        permisosSeleccionados.value = catalogoPermisos.value
            .filter((p) => nombres.includes(p.nombre_permiso))
            .map((p) => p.id_permiso);
        permisosOriginales.value = [...permisosSeleccionados.value];
    } catch {
        permisosSeleccionados.value = [];
        permisosOriginales.value = [];
    } finally {
        cargandoPermisos.value = false;
    }
};

const guardarPermisos = async () => {
    guardando.value = true;
    errorGuardar.value = "";
    exitoGuardar.value = false;
    try {
        const res = await asignarPermisosARol(
            rolSeleccionado.value.id_rol,
            permisosSeleccionados.value,
        );
        if (!res?.success) {
            errorGuardar.value = res?.message || "Error al guardar permisos";
            return;
        }
        permisosOriginales.value = [...permisosSeleccionados.value];
        conteoPermisos.value = {
            ...conteoPermisos.value,
            [rolSeleccionado.value.id_rol]: permisosSeleccionados.value.length,
        };
        exitoGuardar.value = true;
        setTimeout(() => (exitoGuardar.value = false), 2500);
    } catch {
        errorGuardar.value = "Error al guardar los permisos.";
    } finally {
        guardando.value = false;
    }
};

const abrirModalRol = (modo, rol = null) => {
    modalRol.value = {
        abierto: true,
        modo,
        nombre: modo === "editar" ? rol.nombre_rol : "",
        id: modo === "editar" ? rol.id_rol : null,
    };
    errorModal.value = "";
    nextTick(() => nombreRolRef.value?.focus());
};

const guardarRol = async () => {
    const nombre = modalRol.value.nombre.trim();
    if (!nombre) return;

    guardandoRol.value = true;
    errorModal.value = "";
    try {
        const res =
            modalRol.value.modo === "crear"
                ? await crearRol(nombre)
                : await modificarRol(modalRol.value.id, nombre);

        if (!res?.success) {
            errorModal.value = res?.message || "Error al guardar el rol";
            return;
        }

        modalRol.value.abierto = false;
        await fetchRoles();
        const [rolNuevo] = roles.value.filter(
            (r) => nombre === r.nombre_rol,
        );
        if (rolNuevo) seleccionarRol(rolNuevo);
    } catch {
        errorModal.value = "Error inesperado al guardar el rol.";
    } finally {
        guardandoRol.value = false;
    }
};

const pedirConfirmacion = (rol) => {
    rolAEliminar.value = rol;
    errorEliminar.value = "";
};

const confirmarEliminar = async () => {
    eliminando.value = true;
    errorEliminar.value = "";
    try {
        const res = await eliminarRol(rolAEliminar.value.id_rol);
        if (!res?.success) {
            errorEliminar.value = res?.message || "Error al eliminar el rol";
            return;
        }
        if (rolSeleccionado.value?.id_rol === rolAEliminar.value.id_rol) {
            rolSeleccionado.value = null;
            permisosSeleccionados.value = [];
            permisosOriginales.value = [];
        }
        rolAEliminar.value = null;
        await fetchRoles();
    } catch {
        errorEliminar.value = "Error inesperado al eliminar el rol.";
    } finally {
        eliminando.value = false;
    }
};

onMounted(async () => {
    await Promise.all([fetchRoles(), fetchCatalogoPermisos()]);
    if (roles.value.length > 0) seleccionarRol(roles.value[0]);
});
</script>

<style scoped>
.roles-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1000px;
}

.roles-grid {
    display: grid;
    grid-template-columns: minmax(280px, 320px) minmax(0, 1fr);
    gap: 16px;
    align-items: start;
}

@media (max-width: 860px) {
    .roles-grid {
        grid-template-columns: 1fr;
    }
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
.card-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding: 12px;
    border-top: 1px solid #e5e7eb;
    background: #f9fafb;
}

.rol-encabezado {
    font-size: 12px;
    font-weight: 600;
    color: #cd322c;
    background: #fbf0f0;
    padding: 4px 10px;
    border-radius: 4px;
    text-transform: capitalize;
}

/* Item de rol */
.rol-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    cursor: pointer;
    border-bottom: 0.5px solid #e5e7eb;
    transition: background 0.15s;
}
.rol-item:hover {
    background: var(--color-background-secondary, #f9fafb);
}
.rol-item.selected {
    background: #fbf0f0;
    border-left: 3px solid #cd322c;
}
.rol-item:last-child {
    border-bottom: none;
}
.rol-avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #cd322c;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    text-transform: uppercase;
}
.rol-info {
    flex: 1;
    min-width: 0;
}
.rol-nombre {
    font-size: 13px;
    font-weight: 500;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 6px;
    text-transform: capitalize;
}
.rol-sub {
    font-size: 11px;
    color: #6b7280;
    min-height: 14px;
}
.rol-acciones {
    display: flex;
    gap: 4px;
}

/* Toolbar de permisos */
.permisos-toolbar {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid #e5e7eb;
    background: #fff;
    flex-wrap: wrap;
}
.search-box {
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 0 10px;
    background: white;
    transition: border-color 0.15s, box-shadow 0.15s;
    flex: 1;
    min-width: 180px;
    max-width: 320px;
}
.search-box:focus-within {
    border-color: #cd322c;
    box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.08);
}
.search-box i {
    color: #9ca3af;
    font-size: 14px;
    flex-shrink: 0;
}
.search-box input {
    border: none;
    outline: none;
    padding: 7px 0;
    font-size: 12.5px;
    flex: 1;
    background: transparent;
    color: #111827;
    min-width: 0;
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
.contador-permisos {
    font-size: 12px;
    color: #6b7280;
    margin-left: auto;
    white-space: nowrap;
}

/* Permisos */
.permiso-grupo {
    padding: 12px 16px;
    border-bottom: 0.5px solid #e5e7eb;
}
.permiso-grupo-titulo {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    margin-bottom: 8px;
}
.grupo-acciones {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    text-transform: none;
    letter-spacing: normal;
}
.link-btn {
    background: none;
    border: none;
    padding: 2px 4px;
    font-size: 11.5px;
    font-weight: 600;
    color: #cd322c;
    cursor: pointer;
    border-radius: 4px;
}
.link-btn:hover {
    background: #fbf0f0;
    text-decoration: underline;
}
.link-sep {
    color: #d1d5db;
}
.permiso-grilla {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 12px;
}
@media (max-width: 640px) {
    .permiso-grilla {
        grid-template-columns: 1fr;
    }
}
.permiso-check {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #374151;
    cursor: pointer;
    padding: 3px 0;
}
.permiso-check input {
    accent-color: #cd322c;
    width: 14px;
    height: 14px;
    flex-shrink: 0;
}
.permiso-nombre {
    text-transform: capitalize;
}

/* Banners / pills */
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
.cambios-banner {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fef3c7;
    border: 1px solid #fde68a;
    color: #92400e;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    margin-right: auto;
}
.status-pill {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    display: inline-block;
    text-transform: uppercase;
    letter-spacing: 0.03em;
}
.sp-sistema {
    background: #e5e7eb;
    color: #4b5563;
}

.empty-state {
    padding: 32px 20px;
    text-align: center;
    color: #9ca3af;
    font-size: 13px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
}

/* Botones */
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

.icon-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #4b5563;
    font-size: 14px;
    transition: all 0.15s;
    padding: 0;
}
.icon-btn i {
    pointer-events: none;
    display: flex;
}
.icon-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
}
.icon-btn.edit:hover:not(:disabled) {
    background: #f3f4f6;
    color: #111827;
}
.icon-btn.delete:hover:not(:disabled) {
    background: #fef2f2;
    border-color: #fca5a5;
    color: #ef4444;
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
    max-width: 420px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}
.modal-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
}
.modal-header h3 {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0;
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
.field-label {
    display: block;
    font-size: 12px;
    color: #4b5563;
    font-weight: 500;
    margin-bottom: 6px;
}
.field-input {
    width: 100%;
    box-sizing: border-box;
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    font-size: 13px;
    outline: none;
    background: white;
}
.field-input:focus {
    border-color: #cd322c;
    box-shadow: 0 0 0 3px rgba(205, 50, 44, 0.1);
}
.modal-input {
    margin-top: 4px;
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
</style>
