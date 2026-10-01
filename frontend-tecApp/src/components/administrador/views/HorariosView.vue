<template>
    <div class="horarios-wrapper">
        <div class="search-bar-wrapper">
            <label class="filtro-inline">
                <span>Curso</span>
                <select v-model="idCurso" @change="cargar">
                    <option value="">Todos</option>
                    <option v-for="c in cursos" :key="c.id_curso" :value="c.id_curso">
                        {{ c.nombre_curso }}
                    </option>
                </select>
            </label>
            <button class="tb-btn primary sm exportar-btn" @click="modalAbierto = true">
                <i class="ti ti-plus" aria-hidden="true"></i> Nuevo bloque
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
            <p>Cargando grilla horaria...</p>
        </div>

        <div v-else-if="bloques.length === 0" class="empty-state">
            <i class="ti ti-calendar-off" style="font-size: 28px; opacity: 0.4"></i>
            <p>No hay bloques horarios cargados.</p>
        </div>

        <div v-else class="card animate-fade-in">
            <div class="table-responsive">
                <table class="mini" aria-label="Grilla horaria">
                    <thead>
                        <tr>
                            <th>Día</th>
                            <th>Horario</th>
                            <th>Curso</th>
                            <th>Materia</th>
                            <th>Profesor</th>
                            <th>Aula</th>
                            <th class="action-cell">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="b in bloques" :key="b.id_horario" class="table-row">
                            <td><strong>{{ DIAS[b.dia] || b.dia }}</strong></td>
                            <td class="mono">{{ b.hora_inicio }}–{{ b.hora_fin }}</td>
                            <td>{{ nombreCurso(b) }}</td>
                            <td>{{ nombreMateria(b) }}</td>
                            <td>{{ nombreProfesor(b) }}</td>
                            <td>{{ b.aula || "—" }}</td>
                            <td class="action-cell">
                                <div class="action-buttons">
                                    <button
                                        class="icon-btn delete"
                                        title="Eliminar bloque"
                                        aria-label="Eliminar bloque"
                                        @click="pedirEliminar(b)"
                                    >
                                        <i class="ti ti-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <Modal v-model="modalAbierto" title="Nuevo bloque horario">
            <div class="form-body">
                <div class="form-group">
                    <label>Asignación (profesor · materia · curso)</label>
                    <select v-model="form.id_asignacion">
                        <option value="">Elegir...</option>
                        <option
                            v-for="a in asignaciones"
                            :key="a.id_asignacion"
                            :value="a.id_asignacion"
                        >
                            {{ etiquetaAsignacion(a) }}
                        </option>
                    </select>
                </div>
                <div class="form-row triple">
                    <div class="form-group">
                        <label>Día</label>
                        <select v-model.number="form.dia">
                            <option v-for="(nombre, n) in DIAS" :key="n" :value="Number(n)">
                                {{ nombre }}
                            </option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Inicio</label>
                        <input v-model="form.hora_inicio" type="time" />
                    </div>
                    <div class="form-group">
                        <label>Fin</label>
                        <input v-model="form.hora_fin" type="time" />
                    </div>
                </div>
                <div class="form-group">
                    <label>Aula (opcional)</label>
                    <input v-model="form.aula" placeholder="Ej: A1" />
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

        <Modal v-model="confirmacionEliminarAbierta" title="Eliminar bloque horario" variante="danger">
            <p class="modal-texto">
                ¿Querés eliminar el bloque de {{ DIAS[bloquePendiente?.dia] || "horario" }}
                {{ bloquePendiente?.hora_inicio }}–{{ bloquePendiente?.hora_fin }}
                para {{ nombreCurso(bloquePendiente || {}) }}?
            </p>
            <template #footer>
                <button class="tb-btn outline" :disabled="eliminando" @click="confirmacionEliminarAbierta = false">Cancelar</button>
                <button class="tb-btn danger" :disabled="eliminando" @click="confirmarEliminar">
                    <i v-if="eliminando" class="ti ti-loader animate-spin" aria-hidden="true"></i>
                    {{ eliminando ? "Eliminando…" : "Eliminar bloque" }}
                </button>
            </template>
        </Modal>
    </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
    obtenerHorarios,
    crearHorario,
    eliminarHorario,
    obtenerCursos,
    obtenerAsignaciones,
} from "../../../services/academico-service.js";
import { toast } from "../../../services/toast-service.js";
import Modal from "../../ui/Modal.vue";

