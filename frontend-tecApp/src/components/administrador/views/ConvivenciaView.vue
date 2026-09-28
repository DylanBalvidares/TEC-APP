<template>
    <div class="convivencia-wrapper">
        <div class="search-bar-wrapper">
            <label class="filtro-inline">
                <span>Alumno (ID)</span>
                <input
                    v-model="idAlumno"
                    type="number"
                    min="1"
                    placeholder="Todos"
                    style="width: 110px"
                    aria-label="Filtrar por alumno"
                />
            </label>
            <button class="tb-btn outline sm" @click="cargar">Buscar</button>
            <button class="tb-btn primary sm exportar-btn" @click="modalAbierto = true">
                <i class="ti ti-plus" aria-hidden="true"></i> Nuevo registro
            </button>
        </div>

        <div v-if="error" class="error-banner" style="margin-bottom: 12px" role="alert">
            <i class="ti ti-alert-circle"></i> {{ error }}
            <button class="tb-btn sm outline" style="margin-left: auto" @click="cargar">
                Reintentar
            </button>
        </div>

        <div v-if="cargando" class="empty-state" role="status">
            <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
            <p>Cargando convivencia...</p>
        </div>

        <template v-else>
            <div class="card animate-fade-in">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-alert-triangle" aria-hidden="true"></i>
                        Sanciones ({{ sanciones.length }})
                    </div>
                </div>
                <div class="table-responsive">
                    <table v-if="sanciones.length > 0" class="mini" aria-label="Sanciones">
                        <thead>
                            <tr>
                                <th>Alumno</th>
                                <th>Tipo</th>
                                <th>Motivo</th>
                                <th>Fecha</th>
                                <th class="action-cell">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="s in sanciones" :key="s.id_sancion" class="table-row">
                                <td class="mono">#{{ s.id_alumno }}</td>
                                <td>
                                    <span class="status-pill sp-baja">{{ s.tipo }}</span>
                                </td>
                                <td>{{ s.motivo }}</td>
                                <td class="mono">{{ s.fecha }}</td>
                                <td class="action-cell">
                                    <div class="action-buttons">
                                        <button
                                            class="icon-btn delete"
                                            title="Eliminar sanción"
                                            aria-label="Eliminar sanción"
                                            @click="eliminar(s.id_sancion)"
                                        >
                                            <i class="ti ti-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <div v-else class="empty-state">
                        <p>No hay sanciones registradas.</p>
                    </div>
                </div>
            </div>

            <div class="card animate-fade-in">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-notes" aria-hidden="true"></i>
                        Observaciones ({{ observaciones.length }})
                    </div>
                </div>
                <div v-if="observaciones.length > 0" class="observaciones-lista">
                    <div v-for="o in observaciones" :key="o.id_observacion" class="list-item">
                        <div class="li-info">
                            <div class="li-name">#{{ o.id_alumno }} · {{ o.fecha }}</div>
                            <div class="li-sub">{{ o.texto }}</div>
                        </div>
                    </div>
                </div>
                <div v-else class="empty-state">
                    <p>No hay observaciones registradas.</p>
                </div>
            </div>
        </template>

        <Modal v-model="modalAbierto" title="Nuevo registro de convivencia">
            <div class="form-body">
                <div class="form-row">
                    <div class="form-group">
                        <label>Tipo de registro</label>
                        <select v-model="form.tipoRegistro">
                            <option value="sancion">Sanción</option>
                            <option value="observacion">Observación</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>ID del alumno <span class="required">*</span></label>
                        <input v-model.number="form.id_alumno" type="number" min="1" />
                    </div>
                </div>
                <div class="form-group" v-if="form.tipoRegistro === 'sancion'">
                    <label>Tipo de sanción</label>
                    <select v-model="form.tipo">
                        <option value="apercibimiento">Apercibimiento</option>
                        <option value="suspension">Suspensión</option>
                        <option value="amonestacion">Amonestación</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>{{ form.tipoRegistro === "sancion" ? "Motivo" : "Texto" }} <span class="required">*</span></label>
                    <textarea v-model="form.texto" rows="3"></textarea>
                </div>
                <div v-if="errorForm" class="error-banner" role="alert">
                    <i class="ti ti-alert-circle"></i> {{ errorForm }}
                </div>
            </div>
            <template #footer>
                <button class="tb-btn outline" @click="modalAbierto = false">Cancelar</button>
                <button class="tb-btn primary" :disabled="guardando" @click="guardar">
                    {{ guardando ? "Guardando..." : "Guardar" }}
                </button>
            </template>
        </Modal>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
    obtenerSanciones,
    crearSancion,
    eliminarSancion,
    obtenerObservaciones,
    crearObservacion,
} from "../../../services/academico-service.js";
import { toast } from "../../../services/toast-service.js";
import Modal from "../../ui/Modal.vue";

const sanciones = ref([]);
const observaciones = ref([]);
const idAlumno = ref("");
const cargando = ref(false);
const guardando = ref(false);
const error = ref("");
const errorForm = ref("");
const modalAbierto = ref(false);
const form = ref({ tipoRegistro: "sancion", id_alumno: null, tipo: "apercibimiento", texto: "" });

const lista = (res) => {
    const data = res?.data ?? res;
    return Array.isArray(data) ? data : [];
};

async function cargar() {
    cargando.value = true;
    error.value = "";
    try {
        const id = idAlumno.value || null;
        const [s, o] = await Promise.all([obtenerSanciones(id), obtenerObservaciones(id)]);
        if (!s.success) throw new Error(s.message);
        if (!o.success) throw new Error(o.message);
        sanciones.value = lista(s);
        observaciones.value = lista(o);
    } catch (e) {
        error.value = e?.message || "No se pudo cargar la convivencia.";
        sanciones.value = [];
        observaciones.value = [];
    } finally {
        cargando.value = false;
    }
}

async function guardar() {
    guardando.value = true;
    errorForm.value = "";
    try {
        const res =
            form.value.tipoRegistro === "sancion"
                ? await crearSancion({
                    id_alumno: form.value.id_alumno,
                    tipo: form.value.tipo,
                    motivo: form.value.texto,
                })
                : await crearObservacion({
                    id_alumno: form.value.id_alumno,
                    texto: form.value.texto,
                });
        if (!res.success) throw new Error(res.message);
        modalAbierto.value = false;
        form.value = { tipoRegistro: "sancion", id_alumno: null, tipo: "apercibimiento", texto: "" };
        toast.success("Registro guardado.");
        await cargar();
    } catch (e) {
        errorForm.value = e?.message || "No se pudo guardar.";
    } finally {
        guardando.value = false;
    }
}

async function eliminar(id) {
    const res = await eliminarSancion(id);
    if (!res.success) {
        toast.error(res.message || "No se pudo eliminar.");
        return;
    }
    toast.success("Sanción eliminada.");
    await cargar();
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
    padding: 10px 0;
    border-bottom: 0.5px solid #e5e7eb;
}
.list-item:last-child {
    border-bottom: none;
}
.li-name {
    font-size: 12.5px;
    font-weight: 600;
    color: #111827;
}
.li-sub {
    font-size: 12.5px;
    color: #4b5563;
    margin-top: 2px;
}
</style>
