<template>
    <aside class="sidebar" aria-label="Navegación">
        <div class="sidebar-header">
            <div class="sidebar-logo">
                <div class="logo-title">Tec-app</div>
                <div class="logo-sub">Panel administrativo</div>
            </div>
        </div>

        <div class="sidebar-section">General</div>

        <div
            class="nav-item"
            :class="{ active: vistaActual === 'alumnos' }"
            @click="$emit('cambiar-vista', 'alumnos')"
        >
            <i class="ti ti-school" aria-hidden="true"></i>Alumnos
        </div>
        <div
            class="nav-item"
            :class="{ active: vistaActual === 'profesores' }"
            @click="$emit('cambiar-vista', 'profesores')"
        >
            <i class="ti ti-chalkboard" aria-hidden="true"></i>Profesores
        </div>
        <div
            class="nav-item"
            :class="{ active: vistaActual === 'cursos' }"
            @click="$emit('cambiar-vista', 'cursos')"
        >
            <i class="ti ti-book" aria-hidden="true"></i>Cursos
        </div>

        <div
            class="nav-item"
            :class="{ active: vistaActual === 'asistencias' }"
            @click="$emit('cambiar-vista', 'asistencias')"
        >
            <i class="ti ti-school" aria-hidden="true"></i>Asistencias
        </div>

        <div
            class="nav-item"
            :class="{ active: vistaActual === 'materias' }"
            @click="$emit('cambiar-vista', 'materias')"
        >
            <i class="ti ti-book" aria-hidden="true"></i>Materias
        </div>

        <div
            class="nav-item"
            :class="{ active: vistaActual === 'asignaciones' }"
            @click="$emit('cambiar-vista', 'asignaciones')"
        >
            <i class="ti ti-git-branch" aria-hidden="true"></i>Asignaciones de
            materias
        </div>

        <div class="sidebar-section">Comunicación</div>
        <div
            class="nav-item"
            :class="{ active: vistaActual === 'noticias' }"
            @click="$emit('cambiar-vista', 'noticias')"
        >
            <i class="ti ti-speakerphone" aria-hidden="true"></i>Noticias
        </div>

        <div
            class="nav-item"
            :class="{ active: vistaActual === 'comunicados' }"
            @click="$emit('cambiar-vista', 'comunicados')"
        >
            <i class="ti ti-speakerphone" aria-hidden="true"></i>Comunicados
        </div>
        <div class="sidebar-section">Sistema</div>
        <div
            class="nav-item"
            :class="{ active: vistaActual === 'personal' }"
            @click="$emit('cambiar-vista', 'personal')"
        >
            <i class="ti ti-users" aria-hidden="true"></i>Personal
        </div>

        <div
            class="nav-item"
            :class="{ active: vistaActual === 'usuarios' }"
            @click="$emit('cambiar-vista', 'usuarios')"
        >
            <i class="ti ti-user-shield" aria-hidden="true"></i>Usuarios
        </div>
    </aside>
</template>

<script setup>
defineProps({
    vistaActual: {
        type: String,
        required: true,
    },
});

defineEmits(["cambiar-vista"]);
</script>

<style scoped>
.sidebar {
    background: var(--color-background-primary, #ffffff);
    border-right: 0.5px solid var(--color-border-tertiary, #e5e7eb);
    display: flex;
    flex-direction: column;
}

.sidebar-header {
    padding: 16px;
    border-bottom: 0.5px solid var(--color-border-tertiary, #e5e7eb);
}

.sidebar-logo {
    display: flex;
    flex-direction: column;
    gap: 2px;
}



.logo-title {
    font-size: 12.5px;
    font-weight: 500;
    color: var(--color-text-primary, #111827);
}

.logo-sub {
    font-size: 10px;
    color: var(--color-text-tertiary, #6b7280);
}

.sidebar-section {
    padding: 8px 8px 4px;
    font-size: 11px;
    color: var(--color-text-tertiary, #6b7280);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-top: 8px;
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
}

.nav-item:hover {
    background: var(--color-background-secondary, #f3f4f6);
    color: var(--color-text-primary, #111827);
}

.nav-item.active {
    background: #fbf0f0;
    color: #a52420;
}

.nav-item i {
    font-size: 16px;
    flex-shrink: 0;
}

.sidebar-footer {
    margin-top: auto;
    padding: 12px;
    border-top: 0.5px solid var(--color-border-tertiary, #e5e7eb);
}

.user-pill {
    display: flex;
    align-items: center;
    gap: 8px;
}

.user-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #cd322c;
    color: #fff;
    font-size: 11px;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.user-info p {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-primary, #111827);
    line-height: 1.2;
}

.user-info span {
    font-size: 11px;
    color: var(--color-text-tertiary, #6b7280);
}
</style>
