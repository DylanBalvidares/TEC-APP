<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <div class="auth-header">
        <div class="logo-dot">TA</div>
        <div class="brand-text">
          <h1>Iniciar sesión</h1>
          <p>Ingresa a tu cuenta para continuar</p>
        </div>
      </div>

      <div v-if="errorMessage" class="error-banner">
        {{ errorMessage }}
      </div>

      <form @submit.prevent="handleLogin" class="auth-form">
        <div class="field-group">
          <label for="inputEmail" class="field-label">Correo electrónico</label>
          <input id="inputEmail" type="email" class="field-input" v-model="loginData.email" placeholder="usuario@gmail.com" required />
        </div>

        <div class="field-group">
          <label for="inputPassword" class="field-label">Contraseña</label>
          <input id="inputPassword" type="password" class="field-input" v-model="loginData.contrasena" placeholder="••••••••" required />
        </div>

        <button type="submit" class="btn-submit" :disabled="isLoading">
          {{ isLoading ? "Ingresando..." : "Iniciar sesión" }}
        </button>
      </form>

      <div class="links-container">
        <RouterLink to="/registro" class="back-link"> ¿No tienes cuenta? Registrarse </RouterLink>

        <RouterLink to="/" class="back-link"> ← Volver al inicio </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from "vue";
import { login } from "../../services/auth-service";

const isLoading = ref(false);
const errorMessage = ref("");

const loginData = reactive({
  email: "",
  contrasena: "",
});

const handleLogin = async () => {
  errorMessage.value = "";
  isLoading.value = true;

  try {
    const response = await login(loginData);

    if (!response.success) {
      errorMessage.value = response.message;
      return;
    }
  } catch (error) {
    console.error(error);
    errorMessage.value = "No se pudo conectar con el servidor.";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style src="../../assets/auth.css" scoped></style>
