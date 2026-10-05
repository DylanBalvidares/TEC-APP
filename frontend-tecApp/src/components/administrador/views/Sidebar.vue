<template>
    <aside
        class="sidebar"
        :class="{ colapsado: colapsado, 'drawer-abierto': movilAbierto }"
        id="admin-sidebar"
        aria-label="Navegación del administrador"
        :inert="navInerte"
        @keydown.esc="$emit('cerrar-movil')"
    >
        <nav aria-label="Secciones">
            <label v-if="!colapsado" class="sidebar-search">
                <i class="ti ti-search" aria-hidden="true"></i>
                <input v-model="busqueda" type="search" placeholder="Buscar sección" aria-label="Buscar sección del administrador" />
            </label>
            <p v-if="busqueda && gruposFiltrados.length === 0" class="sidebar-no-results" role="status">
                No se encontraron secciones.
            </p>
            <section v-for="grupo in gruposFiltrados" :key="grupo.titulo" class="sidebar-group">
                <h2 class="sidebar-section">{{ grupo.titulo }}</h2>
                <button
                    v-for="item in grupo.items"
                    :key="item.vista"
                    type="button"
                    class="nav-item"
                    :class="{ active: vistaActual === item.vista }"
                    :title="colapsado ? item.nombre : null"
                    :aria-label="item.nombre"
                    :aria-current="vistaActual === item.vista ? 'page' : undefined"
                    @click="seleccionarVista(item.vista)"
                >
                    <i class="ti" :class="item.icono" aria-hidden="true"></i>
                    <span class="nav-texto">{{ item.nombre }}</span>
                </button>
            </section>
        </nav>
    </aside>
</template>

<script setup>
import { computed, ref } from "vue";

defineProps({
    vistaActual: { type: String, required: true },
    colapsado: { type: Boolean, default: false },
    movilAbierto: { type: Boolean, default: false },
    navInerte: { type: Boolean, default: false },
});

const emit = defineEmits(["cambiar-vista", "cerrar-movil"]);
const busqueda = ref("");

const grupos = [
    {
        titulo: "General",
        items: [
            { vista: "overview", nombre: "Inicio", icono: "ti-home" },
            { vista: "alumnos", nombre: "Alumnos", icono: "ti-school" },
            { vista: "profesores", nombre: "Profesores", icono: "ti-chalkboard" },
            { vista: "cursos", nombre: "Cursos", icono: "ti-book" },
            { vista: "asistencias", nombre: "Asistencias", icono: "ti-calendar-check" },
            { vista: "materias", nombre: "Materias", icono: "ti-books" },
            { vista: "asignaciones", nombre: "Asignaciones", icono: "ti-git-branch" },
            { vista: "horarios", nombre: "Horarios", icono: "ti-calendar-time" },
            { vista: "convivencia", nombre: "Convivencia", icono: "ti-alert-triangle" },
            { vista: "planes", nombre: "Planes de Estudio", icono: "ti-layers" },
            { vista: "libreta", nombre: "Libreta Digital", icono: "ti-book-open" },
            { vista: "boletines", nombre: "Boletines", icono: "ti-file-text" },
        ],
    },
    {
        titulo: "Comunicación",
        items: [
            { vista: "comunicacion", nombre: "Comunicación", icono: "ti-messages" },
            { vista: "notificaciones", nombre: "Notificaciones", icono: "ti-bell" },
            { vista: "certificados", nombre: "Certificados", icono: "ti-certificate" },
        ],
    },
    {
        titulo: "Sistema",
        items: [
            { vista: "personal", nombre: "Personal", icono: "ti-users" },
            { vista: "usuarios", nombre: "Usuarios", icono: "ti-user-shield" },
            { vista: "roles", nombre: "Roles y permisos", icono: "ti-lock" },
            { vista: "auditoria", nombre: "Auditoría", icono: "ti-history" },
            { vista: "biblioteca", nombre: "Biblioteca", icono: "ti-books" },
            { vista: "objetos", nombre: "Objetos perdidos", icono: "ti-package" },
            { vista: "reportes", nombre: "Reportes", icono: "ti-chart-bar" },
            { vista: "config", nombre: "Configuración", icono: "ti-settings" },
            { vista: "backup", nombre: "Backup", icono: "ti-database-export" },
        ],
    },
];

