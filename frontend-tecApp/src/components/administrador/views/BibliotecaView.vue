<template>
    <div class="biblioteca-wrapper">
        <div v-if="error" class="error-banner" style="margin-bottom: 12px" role="alert">
            <i class="ti ti-alert-circle"></i> {{ error }}
            <button class="tb-btn sm outline" style="margin-left: auto" @click="cargar">
                Reintentar
            </button>
        </div>

        <div v-if="cargando" class="empty-state" role="status">
            <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
            <p>Cargando biblioteca...</p>
        </div>

        <template v-else>
            <div class="card animate-fade-in">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-books" aria-hidden="true"></i>
                        Recursos ({{ recursos.length }})
                    </div>
                </div>
                <div class="table-responsive">
                    <table v-if="recursos.length > 0" class="mini" aria-label="Recursos de biblioteca">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Tipo</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="r in recursos" :key="r.id_recurso" class="table-row">
                                <td><strong>{{ r.nombre }}</strong></td>
                                <td>{{ r.tipo }}</td>
                                <td>
                                    <span class="status-pill" :class="r.estado === 'disponible' ? 'sp-activo' : 'sp-pendiente'">
                                        {{ r.estado }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="empty-state">
                        <p>No hay recursos registrados.</p>
                    </div>
                </div>
            </div>

            <div class="card animate-fade-in">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-arrows-exchange" aria-hidden="true"></i>
                        Préstamos ({{ prestamos.length }})
                    </div>
                </div>
                <div class="table-responsive">
                    <table v-if="prestamos.length > 0" class="mini" aria-label="Préstamos">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Préstamo</th>
                                <th>Devolución</th>
                                <th>Estado</th>
                                <th class="action-cell">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="p in prestamos"
                                :key="p.id_prestamo ?? p.id"
                                class="table-row"
                                :class="{ 'row-vencido': estaVencido(p) }"
                            >
                                <td class="mono">{{ p.id_prestamo ?? p.id }}</td>
                                <td class="mono">{{ p.fecha_prestamo }}</td>
                                <td class="mono">{{ p.fecha_devolucion || "—" }}</td>
                                <td>
                                    <span
                                        class="status-pill"
                                        :class="p.estado === 'devuelto' ? 'sp-leido' : estaVencido(p) ? 'sp-baja' : 'sp-pendiente'"
                                    >
                                        {{ estaVencido(p) ? "Vencido" : (p.estado || "Prestado") }}
                                    </span>
                                </td>
                                <td class="action-cell">
                                    <div class="action-buttons">
                                        <button
                                            v-if="p.estado !== 'devuelto'"
                                            class="icon-btn check"
                                            title="Registrar devolución"
                                            aria-label="Registrar devolución"
                                            @click="devolver(p)"
                                        >
                                            <i class="ti ti-check"></i>
                                        </button>
                                        <span v-else class="email-cell">—</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="empty-state">
                        <p>No hay préstamos registrados.</p>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
    obtenerRecursos,
    obtenerPrestamos,
    registrarDevolucion,
} from "../../../services/biblioteca-service.js";
import { toast } from "../../../services/toast-service.js";

const recursos = ref([]);
const prestamos = ref([]);
const cargando = ref(false);
const error = ref("");

const lista = (res) => {
    const data = res?.data ?? res;
    return Array.isArray(data) ? data : [];
};

function estaVencido(p) {
    if (!p || p.estado === "devuelto" || !p.fecha_devolucion) return false;
    const hoy = new Date().toISOString().slice(0, 10);
    return String(p.fecha_devolucion).slice(0, 10) < hoy;
}

async function cargar() {
    cargando.value = true;
    error.value = "";
    try {
        const [r, p] = await Promise.all([obtenerRecursos(), obtenerPrestamos()]);
        if (!r.success) throw new Error(r.message);
        if (!p.success) throw new Error(p.message);
        recursos.value = lista(r);
        prestamos.value = lista(p);
    } catch (e) {
        error.value = e?.message || "No se pudo cargar la biblioteca.";
    } finally {
        cargando.value = false;
    }
}

async function devolver(p) {
    const res = await registrarDevolucion(p);
    if (!res.success) {
        toast.error(res.message || "No se pudo registrar la devolución.");
        return;
    }
    toast.success("Devolución registrada.");
    await cargar();
}

onMounted(cargar);
</script>
