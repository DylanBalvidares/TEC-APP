<template>
    <div class="notificaciones-wrapper">
        <div v-if="error" class="error-banner" style="margin-bottom: 12px" role="alert">
            <i class="ti ti-alert-circle"></i> {{ error }}
            <button class="tb-btn sm outline" style="margin-left: auto" @click="cargar">
                Reintentar
            </button>
        </div>

        <div class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-bell" aria-hidden="true"></i>
                    Centro de notificaciones ({{ total }})
                </div>
                <label class="toggle-bajas" title="Solo no leídas">
                    <input v-model="soloNoLeidas" type="checkbox" @change="cargar" />
                    <span class="toggle-label">No leídas</span>
                </label>
            </div>

            <div v-if="cargando" class="empty-state" role="status">
                <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
                <p>Cargando notificaciones...</p>
            </div>

            <div v-else-if="notificaciones.length > 0" class="observaciones-lista">
                <div
                    v-for="n in notificaciones"
                    :key="n.id_notificacion"
                    class="list-item"
                    :class="{ 'row-unread': !n.leida }"
                >
                    <div class="li-info">
                        <div class="li-name">
                            {{ n.titulo }}
                            <span class="status-pill sp-cargo">{{ n.tipo }}</span>
                        </div>
                        <div class="li-sub">{{ n.cuerpo || "—" }} · {{ formatearFecha(n.fecha) }}</div>
                    </div>
                    <button
                        v-if="!n.leida"
                        class="tb-btn outline sm"
                        @click="marcarLeida(n.id_notificacion)"
                    >
                        Marcar leída
                    </button>
                </div>
            </div>

            <div v-else class="empty-state">
                <i class="ti ti-bell-off" style="font-size: 28px; opacity: 0.4"></i>
                <p>No tenés notificaciones.</p>
            </div>
        </div>

        <div class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-settings" aria-hidden="true"></i>
                    Preferencias por tipo
                </div>
            </div>
            <div class="form-body">
                <div v-for="tipo in TIPOS" :key="tipo" class="form-row">
                    <div class="form-group">
                        <label style="text-transform: capitalize">{{ tipo }}</label>
                    </div>
                    <div class="form-group">
                        <label
                            v-for="canal in CANALES"
                            :key="canal"
                            class="check-lineal"
                        >
                            <input
                                type="checkbox"
                                :checked="canalActivo(tipo, canal)"
                                @change="alternarCanal(tipo, canal, $event.target.checked)"
                            />
                            {{ canal }}
                        </label>
                    </div>
                </div>
                <div class="search-bar-wrapper">
                    <button class="tb-btn primary" :disabled="guardando" @click="guardar">
                        {{ guardando ? "Guardando..." : "Guardar preferencias" }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import {
    obtenerMisNotificaciones,
    marcarNotificacionLeida,
    obtenerPreferencias,
    guardarPreferencias,
} from "../../../services/notificaciones-service.js";
import { toast } from "../../../services/toast-service.js";

const TIPOS = ["inasistencia", "reunion", "sancion", "nota", "comunicado", "sistema"];
const CANALES = ["panel", "email", "whatsapp"];
const DEFECTO = {
    inasistencia: ["panel", "whatsapp"],
    reunion: ["panel", "email"],
    sancion: ["panel", "whatsapp"],
    nota: ["panel"],
    comunicado: ["panel", "email"],
    sistema: ["panel"],
};

const notificaciones = ref([]);
const total = ref(0);
const soloNoLeidas = ref(false);
const cargando = ref(false);
const guardando = ref(false);
const error = ref("");
const prefs = reactive({});

function canalActivo(tipo, canal) {
    if (Object.hasOwn(prefs, tipo)) {
        const v = prefs[tipo];
        return v !== false && v.includes(canal);
    }
    return (DEFECTO[tipo] || []).includes(canal);
}

function alternarCanal(tipo, canal, marcado) {
    const actual = new Set(
        Object.hasOwn(prefs, tipo) && prefs[tipo] !== false
            ? prefs[tipo]
            : [...(DEFECTO[tipo] || [])],
    );
    if (marcado) actual.add(canal);
    else actual.delete(canal);
    prefs[tipo] = [...actual];
}

function formatearFecha(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

async function cargar() {
    cargando.value = true;
    error.value = "";
    try {
        const [n, p] = await Promise.all([
            obtenerMisNotificaciones(soloNoLeidas.value),
            obtenerPreferencias(),
        ]);
        if (!n.success) throw new Error(n.message);
        notificaciones.value = n.data;
        total.value = n.total;
        if (p.success) Object.assign(prefs, p.data);
    } catch (e) {
        error.value = e?.message || "No se pudieron cargar las notificaciones.";
    } finally {
        cargando.value = false;
    }
}

async function marcarLeida(id) {
    const res = await marcarNotificacionLeida(id);
    if (!res.success) {
        toast.error(res.message || "No se pudo marcar.");
        return;
    }
    await cargar();
}

async function guardar() {
    guardando.value = true;
    try {
        const res = await guardarPreferencias({ ...prefs });
        if (!res.success) throw new Error(res.message);
        toast.success("Preferencias guardadas.");
    } catch (e) {
        toast.error(e?.message || "No se pudo guardar.");
    } finally {
        guardando.value = false;
    }
}

onMounted(cargar);
</script>

<style scoped>
.observaciones-lista {
    display: flex;
    flex-direction: column;
    padding: 4px 20px 16px;
}
.list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 0.5px solid #e5e7eb;
}
.list-item:last-child {
    border-bottom: none;
}
.li-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 3px;
}
.li-name {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    display: flex;
    align-items: center;
    gap: 8px;
}
.li-sub {
    font-size: 12px;
    color: #6b7280;
}
.row-unread .li-name {
    font-weight: 700;
}
.check-lineal {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-right: 14px;
    font-size: 12.5px;
    text-transform: capitalize;
}
</style>
