<template>
    <div class="profile-wrapper">
        <div class="profile-card">
            <!-- ENCABEZADO -->
            <div class="profile-header">
                <div class="avatar-large">
                    <img :src="avatarUrl" alt="Avatar" />
                </div>
                <div class="user-info">
                    <h1>{{ authStore.usuario?.nombre || "Usuario" }}</h1>
                    <p class="role-tag">
                        {{ authStore.usuario?.rol || "Estudiante" }}
                    </p>
                </div>
            </div>

            <!-- FORMULARIO DE PERFIL -->
            <form @submit.prevent="guardarCambios" class="profile-form">
                <!-- Grid de campos -->
                <div class="form-grid">
                    <div class="field-group">
                        <label class="field-label">Nombre Completo</label>
                        <input
                            type="text"
                            v-model="form.nombre"
                            class="field-input"
                            disabled
                        />
                    </div>

                    <div class="field-group">
                        <label class="field-label">DNI</label>
                        <input
                            type="text"
                            v-model="form.dni"
                            class="field-input"
                            disabled
                        />
                    </div>

                    <div class="field-group">
                        <label class="field-label">Correo Electrónico</label>
                        <input
                            type="email"
                            v-model="form.email"
                            class="field-input"
                        />
                    </div>

                    <div class="field-group">
                        <label class="field-label">Teléfono</label>
                        <input
                            type="tel"
                            v-model="form.telefono"
                            class="field-input"
                            placeholder="Ej: 2364123456"
                        />
                    </div>
                </div>

                <div class="divider"></div>

                <!-- CAMBIO DE CONTRASEÑA -->
                <h3 class="section-title">Seguridad</h3>
                <div class="field-group">
                    <label class="field-label">Nueva Contraseña</label>
                    <input
                        type="password"
                        v-model="form.password"
                        class="field-input"
                        placeholder="••••••••"
                    />
                    <span class="field-help"
                        >Dejar en blanco para no cambiarla.</span
                    >
                </div>

                <button type="submit" class="btn-submit" :disabled="loading">
                    {{ loading ? "Guardando..." : "Actualizar Perfil" }}
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useAuthStore } from "../../../stores/auth";

const authStore = useAuthStore();
const loading = ref(false);

const form = reactive({
    nombre: authStore.usuario?.nombre || "",
    dni: authStore.usuario?.dni || "",
    email: authStore.usuario?.email || "",
    telefono: authStore.usuario?.telefono || "",
    password: "",
});

const avatarUrl = computed(() => {
    const name = form.nombre.split(" ").join("+");
    return `https://ui-avatars.com/api/?name=${name}&background=cd322c&color=fff&rounded=true&bold=true&size=128`;
});

const guardarCambios = async () => {
    loading.value = true;
    // Aquí iría tu llamada a la API
    setTimeout(() => {
        alert("Cambios guardados correctamente");
        loading.value = false;
    }, 1000);
};
</script>

<style scoped>
.profile-wrapper {
    padding: 40px 20px;
    display: flex;
    justify-content: center;
}

.profile-card {
    width: 100%;
    max-width: 600px;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 32px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.profile-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 32px;
}

.avatar-large img {
    width: 80px;
    height: 80px;
    border-radius: 16px;
}

.user-info h1 {
    font-size: 20px;
    color: #111827;
    margin: 0;
}

.role-tag {
    display: inline-block;
    background: #fef2f2;
    color: #cd322c;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin-top: 4px;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.section-title {
    font-size: 14px;
    color: #111827;
    margin: 24px 0 16px 0;
}

.divider {
    height: 1px;
    background: #e5e7eb;
    margin: 24px 0;
}

/* Reutilización de estilos de Auth */
.field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.field-label {
    font-size: 12px;
    color: #4b5563;
    font-weight: 500;
}
.field-input {
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    font-size: 13px;
    outline: none;
}
.field-input:focus {
    border-color: #cd322c;
    box-shadow: 0 0 0 3px rgba(205, 50, 44, 0.1);
}
.field-help {
    font-size: 11px;
    color: #9ca3af;
}

.btn-submit {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 6px;
    background: #cd322c;
    color: #fff;
    cursor: pointer;
    font-weight: 600;
    margin-top: 24px;
    transition: background 0.2s;
}

.btn-submit:hover {
    background: #b91c1c;
}

@media (max-width: 500px) {
    .form-grid {
        grid-template-columns: 1fr;
    }
}
</style>
