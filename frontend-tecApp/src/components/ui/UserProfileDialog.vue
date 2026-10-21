<template>
  <Modal v-model="abierto" :title="editando ? 'Editar perfil' : 'Ver perfil'" wide>
    <div class="profile-content">
      <div class="profile-avatar">{{ initials }}</div>
      <div class="profile-fields">
        <label>Nombre
          <input v-if="editando" v-model="draft.nombre" autocomplete="name" />
          <span v-else>{{ user.nombre || user.nombre_usuario || 'Sin informar' }}</span>
        </label>
        <label>Apellido
          <input v-if="editando" v-model="draft.apellido" autocomplete="family-name" />
          <span v-else>{{ user.apellido || 'Sin informar' }}</span>
        </label>
        <label>Correo electrónico
          <input v-if="editando" v-model="draft.email" type="email" autocomplete="email" />
          <span v-else>{{ user.email || 'Sin informar' }}</span>
        </label>
        <label>Rol
          <span>{{ userRole }}</span>
        </label>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <p v-if="guardado" class="success" role="status">Cambios guardados.</p>
      </div>
    </div>
    <template #footer>
      <template v-if="!editando">
        <button class="secondary" @click="cerrar">Cerrar</button>
        <button class="primary" @click="iniciarEdicion">Editar perfil</button>
      </template>
      <template v-else>
        <button class="secondary" @click="cancelar">Cancelar</button>
        <button class="primary" :disabled="guardando" @click="guardar">
          {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
        </button>
      </template>
    </template>
  </Modal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useAuthStore } from '../../stores/auth.js';
import Modal from './Modal.vue';
import { modificarUsuario } from '../../services/usuarios-services.js';
import { etiquetaRol } from '../../utils/roles.js';

const props = defineProps({ modelValue: Boolean, edit: Boolean });
const emit = defineEmits(['update:modelValue']);
const auth = useAuthStore();
const user = computed(() => auth.usuario || {});
const userRole = computed(() => etiquetaRol(user.value.nombre_rol || auth.rol || '') || 'Sin informar');
const editando = ref(false);
const draft = reactive({ nombre: '', apellido: '', email: '' });
const error = ref('');
const guardado = ref(false);
const guardando = ref(false);
const abierto = computed({ get: () => props.modelValue, set: value => emit('update:modelValue', value) });
const initials = computed(() => `${user.value.nombre || ''} ${user.value.apellido || ''}`.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'U');

const iniciarEdicion = () => {
  draft.nombre = user.value.nombre || user.value.nombre_usuario || '';
  draft.apellido = user.value.apellido || '';
  draft.email = user.value.email || '';
  error.value = '';
  guardado.value = false;
  editando.value = true;
};
const cerrar = () => { editando.value = false; error.value = ''; abierto.value = false; };
const cancelar = () => { editando.value = false; error.value = ''; };
const guardar = async () => {
  if (!draft.nombre.trim() || !draft.email.trim()) { error.value = 'Completá nombre y correo electrónico.'; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.email.trim())) { error.value = 'Ingresá un correo electrónico válido.'; return; }
  if (guardando.value) return;
  guardando.value = true;
  error.value = '';
  const cambios = { nombre: draft.nombre.trim(), apellido: draft.apellido.trim(), email: draft.email.trim() };
  try {
    if (user.value.id_usuario) await modificarUsuario({ id_usuario: user.value.id_usuario, ...cambios });
    auth.updateProfile(cambios);
    editando.value = false;
    guardado.value = true;
  } catch (err) {
    error.value = err?.response?.data?.mensaje || err?.response?.data?.error || err?.response?.data?.message || 'No se pudieron guardar los cambios. Intentá de nuevo.';
  } finally {
    guardando.value = false;
  }
};
watch(() => props.modelValue, (open) => {
  if (!open) {
    editando.value = false;
    error.value = '';
    guardado.value = false;
  } else {
    editando.value = props.edit;
    if (props.edit) iniciarEdicion();
  }
});
</script>

<style scoped>
.profile-content{display:grid;grid-template-columns:72px 1fr;gap:20px;padding:8px 0}.profile-avatar{width:64px;height:64px;display:grid;place-items:center;border-radius:50%;background:#cd322c;color:white;font-size:20px;font-weight:700}.profile-fields{display:grid;gap:14px}.profile-fields label{display:grid;gap:6px;color:#6b7280;font-size:13px}.profile-fields span{color:#111827;font-size:15px}.profile-fields input{padding:10px 12px;border:1px solid #d1d5db;border-radius:7px;font:inherit;color:#111827}.error{margin:0;color:#b42318}.success{margin:0;color:#15803d}.secondary,.primary{padding:8px 14px;border:1px solid #d1d5db;border-radius:7px;background:white;cursor:pointer}.primary{border-color:#cd322c;background:#cd322c;color:white}@media(max-width:500px){.profile-content{grid-template-columns:1fr}.profile-avatar{width:52px;height:52px}}
</style>
