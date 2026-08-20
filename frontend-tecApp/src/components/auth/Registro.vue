<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo-dot">SGE</div>
        <div class="brand-text">
          <h1>Activar cuenta</h1>
          <p>Portal de Gestión Institucional</p>
        </div>
      </div>

      <div v-if="errorMessage" class="error-banner"><i class="ti ti-alert-circle"></i> {{ errorMessage }}</div>

      <div v-if="successMessage" class="success-banner"><i class="ti ti-check"></i> {{ successMessage }}</div>

      <form v-if="step === 1" @submit.prevent="solicitarCodigo" class="auth-form">
        <div class="field-group">
          <label class="field-label">Documento / DNI</label>
          <input v-model="registroData.dni" type="text" class="field-input" placeholder="Ej: 48000000" required />

          <label class="field-label">Fecha de nacimiento</label>
          <input v-model="registroData.fecha_nacimiento" type="text" class="field-input" placeholder="DD/MM/AAAA" required />

          <label class="field-label">Correo electrónico</label>
          <input v-model="registroData.email" type="email" class="field-input" placeholder="Ej: usuario@gmail.com" required />

          <small class="field-help"> Buscaremos tus datos en el padrón y te enviaremos un código de confirmación al correo para activar tu cuenta. </small>
        </div>

        <button type="submit" class="btn-submit" :disabled="isLoading">
          {{ isLoading ? "Buscando..." : "Verificar identidad" }}
        </button>
      </form>

      <form v-else @submit.prevent="verificar" class="auth-form">
        <div class="field-group">
          <label class="field-label">Nombre</label>
          <input v-model="registroData.nombre" type="text" class="field-input" placeholder="Ej: Juan" required />

          <label class="field-label">Apellido</label>
          <input v-model="registroData.apellido" type="text" class="field-input" placeholder="Ej: Pérez" required />

          <label class="field-label">Contraseña</label>
          <input v-model="registroData.contrasena" type="password" class="field-input" placeholder="••••••••" minlength="8" required />

          <label class="field-label">Confirmar contraseña</label>
          <input v-model="confirmarContrasena" type="password" class="field-input" placeholder="••••••••" minlength="8" required />

          <label class="field-label">Código de Verificación</label>
          <input
            v-model="registroData.codigo"
            type="text"
            class="field-input verification-code"
            placeholder="Ej: 123456"
            maxlength="6"
            required
          />
          <small class="field-help">Ingresá el código de 6 dígitos enviado a tu correo.</small>
        </div>

        <button type="submit" class="btn-submit" :disabled="isLoading">
          {{ isLoading ? "Creando usuario..." : "Crear mi usuario" }}
        </button>

        <button type="button" class="btn-link" @click="step = 1">← Volver</button>
      </form>
      <div class="links-container">
        <RouterLink to="/login" class="back-link"> ¿Ya tienes cuenta? Inicia sesión </RouterLink>
        <RouterLink to="/" class="back-link"> ← Volver al inicio </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { registro, verificarCodigo, redireccionarSegunRol } from "../../services/auth-service.js";
import { useRouter } from "vue-router";
import { useAuthStore } from "../../stores/auth.js";
import { parseDisplayDate } from "../../utils/formatters.js";

const router = useRouter();

const step = ref(1);
const isLoading = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const confirmarContrasena = ref("");

const registroData = reactive({
  nombre: "",
  apellido: "",
  fecha_nacimiento: "",
  dni: "",
  email: "",
  codigo: "",
  contrasena: "",
});

const solicitarCodigo = async () => {
  errorMessage.value = "";
  successMessage.value = "";
  isLoading.value = true;    try {
        const payload = { 
            ...registroData, 
            fecha_nacimiento: parseDisplayDate(registroData.fecha_nacimiento) 
        };
        const response = await registro(payload);

    if (!response.success) {
      errorMessage.value = response.message;
      return;
    }

    successMessage.value = response.message;
    step.value = 2;
  } finally {
    isLoading.value = false;
  }
};

const verificar = async () => {
  errorMessage.value = "";
  
  if (registroData.contrasena !== confirmarContrasena.value) {
    errorMessage.value = "Las contraseñas no coinciden.";
    return;
  }

  isLoading.value = true;
  try {
    const response = await verificarCodigo(registroData);

    if (response.success) {
      // 1. Iniciamos sesión automáticamente en Pinia
      const authStore = useAuthStore();
      authStore.login(response.token, response.usuario);

      // 2. Redireccionamos igual que en el login
      redireccionarSegunRol(response.usuario.nombre_rol);
    } else {
      errorMessage.value = response.message;
    }
  } finally {
    isLoading.value = false;
  }
};
</script>

<style src="../../assets/auth.css" scoped></style>
