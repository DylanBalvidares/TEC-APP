<template>
    <section class="tab-panel active">
        <div class="tab-toolbar">
            <div class="tab-toolbar-left">
                <h2 class="section-title"><i class="fas fa-home"></i> Inicio del Panel</h2>
            </div>
        </div>

        <div v-if="cargando" class="empty-state">
            <i class="fas fa-spinner fa-spin empty-icon"></i>
            <p>Cargando datos...</p>
        </div>

        <div v-else class="dashboard-widgets">
            <Card class="widget-card">
                <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3L2 9l10 6 10-6-10-6z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg> Mis Cursos</h3>
                <p class="widget-value">{{ cursosUnicos.length }}</p>
                <RouterLink to="/profesor/cursos" class="widget-link">Ver cursos</RouterLink>
            </Card>

            <Card class="widget-card">
                <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg> Mis Materias</h3>
                <p class="widget-value">{{ asignaciones.length }}</p>
                <RouterLink to="/profesor/materias" class="widget-link">Ver materias</RouterLink>
            </Card>
        </div>
    </section>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import Card from "@/components/ui/Card.vue";
import { obtenerAsignacionesProfesor } from "@/services/academico-service.js";
import { resolverIdProfesor } from "@/composables/useProfesor.js";

const asignaciones = ref([]);
const cargando = ref(true);

const cursosUnicos = computed(() => {
    const map = new Map();
    asignaciones.value.forEach(a => {
        if (a.cursoAsignacion) {
            map.set(a.cursoAsignacion.id_curso, a.cursoAsignacion.nombre_curso);
        }
    });
    return Array.from(map.keys());
});

onMounted(async () => {
    try {
        const idProfesor = await resolverIdProfesor();
        if (!idProfesor) {
            console.warn("InicioView: no se pudo obtener el id_profesor.");
            return;
        }

        const res = await obtenerAsignacionesProfesor(idProfesor);
        if (res.success && res.data) {
            asignaciones.value = res.data;
        }
    } catch (error) {
        console.error("Error al cargar datos de inicio:", error);
    } finally {
        cargando.value = false;
    }
});
</script>

<style scoped src="../profesores.css"></style>
<style scoped>
.dashboard-widgets {
    display: flex;
    gap: 24px;
    margin-top: 24px;
    flex-wrap: wrap;
}
.widget-card {
    background: var(--surface, #fff);
    border: 1px solid var(--line, #e5e7eb);
    border-radius: var(--radius-lg, 16px);
    padding: 24px;
    flex: 1;
    min-width: 240px;
    text-align: left;
    box-shadow: var(--elev-1, 0 6px 18px rgba(2,6,23,0.06));
    display: flex;
    flex-direction: column;
    gap: 14px;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.widget-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--elev-2, 0 12px 40px rgba(2,6,23,0.10));
}
.widget-card h3 {
    margin: 0;
    color: var(--text, #1f2937);
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.1rem;
    font-weight: 700;
}
.widget-card h3 svg {
    background: var(--primary-soft, rgba(192,21,42,0.1));
    color: var(--primary, #c0152a);
    width: 42px;
    height: 42px;
    padding: 10px;
    border-radius: 12px;
}
.widget-value {
    font-size: 2.5rem;
    font-weight: 800;
    color: var(--text, #0f172a);
    line-height: 1;
}
.widget-link {
    color: var(--muted, #6b7280);
    text-decoration: none;
    font-weight: 600;
    font-size: 0.95rem;
    margin-top: 4px;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
}
.widget-link::after {
    content: "→";
    opacity: 0;
    transform: translateX(-5px);
    transition: all 0.2s;
}
.widget-link:hover {
    color: var(--primary, #c0152a);
}
.widget-link:hover::after {
    opacity: 1;
    transform: translateX(0);
}
</style>