const DIAS = { 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado" };

const bloques = ref([]);
const cursos = ref([]);
const asignaciones = ref([]);
const idCurso = ref("");
const cargando = ref(false);
const guardando = ref(false);
const error = ref("");
const errorForm = ref("");
const modalAbierto = ref(false);
const confirmacionEliminarAbierta = ref(false);
const bloquePendiente = ref(null);
const eliminando = ref(false);
const form = ref({ id_asignacion: "", dia: 1, hora_inicio: "", hora_fin: "", aula: "" });

const lista = (res) => {
    const data = res?.data ?? res;
    return Array.isArray(data) ? data : (data?.data || []);
};

function nombreCurso(b) {
    return b.Asignacion?.cursoAsignacion?.nombre_curso || "—";
}
function nombreMateria(b) {
    return b.Asignacion?.materiaAsignacion?.nombre_materia || "—";
}
function nombreProfesor(b) {
    const p = b.Asignacion?.profesorAsignacion;
    return p ? `${p.apellido || ""} ${p.nombre || ""}`.trim() : "—";
}
function etiquetaAsignacion(a) {
    const p = a.profesorAsignacion || a.profesor || {};
    const m = a.materiaAsignacion || a.materia || {};
    const c = a.cursoAsignacion || a.curso || {};
    return `${p.apellido || ""} ${p.nombre || ""} · ${m.nombre_materia || "?"} · ${c.nombre_curso || "?"}`.trim();
}

async function cargar() {
    cargando.value = true;
    error.value = "";
    try {
        const [h, c, a] = await Promise.all([
            obtenerHorarios(idCurso.value || null),
            obtenerCursos(),
            obtenerAsignaciones(),
        ]);
        if (!h.success) throw new Error(h.message);
        bloques.value = lista(h);
        if (c.success) cursos.value = lista(c);
        if (a.success) asignaciones.value = lista(a);
    } catch (e) {
        error.value = e?.message || "No se pudo cargar la grilla.";
        bloques.value = [];
    } finally {
        cargando.value = false;
    }
}

async function guardar() {
    guardando.value = true;
    errorForm.value = "";
    try {
        const res = await crearHorario({ ...form.value });
        if (!res.success) throw new Error(res.message);
        modalAbierto.value = false;
        form.value = { id_asignacion: "", dia: 1, hora_inicio: "", hora_fin: "", aula: "" };
        toast.success("Bloque horario creado.");
        await cargar();
    } catch (e) {
        errorForm.value = e?.message || "No se pudo crear el bloque.";
    } finally {
        guardando.value = false;
    }
}

function pedirEliminar(bloque) {
    bloquePendiente.value = bloque;
    confirmacionEliminarAbierta.value = true;
}

async function confirmarEliminar() {
    if (!bloquePendiente.value || eliminando.value) return;
    eliminando.value = true;
    try {
        const res = await eliminarHorario(bloquePendiente.value.id_horario);
        if (!res.success) {
            toast.error(res.message || "No se pudo eliminar el bloque horario.");
            return;
        }
        confirmacionEliminarAbierta.value = false;
        bloquePendiente.value = null;
        toast.success("Bloque eliminado.");
        await cargar();
    } catch (e) {
        toast.error(e?.message || "No se pudo eliminar el bloque horario.");
    } finally {
        eliminando.value = false;
    }
}

onMounted(cargar);
</script>
