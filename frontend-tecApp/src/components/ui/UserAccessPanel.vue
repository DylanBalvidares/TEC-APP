<template>
  <div class="user-access-panel">
    <div class="panel-header">
      <span class="panel-title">
        <i class="ti ti-user-check" aria-hidden="true"></i>
        Acceso al sistema
      </span>
      <button
        type="button"
        class="desplegar-btn"
        :aria-expanded="mostrar"
        :aria-controls="uid + '-fields'"
        @click="toggleMostrar"
      >
        <i :class="mostrar ? 'ti ti-chevron-up' : 'ti ti-chevron-down'" aria-hidden="true"></i>
        {{ mostrar ? "Ocultar" : "Crear cuenta" }}
      </button>
    </div>

    <div v-if="mostrar" :id="uid + '-fields'" class="panel-fields animate-fade-in">
      <div class="form-group">
        <label :for="uid + '-email'">Correo electrónico</label>
        <input
          type="email"
          :id="uid + '-email'"
          v-model="email"
          placeholder="ejemplo@tecnica2.edu.ar"
        />
      </div>

      <div class="form-group">
        <label :for="uid + '-contrasena'">Contraseña</label>
        <div class="password-field">
          <input
            type="password"
            :id="uid + '-contrasena'"
            v-model="contrasena"
            placeholder="••••••••••••••"
            autocomplete="new-password"
          />
          <button
            type="button"
            class="generar-btn"
            @click="generarContrasena"
            title="Generar contraseña segura"
          >
            <i class="ti ti-refresh" aria-hidden="true"></i> Generar
          </button>
        </div>
      </div>

      <div class="form-group">
        <label :for="uid + '-rol'">Rol</label>
        <select :id="uid + '-rol'" v-model="idRol">
          <option
            v-for="rol in opcionesRoles"
            :key="rol.id"
            :value="rol.id"
          >
            {{ rol.nombre }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  defaultRolId: { type: Number, default: null },
  listaRoles: { type: Array, default: () => [] },
  emailSugerido: { type: String, default: "" },
});

const emit = defineEmits(["update:usuarioData"]);

// Id único por instancia para los ids/labels del formulario
const uid = `uap-${Math.random().toString(36).slice(2, 8)}`;

const mostrar = ref(false);
const email = ref(props.emailSugerido || "");
const contrasena = ref("");
const idRol = ref(props.defaultRolId || null);

const opcionesRoles = computed(() =>
  (props.listaRoles || []).map((rol) => ({
    id: rol.id ?? rol.id_rol,
    nombre: rol.nombre ?? rol.nombre_rol,
  }))
);

// Watchers
watch(() => props.defaultRolId, (nuevo) => {
  if (!mostrar.value) {
    idRol.value = nuevo || null;
  }
});

watch(
  () => props.emailSugerido,
  (nuevo) => {
    if (!mostrar.value && email.value === "") {
      email.value = nuevo || "";
    }
  }
);

watch([mostrar, email, contrasena, idRol], () => {
  if (!mostrar.value) {
    emit("update:usuarioData", null);
  } else {
    emit(
      "update:usuarioData",
      {
        email: email.value.trim(),
        contrasena: contrasena.value.trim() || null,
        id_rol: idRol.value || null,
      },
      null
    );
  }
});

const toggleMostrar = () => {
  mostrar.value = !mostrar.value;
  if (!mostrar.value) {
    // Resetear campos al cerrar
    email.value = props.emailSugerido || "";
    contrasena.value = "";
    idRol.value = props.defaultRolId || null;
  }
};

const generarContrasena = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  contrasena.value = pass;
};
</script>

<style scoped>
.user-access-panel {
  border: 0.5px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  font-family: inherit;
}

/* ── Cabecera ─────────────────────────────────────────────────────────────── */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e5e7eb;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  font-weight: 600;
  color: #111827;
}

.panel-title i {
  font-size: 16px;
  color: #cd322c;
}

/* ── Botón de despliegue ─────────────────────────────────────────────────────── */
.desplegar-btn {
  padding: 5px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #4b5563;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.12s;
  white-space: nowrap;
}

.desplegar-btn:hover {
  background: #f9fafb;
  color: #111827;
}

.desplegar-btn i {
  font-size: 14px;
  transition: transform 0.15s;
}

.desplegar-btn:focus-visible {
  outline: none;
  border-color: #cd322c;
  box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.15);
}

/* ── Campos ───────────────────────────────────────────────────────────────── */
.panel-fields {
  padding: 14px 16px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.form-group label {
  font-size: 11.5px;
  font-weight: 600;
  color: #4b5563;
}

.form-group input,
.form-group select {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12.5px;
  outline: none;
  background: #fff;
  color: #111827;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #cd322c;
  box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.08);
}

.form-group input::placeholder {
  color: #9ca3af;
}

.password-field {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.password-field input {
  flex: 1;
}

.generar-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #4b5563;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.12s;
  white-space: nowrap;
}

.generar-btn:hover {
  background: #f9fafb;
  color: #111827;
}

.generar-btn i {
  font-size: 14px;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 700px) {
  .panel-fields {
    grid-template-columns: 1fr;
  }

  .panel-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>