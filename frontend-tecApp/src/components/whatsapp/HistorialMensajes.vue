<template>
  <div class="table-responsive">
    <div v-if="mensajes.length === 0" class="empty-state">
      <i class="ti ti-brand-whatsapp" style="font-size: 28px; opacity: 0.4"></i>
      <p>{{ mensajeVacio }}</p>
    </div>
    <table v-else class="mini" aria-label="Historial de mensajes de WhatsApp">
      <thead>
        <tr>
          <th>Fecha</th>
          <th v-if="mostrarRemitente">Remitente</th>
          <th>Destinatario</th>
          <th>Teléfono</th>
          <th>Mensaje</th>
          <th>Estado</th>
          <th>Lectura</th>
          <th class="action-cell">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="m in mensajes"
          :key="m.id_mensaje"
          class="table-row"
          :class="{ 'row-unread': !m.leido }"
        >
          <td class="nowrap">{{ formatoFechaHora(m.fecha_envio) }}</td>
          <td v-if="mostrarRemitente">
            <span class="remitente-cell">
              <span class="mono">#{{ m.id_remitente }}</span>
              <span v-if="rolDe(m.id_remitente)" class="status-pill sp-rol">{{ rolDe(m.id_remitente) }}</span>
            </span>
          </td>
          <td>{{ m.nombre_destinatario || `#${m.id_destinatario}` }}</td>
          <td class="mono">{{ m.telefono_destino }}</td>
          <td class="msg-cell" :title="m.cuerpo">{{ m.cuerpo }}</td>
          <td><EstadoWhatsapp :estado="m.estado" /></td>
          <td>
            <span :class="['status-pill', m.leido ? 'sp-leido' : 'sp-pendiente']">
              {{ m.leido ? "Leído" : "Pendiente" }}
            </span>
          </td>
          <td class="action-cell">
            <div class="action-buttons">
              <button
                class="icon-btn"
                title="Ver detalle"
                aria-label="Ver detalle del mensaje"
                @click="$emit('ver', m)"
              >
                <i class="ti ti-eye"></i>
              </button>
              <button
                v-if="mostrarAcciones"
                class="icon-btn"
                title="Reenviar"
                aria-label="Reenviar mensaje"
                :disabled="estaOcupado(m.id_mensaje, 'reenviar')"
                @click="$emit('reenviar', m)"
              >
                <i
                  class="ti"
                  :class="estaOcupado(m.id_mensaje, 'reenviar') ? 'ti-loader animate-spin' : 'ti-send'"
                ></i>
              </button>
              <button
                v-if="!m.leido"
                class="icon-btn check"
                title="Marcar como leído"
                aria-label="Marcar como leído"
                :disabled="estaOcupado(m.id_mensaje, 'leido')"
                @click="$emit('leido', m)"
              >
                <i
                  class="ti"
                  :class="estaOcupado(m.id_mensaje, 'leido') ? 'ti-loader animate-spin' : 'ti-check'"
                ></i>
              </button>
              <button
                v-if="mostrarAcciones"
                class="icon-btn danger"
                title="Eliminar registro"
                aria-label="Eliminar registro"
                @click="$emit('eliminar', m)"
              >
                <i class="ti ti-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import EstadoWhatsapp from "./EstadoWhatsapp.vue";
import { formatoFechaHora } from "@/composables/useFechaHora.js";

const props = defineProps({
  mensajes: { type: Array, default: () => [] },
  mensajeVacio: { type: String, default: "No hay mensajes todavía." },
  // Admin: muestra columna remitente + acciones de gestión.
  mostrarRemitente: { type: Boolean, default: false },
  mostrarAcciones: { type: Boolean, default: false },
  // Mapa id_usuario -> nombre de rol (para la pill de remitente).
  mapaRoles: { type: Object, default: () => ({}) },
  // Acción en curso: { id, tipo } | null (spinner por fila).
  ocupado: { type: Object, default: null },
});

defineEmits(["ver", "reenviar", "leido", "eliminar"]);

const rolDe = (id) => props.mapaRoles?.[id] || "";
const estaOcupado = (id, tipo) =>
  props.ocupado?.id === id && props.ocupado?.tipo === tipo;
</script>

<style scoped>
.table-responsive { overflow-x: auto; }
.msg-cell {
  max-width: 280px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row-unread { background: #fffdf5; }
.row-unread:hover { background: #fef9ec; }
.row-unread .msg-cell { font-weight: 600; }
.mono {
  font-family: monospace;
  font-size: 12px;
  color: #4b5563;
  white-space: nowrap;
}
.nowrap { white-space: nowrap; }
.remitente-cell { display: inline-flex; align-items: center; gap: 8px; }
.status-pill {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  font-weight: 600;
  display: inline-block;
  white-space: nowrap;
}
.sp-rol { background: #e0f2fe; color: #0369a1; }
.sp-leido { background: #f3f4f6; color: #4b5563; }
.sp-pendiente { background: #fef3c7; color: #92400e; }
.action-cell { text-align: right; vertical-align: middle; }
.action-buttons {
  display: flex;
  flex-direction: row;
  gap: 4px;
  justify-content: flex-end;
  align-items: center;
}
.icon-btn {
  width: 30px;
  height: 30px;
  min-width: 30px;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  color: #4b5563;
  font-size: 15px;
  line-height: 1;
  padding: 0;
}
.icon-btn:hover { background: #f3f4f6; }
.icon-btn.check:hover { background: #eaf3de; border-color: #bbf7d0; color: #3b6d11; }
.icon-btn.danger:hover { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
.icon-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.icon-btn i { pointer-events: none; display: flex; align-items: center; justify-content: center; line-height: 1; }
.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
  font-size: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
</style>
