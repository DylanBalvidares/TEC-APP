<template>
    <div class="objetos-wrapper">
        <div v-if="error" class="error-banner" style="margin-bottom: 12px" role="alert">
            <i class="ti ti-alert-circle"></i> {{ error }}
            <button class="tb-btn sm outline" style="margin-left: auto" @click="cargar">
                Reintentar
            </button>
        </div>

        <div class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-package" aria-hidden="true"></i>
                    Objetos perdidos ({{ objetos.length }})
                </div>
            </div>
            <div class="table-responsive">
                <div v-if="cargando" class="empty-state" role="status">
                    <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
                    <p>Cargando objetos...</p>
                </div>

                <table v-else-if="objetos.length > 0" class="mini" aria-label="Objetos perdidos">
                    <thead>
                        <tr>
                            <th>Objeto</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th class="action-cell">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="o in objetos" :key="o.id_objeto" class="table-row">
                            <td><strong>{{ o.nombre }}</strong></td>
                            <td>{{ o.descripcion || "—" }}</td>
                            <td>
                                <span class="status-pill" :class="claseEstado(o.estado)">
                                    {{ o.estado }}
                                </span>
                            </td>
                            <td class="action-cell">
                                <div class="action-buttons">
                                    <button
                                        v-for="siguiente in siguientes(o.estado)"
                                        :key="siguiente"
                                        class="tb-btn outline sm"
                                        :title="`Marcar como ${siguiente}`"
                                        @click="cambiarEstado(o, siguiente)"
                                    >
                                        {{ etiqueta(siguiente) }}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-else class="empty-state">
                    <i class="ti ti-package-off" style="font-size: 28px; opacity: 0.4"></i>
                    <p>No hay objetos registrados.</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
    obtenerObjetosPerdidos,
    actualizarEstadoObjetoPerdido,
} from "../../../services/comunidad-service.js";
import { toast } from "../../../services/toast-service.js";

const objetos = ref([]);
const cargando = ref(false);
const error = ref("");

const FLUJO = {
    perdido: ["encontrado"],
    encontrado: ["reclamado", "perdido"],
    reclamado: [],
};

function siguientes(estado) {
    return FLUJO[estado] || [];
}

function etiqueta(estado) {
    return { encontrado: "Encontrado", reclamado: "Reclamar", perdido: "Perdido" }[estado] || estado;
}

function claseEstado(estado) {
    return { perdido: "sp-baja", encontrado: "sp-pendiente", reclamado: "sp-leido" }[estado] || "sp-pendiente";
}

const lista = (res) => (Array.isArray(res) ? res : (res?.data || []));

async function cargar() {
    cargando.value = true;
    error.value = "";
    try {
        objetos.value = lista(await obtenerObjetosPerdidos());
    } catch (e) {
        error.value = e?.message || "No se pudieron cargar los objetos.";
        objetos.value = [];
    } finally {
        cargando.value = false;
    }
}

async function cambiarEstado(objeto, estado) {
    const res = await actualizarEstadoObjetoPerdido(objeto.id_objeto, estado);
    if (!res.success) {
        toast.error(res.message || "No se pudo cambiar el estado.");
        return;
    }
    toast.success(`Objeto marcado como ${estado}.`);
    await cargar();
}

onMounted(cargar);
</script>
