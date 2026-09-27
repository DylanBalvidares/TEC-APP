<template>
  <div class="card animate-fade-in">
    <div class="card-header">
      <div class="card-title"><i class="ti ti-brand-whatsapp" aria-hidden="true"></i> Nuevo mensaje</div>
    </div>

    <!-- Filtros extra (ej. selector de curso en preceptor) -->
    <slot name="filtros-extra" />

    <div class="form-row">
      <div class="form-group">
        <label :for="uid + '-buscar'">Buscar alumno</label>
        <div class="search-box">
          <i class="ti ti-search"></i>
          <input
            :id="uid + '-buscar'"
            v-model="busqueda"
            type="text"
            placeholder="Nombre, apellido o DNI..."
            aria-label="Buscar alumno"
          />
          <button v-if="busqueda" class="search-clear" aria-label="Limpiar búsqueda" @click="busqueda = ''">
            <i class="ti ti-x"></i>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label :for="uid + '-alumno'">Alumno (tutor destinatario)</label>
        <select :id="uid + '-alumno'" v-model="idAlumno" :disabled="cargandoAlumnos || filtrados.length === 0">
          <option value="" disabled>
            {{ cargandoAlumnos ? "Cargando alumnos..." : filtrados.length === 0 ? "Sin alumnos disponibles" : "Seleccioná un alumno" }}
          </option>
          <option v-for="a in filtrados" :key="a.id_alumno" :value="a.id_alumno">
            {{ a.apellido }}, {{ a.nombre }}{{ a.telefono_tutor ? "" : " — SIN TELÉFONO" }}
          </option>
        </select>
      </div>
    </div>

    <!-- Tarjeta de destino -->
    <div v-if="destinatario" class="destino-card" :class="{ 'destino-alerta': analisisTelefono.estado !== 'ok' }">
      <i class="ti" :class="analisisTelefono.estado === 'ok' ? 'ti-user-check' : 'ti-alert-triangle'"></i>
      <div>
        <strong>{{ destinatario.nombre_tutor || "Tutor no registrado" }}</strong>
        <span class="mono">{{ destinoTexto }}</span>
        <small v-if="analisisTelefono.estado === 'vacio'">No se podrá enviar: el alumno no tiene teléfono de tutor.</small>
        <small v-else-if="analisisTelefono.estado === 'error'">No se podrá enviar: {{ analisisTelefono.mensaje }} Pedí al admin que corrija el número en la ficha del alumno.</small>
        <small v-else>El mensaje llegará al WhatsApp de este número.</small>
      </div>
    </div>

    <div class="plantillas">
      <span class="plantillas-label">Plantillas:</span>
      <button
        v-for="p in plantillas"
        :key="p.nombre"
        type="button"
        class="tb-btn sm outline"
        @click="cuerpo = p.texto"
      >
        {{ p.nombre }}
      </button>
    </div>

    <div class="form-group full-width">
      <label :for="uid + '-cuerpo'">Mensaje (máx. {{ LIMITE }})</label>
      <textarea
        :id="uid + '-cuerpo'"
        v-model="cuerpo"
        rows="4"
        :maxlength="LIMITE"
        placeholder="Escribí el mensaje para el tutor..."
      ></textarea>
      <small class="contador" :class="{ 'contador-alerta': cuerpo.length >= UMBRAL }">
        {{ cuerpo.length }}/{{ LIMITE }}
      </small>
    </div>

    <div class="form-row actions-row">
      <button
        type="button"
        class="tb-btn primary"
        :disabled="!puedeEnviar"
        @click="modalConfirmar = true"
      >
        <i class="ti ti-send"></i>
        Enviar WhatsApp
      </button>
    </div>

    <Modal v-model="modalConfirmar" title="Confirmar envío">
      <p>
        Se enviará el mensaje al tutor de
        <strong>{{ destinatario?.apellido }}, {{ destinatario?.nombre }}</strong>
        al número <strong class="mono">{{ destinoTexto }}</strong>:
      </p>
      <p class="cuerpo-preview">{{ cuerpo }}</p>
      <template #footer>
        <button class="tb-btn outline" @click="modalConfirmar = false">Cancelar</button>
        <button class="tb-btn primary" :disabled="enviando" @click="confirmar">
          {{ enviando ? "Enviando..." : "Confirmar envío" }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import Modal from "@/components/ui/Modal.vue";
import { PLANTILLAS_WHATSAPP, LIMITE_MENSAJE, UMBRAL_AVISO } from "./plantillas.js";
import { analizarTelefono, formatearTelefonoAR } from "@/utils/telefonos.js";

const props = defineProps({
  alumnos: { type: Array, default: () => [] },
  cargandoAlumnos: { type: Boolean, default: false },
  enviando: { type: Boolean, default: false },
});

const emit = defineEmits(["enviar"]);

const uid = `wpp-${Math.random().toString(36).slice(2, 8)}`;
const LIMITE = LIMITE_MENSAJE;
const UMBRAL = UMBRAL_AVISO;
const plantillas = PLANTILLAS_WHATSAPP;

const busqueda = ref("");
const idAlumno = ref("");
const cuerpo = ref("");
const modalConfirmar = ref(false);

const filtrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim();
  if (!q) return props.alumnos;
  return props.alumnos.filter((a) =>
    `${a.apellido} ${a.nombre} ${a.dni || ""}`.toLowerCase().includes(q),
  );
});

const destinatario = computed(() =>
  props.alumnos.find((a) => String(a.id_alumno) === String(idAlumno.value)) || null,
);

const analisisTelefono = computed(() => analizarTelefono(destinatario.value?.telefono_tutor));

const destinoTexto = computed(() => {
  if (analisisTelefono.value.estado === "ok") {
    return formatearTelefonoAR(analisisTelefono.value.normalizado);
  }
  return destinatario.value?.telefono_tutor || "Sin teléfono registrado";
});

const puedeEnviar = computed(
  () =>
    !props.enviando &&
    analisisTelefono.value.estado === "ok" &&
    cuerpo.value.trim().length > 0,
);

const confirmar = () => {
  modalConfirmar.value = false;
  emit("enviar", { id_alumno: idAlumno.value, cuerpo: cuerpo.value.trim() });
};

defineExpose({
  limpiarCuerpo: () => {
    cuerpo.value = "";
  },
});
</script>

<style scoped>
.destino-card {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 12px;
}
.destino-card i { font-size: 20px; color: #16a34a; }
.destino-card.destino-alerta { background: #fef2f2; border-color: #fecaca; }
.destino-card.destino-alerta i { color: #dc2626; }
.destino-card > div { display: flex; flex-direction: column; gap: 2px; }
.mono { font-family: monospace; font-size: 12px; }
.plantillas {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  margin-bottom: 12px;
}
.plantillas-label { font-size: 12px; font-weight: 600; color: #6b7280; }
.contador { color: #6b7280; }
.contador-alerta { color: #b45309; font-weight: 700; }
.cuerpo-preview {
  white-space: pre-wrap;
  word-break: break-word;
  background: #f0f2e5;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13.5px;
}
</style>
