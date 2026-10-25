<template>
  <header class="app-topbar">
    <div class="brand-section">
      <button
        v-if="showMenuToggle"
        class="menu-toggle"
        type="button"
        :aria-controls="sidebarId"
        :aria-label="sidebarAbierto ? 'Ocultar secciones' : 'Mostrar secciones'"
        :aria-expanded="sidebarAbierto"
        @click="$emit('toggle-sidebar')"
      >
        <i class="ti ti-menu-2" aria-hidden="true"></i>
      </button>
      <img src="/logoEscuela.png" class="brand-logo" alt="Logo de la escuela" />
      <span class="brand-divider" aria-hidden="true"></span>
      <nav class="breadcrumb" aria-label="Ubicación actual">
        <button class="breadcrumb-root" type="button" @click="$emit('ir-inicio')">TEC-APP</button>
        <template v-if="currentPage && currentPage !== 'Inicio'">
          <i class="ti ti-chevron-right" aria-hidden="true"></i>
          <span class="breadcrumb-current">{{ currentPage }}</span>
        </template>
      </nav>
    </div>

    <div class="user-section" ref="userSection">
      <CampanitaNotificaciones icono="ti ti-bell" />
      <button
        class="avatar-button"
        type="button"
        aria-label="Menú de usuario"
        aria-controls="app-profile-menu"
        :aria-expanded="menuAbierto"
        @click="menuAbierto = !menuAbierto"
      >
        <img v-if="avatarUrl" :src="avatarUrl" alt="" @error="avatarError = true" />
        <span v-if="avatarError || !avatarUrl" class="avatar-fallback">{{ initials }}</span>
      </button>

      <transition name="fade-slide">
        <div v-if="menuAbierto" id="app-profile-menu" class="app-profile-menu" @keydown.esc.stop="cerrarMenu">
          <div class="profile-menu-header">
            <img v-if="!avatarError && avatarUrl" :src="avatarUrl" alt="" />
            <span v-else class="avatar-fallback large">{{ initials }}</span>
            <div><strong>{{ userName }}</strong><small>{{ userDetail }}</small></div>
          </div>
          <div class="profile-role"><span>Perfil institucional</span><strong>{{ userRole }}</strong></div>
          <button type="button" class="menu-item" @click="accionPerfil('ver-perfil')">
            <i class="ti ti-user-circle" aria-hidden="true"></i> Ver perfil
          </button>
          <button type="button" class="menu-item logout" @click="cerrarSesion">
            <i class="ti ti-logout" aria-hidden="true"></i> Cerrar sesión
          </button>
        </div>
      </transition>
    </div>

    <Modal v-model="confirmarLogout" title="Cerrar sesión" variante="danger">
      <p class="logout-copy">¿Seguro que querés cerrar sesión?</p>
      <template #footer>
        <button class="modal-button" @click="confirmarLogout = false">Cancelar</button>
        <button class="modal-button danger" @click="ejecutarLogout">Cerrar sesión</button>
      </template>
    </Modal>
  </header>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../stores/auth.js';
import { etiquetaRol } from '../../utils/roles.js';
import CampanitaNotificaciones from './CampanitaNotificaciones.vue';
import Modal from './Modal.vue';

defineProps({
  currentPage: { type: String, default: 'Inicio' },
  sidebarAbierto: { type: Boolean, default: false },
  sidebarId: { type: String, default: 'app-sidebar' },
  showMenuToggle: { type: Boolean, default: true },
});
const emit = defineEmits(['toggle-sidebar', 'ir-inicio', 'ver-perfil']);
const router = useRouter();
const authStore = useAuthStore();
const menuAbierto = ref(false);
const confirmarLogout = ref(false);
const avatarError = ref(false);
const userSection = ref(null);
const usuario = computed(() => authStore.usuario || {});
const userName = computed(() => `${usuario.value.nombre || ''} ${usuario.value.apellido || ''}`.trim() || usuario.value.nombre_usuario || 'Usuario');
const userDetail = computed(() => usuario.value.email || (usuario.value.dni ? `DNI: ${usuario.value.dni}` : 'Cuenta institucional'));
const userRole = computed(() => etiquetaRol(usuario.value.nombre_rol || authStore.rol || ''));
const initials = computed(() => userName.value.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('') || 'U');
const avatarUrl = computed(() => `https://ui-avatars.com/api/?name=${encodeURIComponent(userName.value)}&background=cd322c&color=fff&bold=true&size=96`);

