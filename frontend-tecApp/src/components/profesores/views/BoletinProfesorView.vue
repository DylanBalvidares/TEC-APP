<template>
  <div class="boletin-profesor">
    <div class="boletines-header">
      <h1><i class="fas fa-file-signature"></i> Boletines Cuatrimestrales</h1>
      <p>Cargá la calificación final de cada alumno. El 0 es válido; la ausencia de dato queda pendiente.</p>
    </div>

    <div class="cursos-selector-wrap" v-if="periodos.length > 0">
      <label for="periodoSelect"><strong>Período:</strong></label>
      <select id="periodoSelect" v-model="periodoId" @change="cargar" class="select-curso">
        <option v-for="p in periodos" :key="p.id_periodo" :value="p.id_periodo">
          Ciclo {{ p.ciclo_lectivo }} — {{ p.cuatrimestre }}º cuatrimestre
          ({{ p.estado }}{{ p.vigente ? ", vigente" : "" }})
        </option>
      </select>
    </div>

    <div v-if="cargando" class="mensaje-estado">
      <i class="fas fa-spinner fa-spin"></i> Cargando...
    </div>
    <div v-else-if="error" class="mensaje-estado error">
      <i class="fas fa-circle-exclamation"></i> {{ error }}
    </div>
    <div v-else-if="asignaciones.length === 0" class="mensaje-estado">
      <i class="fas fa-school"></i> No tenés materias asignadas en este período.
    </div>

    <div v-for="asig in asignaciones" :key="asig.id_asignacion" class="materia-card">
      <div class="materia-head">
        <h2>
          {{ asig.materiaAsignacion?.nombre_materia || "Materia" }}
          <small>{{ asig.cursoAsignacion?.nombre_curso }}</small>
        </h2>
        <span :class="['badge', estadoClase(asig.id_asignacion)]">
          {{ estadoTexto(asig.id_asignacion) }}
        </span>
      </div>
      <p v-if="!infoAsignacion(asig.id_asignacion)?.preparada" class="aviso">
        <i class="fas fa-triangle-exclamation"></i> Administración aún no preparó esta materia para el período.
      </p>
      <p v-else-if="!infoAsignacion(asig.id_asignacion)?.puedeEscribir" class="aviso">
        <i class="fas fa-lock"></i> {{ infoAsignacion(asig.id_asignacion)?.motivoBloqueo }}
      </p>

      <div class="table-responsive">
        <table class="planilla-table">
          <thead>
            <tr>
              <th>Alumno</th>
              <th>Actual</th>
              <th>Tipo</th>
              <th>Nota / Motivo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="al in alumnosDe(asig.id_curso)" :key="al.id_alumno">
              <td class="font-bold">{{ al.apellido }}, {{ al.nombre }}</td>
              <td class="text-center">
                <span class="grade-badge">{{ etiquetaActual(asig.id_asignacion, al.id_alumno) }}</span>
              </td>
              <td>
                <select v-model="edicion(asig.id_asignacion, al.id_alumno).tipo" :disabled="!editable(asig.id_asignacion)">
                  <option value="numerica">Numérica</option>
                  <option value="TED">TED</option>
                  <option value="TEP">TEP</option>
                  <option value="TEA">TEA</option>
                  <option value="sin_calificar">Sin calificar</option>
                </select>
              </td>
              <td>
                <input
                  v-if="edicion(asig.id_asignacion, al.id_alumno).tipo === 'numerica'"
                  type="number" min="0" max="10" step="0.5"
                  v-model.number="edicion(asig.id_asignacion, al.id_alumno).valor"
                  :disabled="!editable(asig.id_asignacion)"
                  placeholder="0 – 10"
                />
                <input
                  v-else-if="edicion(asig.id_asignacion, al.id_alumno).tipo === 'sin_calificar'"
                  type="text"
                  v-model="edicion(asig.id_asignacion, al.id_alumno).motivo"
                  :disabled="!editable(asig.id_asignacion)"
                  placeholder="Motivo obligatorio"
                />
                <span v-else class="text-muted">—</span>
              </td>
              <td class="text-center">
                <button
                  class="btn-guardar"
                  :disabled="!editable(asig.id_asignacion) || guardando[clave(asig.id_asignacion, al.id_alumno)]"
                  @click="guardar(asig.id_asignacion, al.id_alumno)"
                >
                  Guardar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="materia-acciones">
        <button
          class="btn-finalizar"
          :disabled="!editable(asig.id_asignacion) || pendientes(asig) > 0"
          @click="finalizar(asig.id_asignacion)"
          :title="pendientes(asig) > 0 ? `Quedan ${pendientes(asig)} pendientes` : 'Finalizar carga'"
        >
          <i class="fas fa-check-double"></i>
          Finalizar materia{{ pendientes(asig) > 0 ? ` (${pendientes(asig)} pendientes)` : "" }}
        </button>
        <div v-if="esFinalizada(asig.id_asignacion)" class="reapertura-form">
          <input type="text" v-model="motivosReapertura[asig.id_asignacion]" placeholder="Motivo de reapertura" />
          <button class="btn-reapertura" @click="solicitarReapertura(asig.id_asignacion)">
            <i class="fas fa-rotate-right"></i> Solicitar reapertura
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  obtenerPeriodosBoletin,
  obtenerCargaProfesorBoletin,
  guardarCalificacionBoletin,
  finalizarMateriaBoletin,
  solicitarReaperturaBoletin,
  etiquetaCalificacion,
} from "@/services/boletines-service.js";
import { toast } from "@/services/toast-service.js";