const gruposFiltrados = computed(() => {
    const termino = busqueda.value.trim().toLocaleLowerCase("es");
    if (!termino) return grupos;
    return grupos
        .map((grupo) => ({
            ...grupo,
            items: grupo.items.filter((item) =>
                item.nombre.toLocaleLowerCase("es").includes(termino),
            ),
        }))
        .filter((grupo) => grupo.items.length > 0);
});

const seleccionarVista = (vista) => {
    busqueda.value = "";
    emit("cambiar-vista", vista);
};
</script>

<style scoped>
.sidebar {
    background: var(--color-background-primary, #ffffff);
    border-right: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    display: flex;
    flex-direction: column;
    width: 220px;
    min-width: 220px;
    max-width: 220px;
    flex-shrink: 0;
    box-sizing: border-box;
    position: relative;
    z-index: 20;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border-tertiary, #e5e7eb) transparent;
}

.sidebar nav {
    padding: 4px 0 16px;
}

.sidebar-search {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 8px 10px 10px;
    padding: 8px 10px;
    border: 1px solid var(--color-border-tertiary, #e5e7eb);
    border-radius: 8px;
    color: var(--color-text-tertiary, #6b7280);
}

.sidebar-search:focus-within {
    border-color: #cd322c;
    box-shadow: 0 0 0 3px rgba(205, 50, 44, 0.12);
}

.sidebar-search input {
    width: 100%;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--color-text-primary, #111827);
    font: inherit;
    font-size: 12px;
}

.sidebar-search input::placeholder { color: var(--color-text-tertiary, #6b7280); }

.sidebar-no-results {
    margin: 12px;
    color: var(--color-text-tertiary, #6b7280);
    font-size: 12px;
}

.sidebar-group + .sidebar-group {
    margin-top: 5px;
    padding-top: 5px;
    border-top: 1px solid var(--color-background-secondary, #f3f4f6);
}

.sidebar-section {
    padding: 8px 8px 4px;
    font-size: 11px;
    color: var(--color-text-tertiary, #6b7280);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-top: 8px;
    white-space: nowrap;
}

.nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 12px;
    border-radius: 6px;
    cursor: pointer;
    color: var(--color-text-secondary, #4b5563);
    margin: 1px 6px;
    transition: background 0.15s;
    font-size: 12.5px;
    white-space: nowrap;
    width: calc(100% - 12px);
    box-sizing: border-box;
    border: 0;
    background: transparent;
    font-family: inherit;
    text-align: left;
}

.nav-item:hover {
    background: var(--color-background-secondary, #f3f4f6);
    color: var(--color-text-primary, #111827);
}

.nav-item.active {
    background: var(--nav-active-bg, #fbf0f0);
    color: var(--nav-active-fg, #a52420);
}

.nav-item:focus-visible {
    outline: 2px solid #cd322c;
    outline-offset: -2px;
}

.nav-item.active { font-weight: 650; }

.nav-item i {
    font-size: 16px;
    flex-shrink: 0;
}

.nav-texto {
    overflow: hidden;
    text-overflow: ellipsis;
}

/* ── Modo colapsado (desktop): solo iconos ─────────────────────────────── */
.sidebar.colapsado {
    width: 72px;
    min-width: 72px;
    max-width: 72px;
}

.sidebar.colapsado .sidebar-section {
    font-size: 0;
    padding: 6px 8px 2px;
    border-bottom: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    margin: 6px 8px 2px;
}

.sidebar.colapsado .nav-item {
    justify-content: center;
    padding: 9px 0;
    margin: 2px 10px;
    width: calc(100% - 20px);
}

.sidebar.colapsado .nav-texto {
    display: none;
}

/* ── Móvil: drawer fuera de pantalla ───────────────────────────────────── */
@media (max-width: 768px) {
    .sidebar {
        position: fixed;
        top: 64px; /* debajo del Topbar */
        bottom: 0;
        left: 0;
        z-index: 100;
        transform: translateX(-100%);
        transition: transform 0.2s ease;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .sidebar.drawer-abierto {
        transform: translateX(0);
    }

    /* En móvil el drawer siempre muestra texto, ignora el colapsado */
    .sidebar.colapsado {
        width: 220px;
        min-width: 220px;
        max-width: 220px;
    }

    .sidebar.colapsado .nav-texto {
        display: inline;
    }

    .sidebar.colapsado .nav-item {
        justify-content: flex-start;
        padding: 7px 12px;
        width: calc(100% - 12px);
        margin: 1px 6px;
    }

    .sidebar.colapsado .sidebar-section {
        font-size: 11px;
        border-bottom: none;
        margin-top: 8px;
    }
}
</style>