const accionPerfil = (evento) => {
  menuAbierto.value = false;
  emit(evento);
};
const cerrarMenu = () => { menuAbierto.value = false; };
const cerrarSesion = () => { cerrarMenu(); confirmarLogout.value = true; };
const ejecutarLogout = () => {
  confirmarLogout.value = false;
  authStore.logout();
  router.push('/');
};
const clickAfuera = (event) => {
  if (userSection.value && !userSection.value.contains(event.target)) cerrarMenu();
};
onMounted(() => document.addEventListener('click', clickAfuera));
onUnmounted(() => document.removeEventListener('click', clickAfuera));
</script>

<style scoped>
.app-topbar{height:64px;position:sticky;top:0;z-index:1000;display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:var(--color-background-primary,#fff);border-bottom:1px solid var(--color-border-tertiary,#e5e7eb);box-shadow:0 1px 3px #0000000d}
.brand-section,.user-section{display:flex;align-items:center;gap:12px;min-width:0}.user-section{position:relative;gap:8px}
.menu-toggle,.avatar-button{display:flex;align-items:center;justify-content:center;border:0;background:transparent;color:#374151;cursor:pointer;border-radius:8px}
.menu-toggle{width:40px;height:40px;font-size:22px}.menu-toggle:hover{background:#f3f4f6}.brand-logo{width:36px;height:36px;object-fit:contain;border-radius:6px}.brand-divider{height:24px;width:1px;background:#d1d5db}
.breadcrumb{display:flex;align-items:center;gap:7px;min-width:0;font-size:13px}.breadcrumb-root{padding:0;border:0;background:none;color:#6b7280;font-size:14px;font-weight:700;cursor:pointer}.breadcrumb-root:hover{color:#cd322c}.breadcrumb i,.breadcrumb-current{color:#6b7280}.breadcrumb-current{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.avatar-button{padding:2px;border:2px solid transparent;border-radius:50%}.avatar-button:hover,.avatar-button:focus-visible{border-color:#cd322c}.avatar-button img,.avatar-fallback{width:36px;height:36px;border-radius:50%}.avatar-button img{object-fit:cover}.avatar-fallback{display:grid;place-items:center;background:#cd322c;color:white;font-size:13px;font-weight:700}.avatar-fallback.large{width:42px;height:42px;flex:none}
.app-profile-menu{display:block;position:absolute;right:0;top:calc(100% + 10px);z-index:1100;width:270px;padding:12px;background:var(--color-background-primary,#fff);border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 12px 30px #11182724}.profile-menu-header{display:flex;align-items:center;gap:11px;padding:4px 4px 12px}.profile-menu-header img{width:42px;height:42px;border-radius:50%}.profile-menu-header div{display:grid;gap:3px;min-width:0}.profile-menu-header strong,.profile-menu-header small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.profile-menu-header strong{color:#111827;font-size:14px}.profile-menu-header small{color:#6b7280;font-size:12px}.profile-role{display:flex;justify-content:space-between;gap:8px;padding:10px 4px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px}.profile-role strong{color:#374151}.menu-item{display:flex;align-items:center;gap:9px;width:100%;padding:10px;border:0;border-radius:7px;background:transparent;color:#374151;text-align:left;font:inherit;cursor:pointer}.menu-item:hover{background:#f3f4f6}.menu-item.logout{margin-top:5px;border-top:1px solid #e5e7eb;border-radius:0;color:#b42318}.logout-copy{margin:0}.modal-button{padding:8px 14px;border:1px solid #d1d5db;border-radius:7px;background:white;cursor:pointer}.modal-button.danger{border-color:#b42318;background:#b42318;color:white}
.fade-slide-enter-active,.fade-slide-leave-active{transition:opacity .15s ease,transform .15s ease}.fade-slide-enter-from,.fade-slide-leave-to{opacity:0;transform:translateY(-4px)}
@media(max-width:600px){.app-topbar{padding:0 12px}.brand-section{gap:8px}.brand-logo{width:32px;height:32px}.breadcrumb-current{max-width:110px}.app-profile-menu{right:-4px}}
</style>