const periodos = ref([]);
const periodoId = ref(null);
const asignaciones = ref([]);
const alumnos = ref([]);
const calificaciones = ref([]);
const finalizaciones = ref([]);
const porAsignacion = ref({});
const ediciones = ref({});
const guardando = ref({});
const motivosReapertura = ref({});
const cargando = ref(true);
const error = ref("");

const clave = (idAsig, idAl) => `${idAsig}:${idAl}`;

const edicion = (idAsig, idAl) => {
  const k = clave(idAsig, idAl);
  if (!ediciones.value[k]) {
    const actual = califActual(idAsig, idAl);
    ediciones.value[k] = actual
      ? { tipo: actual.tipo, valor: actual.valor === null ? null : Number(actual.valor), motivo: actual.motivo || "" }
      : { tipo: "numerica", valor: null, motivo: "" };
  }
  return ediciones.value[k];
};

const infoAsignacion = (idAsig) => porAsignacion.value[idAsig] || {};
const editable = (idAsig) => {
  const info = infoAsignacion(idAsig);
  return info.preparada && info.puedeEscribir;
};

const alumnosDe = (idCurso) => alumnos.value.filter((a) => a.id_curso === idCurso);

const califActual = (idAsig, idAl) =>
  calificaciones.value.find((c) => c.id_asignacion === idAsig && c.id_alumno === idAl);

const etiquetaActual = (idAsig, idAl) => {
  const c = califActual(idAsig, idAl);
  return c ? etiquetaCalificacion(c.tipo, c.valor) : "Pendiente";
};

const estadoDe = (idAsig) =>
  finalizaciones.value.find((f) => f.id_asignacion === idAsig)?.estado || "pendiente";

const esFinalizada = (idAsig) => estadoDe(idAsig) === "finalizada";

const estadoTexto = (idAsig) => {
  const e = estadoDe(idAsig);
  return e === "finalizada" ? "Finalizada" : e === "en_progreso" ? "En progreso" : "Pendiente";
};

const estadoClase = (idAsig) => {
  const e = estadoDe(idAsig);
  return e === "finalizada" ? "badge-ok" : e === "en_progreso" ? "badge-progreso" : "badge-pendiente";
};

const pendientes = (asig) => {
  const als = alumnosDe(asig.id_curso);
  return als.filter((a) => !califActual(asig.id_asignacion, a.id_alumno)).length;
};

