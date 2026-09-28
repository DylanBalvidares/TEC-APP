<template>
    <aside
        class="sidebar"
        :class="{ colapsado: colapsado, 'drawer-abierto': movilAbierto }"
        aria-label="Navegación"
        @keydown="onTeclaNav"
    >
        <template v-for="grupo in grupos" :key="grupo.titulo">
            <div class="sidebar-section">{{ grupo.titulo }}</div>

            <div
                v-for="item in grupo.items"
                :key="item.vista"
                class="nav-item"
                role="button"
                tabindex="0"
                :class="{ active: vistaActual === item.vista }"
                :title="colapsado ? item.nombre : null"
                @click="$emit('cambiar-vista', item.vista)"
            >
                <i class="ti" :class="item.icono" aria-hidden="true"></i>
                <span class="nav-texto">{{ item.nombre }}</span>
            </div>
        </template>
    </aside>
</template>

<script setup>
defineProps({
    vistaActual: { type: String, required: true },
    colapsado: { type: Boolean, default: false },
    movilAbierto: { type: Boolean, default: false },
});

defineEmits(["cambiar-vista"]);

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
        ],
    },
    {
        titulo: "Comunicación",
        items: [
            { vista: "noticias", nombre: "Noticias", icono: "ti-news" },
            { vista: "comunicados", nombre: "Comunicados", icono: "ti-speakerphone" },
            { vista: "mensajes", nombre: "WhatsApp", icono: "ti-brand-whatsapp" },
        ],
    },
    {
        titulo: "Sistema",
        items: [
            { vista: "personal", nombre: "Personal", icono: "ti-users" },
            { vista: "usuarios", nombre: "Usuarios", icono: "ti-user-shield" },
            { vista: "roles", nombre: "Roles y permisos", icono: "ti-lock" },
            { vista: "monitorcorreos", nombre: "Historial de Emails", icono: "ti-envelope" },
            { vista: "auditoria", nombre: "Auditoría", icono: "ti-history" },
            { vista: "biblioteca", nombre: "Biblioteca", icono: "ti-books" },
            { vista: "objetos", nombre: "Objetos perdidos", icono: "ti-package" },
            { vista: "reportes", nombre: "Reportes", icono: "ti-chart-bar" },
            { vista: "config", nombre: "Configuración", icono: "ti-settings" },
        ],
    },
];

const onTeclaNav = (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const item = e.target?.closest?.(".nav-item");
    if (item) {
        e.preventDefault();
        item.click();
    }
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
}

.nav-item:hover {
    background: var(--color-background-secondary, #f3f4f6);
    color: var(--color-text-primary, #111827);
}

.nav-item.active {
    background: #fbf0f0;
    color: #a52420;
}

.nav-item:focus-visible {
    outline: 2px solid #cd322c;
    outline-offset: -2px;
}

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
    }

    .sidebar.colapsado .sidebar-section {
        font-size: 11px;
        border-bottom: none;
        margin-top: 8px;
    }
}
</style>