const cargarPeriodos = async () => {
  const res = await obtenerPeriodosBoletin();
  if (!res.success) {
    error.value = res.message;
    return false;
  }
  periodos.value = res.data;
  if (periodos.value.length && !periodoId.value) {
    periodoId.value = periodos.value[0].id_periodo;
  }
  return true;
};

const cargar = async () => {
  if (!periodoId.value) return;
  cargando.value = true;
  error.value = "";
  const res = await obtenerCargaProfesorBoletin(periodoId.value);
  cargando.value = false;
  if (!res.success) {
    error.value = res.message;
    return;
  }
  asignaciones.value = res.data.asignaciones || [];
  alumnos.value = res.data.alumnos || [];
  calificaciones.value = res.data.calificaciones || [];
  finalizaciones.value = res.data.finalizaciones || [];
  porAsignacion.value = res.data.porAsignacion || {};
  ediciones.value = {};
};

const guardar = async (idAsig, idAl) => {
  const k = clave(idAsig, idAl);
  const ed = edicion(idAsig, idAl);
  guardando.value[k] = true;
  const res = await guardarCalificacionBoletin({
    id_periodo: periodoId.value,
    id_asignacion: idAsig,
    id_alumno: idAl,
    tipo: ed.tipo,
    valor: ed.tipo === "numerica" ? ed.valor : null,
    motivo: ed.motivo || null,
  });
  guardando.value[k] = false;
  if (!res.success) {
    toast.error(res.message);
    return;
  }
  toast.success("Calificación guardada");
  await cargar();
};

const finalizar = async (idAsig) => {
  const res = await finalizarMateriaBoletin(periodoId.value, idAsig);
  if (!res.success) {
    toast.error(res.message);
    return;
  }
  toast.success("Materia finalizada: el preceptor ya puede ver la planilla");
  await cargar();
};

const solicitarReapertura = async (idAsig) => {
  const motivo = (motivosReapertura.value[idAsig] || "").trim();
  if (!motivo) {
    toast.error("Indicá el motivo de la reapertura");
    return;
  }
  const res = await solicitarReaperturaBoletin(periodoId.value, idAsig, motivo);
  if (!res.success) {
    toast.error(res.message);
    return;
  }
  toast.success("Solicitud enviada a administración");
  motivosReapertura.value[idAsig] = "";
};

onMounted(async () => {
  cargando.value = true;
  const ok = await cargarPeriodos();
  if (ok && periodoId.value) await cargar();
  else cargando.value = false;
});
</script>

<style scoped>
.boletin-profesor { display: flex; flex-direction: column; gap: 1rem; }
.materia-card { background: var(--color-background-primary, #fff); border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem; }
.materia-head { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; }
.materia-head h2 { margin: 0; font-size: 1.1rem; }
.materia-head small { font-weight: 400; color: #6b7280; }
.badge { padding: 0.2rem 0.7rem; border-radius: 999px; font-size: 0.8rem; font-weight: 700; }
.badge-ok { background: #dcfce7; color: #166534; }
.badge-progreso { background: #fef9c3; color: #854d0e; }
.badge-pendiente { background: #f3f4f6; color: #4b5563; }
.aviso { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 0.5rem 0.75rem; font-size: 0.9rem; }
.materia-acciones { display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: center; margin-top: 0.75rem; }
.btn-guardar, .btn-finalizar, .btn-reapertura { border: none; border-radius: 8px; padding: 0.45rem 0.9rem; font-weight: 600; cursor: pointer; }
.btn-guardar { background: #2563eb; color: #fff; }
.btn-finalizar { background: #16a34a; color: #fff; }
.btn-reapertura { background: #f59e0b; color: #fff; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
.reapertura-form { display: flex; gap: 0.5rem; }
.reapertura-form input, td input, td select { border: 1px solid #d1d5db; border-radius: 8px; padding: 0.35rem 0.5rem; }
.grade-badge { display: inline-block; min-width: 2.2rem; padding: 0.15rem 0.5rem; border-radius: 999px; background: #eef2ff; font-weight: 700; }
</style>
