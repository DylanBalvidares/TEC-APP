<template>
  <div class="user-access-panel">
    <div class="panel-header">
      <span class="panel-title">
        <i class="ti ti-user-check" aria-hidden="true"></i>
        Cuenta de acceso
      </span>
      <button
        type="button"
        class="desplegar-btn"
        :aria-expanded="mostrar"
        :aria-controls="uid + '-fields'"
        @click.prevent="toggleMostrar"
      >
        <i :class="mostrar ? 'ti ti-chevron-up' : 'ti ti-chevron-down'" aria-hidden="true"></i>
        {{ etiquetaBoton }}
      </button>
    </div>

    <!-- Estado actual en modo edición (visible con el panel plegado) -->
    <div v-if="modoEditar && !mostrar" class="panel-status animate-fade-in">
      <span v-if="usuarioActual?.id_usuario" class="estado-pill vinculada">
        <i class="ti ti-circle-check" aria-hidden="true"></i>
        Cuenta vinculada: {{ usuarioActual?.email || "—" }}
      </span>
      <span v-else class="estado-pill sin-cuenta">
        <i class="ti ti-circle-x" aria-hidden="true"></i>
        Sin cuenta vinculada
      </span>
    </div>

    <div v-if="mostrar" :id="uid + '-fields'" class="panel-fields animate-fade-in">
      <div class="form-group">
        <label :for="uid + '-email'">Correo electrónico</label>
        <input
          type="email"
          :id="uid + '-email'"
          v-model="email"
          @input="emailTocado = true"
          placeholder="ejemplo@tecnica2.edu.ar"
        />
      </div>

      <div class="form-group">
        <label :for="uid + '-contrasena'">{{ etiquetaContrasena }}</label>
        <div class="password-field">
          <input
            :type="mostrarContrasena ? 'text' : 'password'"
            :id="uid + '-contrasena'"
            v-model="contrasena"
            :placeholder="esEdicionConCuenta
              ? 'Dejar vacío para no cambiar'
              : '••••••••••••••'"
            :autocomplete="esEdicionConCuenta ? 'current-password' : 'new-password'"
          />
          <button
            type="button"
            class="generar-btn"
            @click.prevent.stop="generarContrasena"
            title="Generar contraseña segura"
          >
            <i class="ti ti-refresh" aria-hidden="true"></i> Generar
          </button>
          <button
            type="button"
            class="generar-btn btn-icono"
            :title="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click.prevent.stop="mostrarContrasena = !mostrarContrasena"
          >
            <i :class="mostrarContrasena ? 'ti ti-eye-off' : 'ti ti-eye'" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <div v-if="!ocultarRol" class="form-group">
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

      <!-- Solo formularios de alumno (cuenta opcional): envío de credenciales -->
      <div v-if="cuentaOpcional" class="panel-envio">
        <label class="checkbox-envio">
          <input type="checkbox" v-model="enviarEmail" />
          Enviar credenciales por email
        </label>
        <span v-if="enviarEmail" class="hint-envio">
          Si la contraseña queda vacía, se genera una segura y se envía al correo de la cuenta
        </span>
      </div>

      <p v-if="notaSinCuenta" class="panel-nota">
        Sin contraseña el alumno queda sin cuenta de acceso; podés crearla después editando la ficha.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  // Desplegar el cuerpo del panel al montarlo. En "crear" se muestra abierto
  // para no ocultar la cuenta; en "editar" arranca plegado con píldora de estado.
  abiertoPorDefecto: { type: Boolean, default: false },
  defaultRolId: { type: Number, default: null },
  listaRoles: { type: Array, default: () => [] },
  emailSugerido: { type: String, default: "" },
  // "crear" (seudónimo de alta) | "editar". En editar se precarga la cuenta
  // existente y la contraseña queda opcional (vacío = no cambiar).
  modo: { type: String, default: "crear" },
  // Cuenta actualmente vinculada: { id_usuario, email } o null si no tiene.
  usuarioActual: { type: Object, default: null },
  // Oculta el selector de rol (cuando el rol es implícito, ej. alumno).
  ocultarRol: { type: Boolean, default: false },
  // En los formularios de alumno la cuenta es opcional: se puede guardar sin
  // crearla y, al hacerlo, se puede enviar la contraseña por email.
  cuentaOpcional: { type: Boolean, default: false },
});

const emit = defineEmits(["update:usuarioData"]);

// Id único por instancia para los ids/labels del formulario
const uid = `uap-${Math.random().toString(36).slice(2, 8)}`;

const modoEditar = computed(() => props.modo === "editar");

const esEdicionConCuenta = computed(
  () => modoEditar.value && Boolean(props.usuarioActual?.id_usuario),
);

const mostrar = ref(props.abiertoPorDefecto);

// Email precargado: el de la cuenta vinculada tiene prioridad; si no hay,
// se sugiere el email de la ficha (ej. Gmail del legajo).
const precargarEmail = () =>
  props.usuarioActual?.email || props.emailSugerido || "";

const email = ref(precargarEmail());
const contrasena = ref("");
const idRol = ref(props.defaultRolId || null);
const enviarEmail = ref(false);
const mostrarContrasena = ref(false);
// El email sigue a la sugerencia hasta que el usuario lo edita a mano.
const emailTocado = ref(false);

const etiquetaBoton = computed(() => {
  if (mostrar.value) return "Ocultar";
  return esEdicionConCuenta.value ? "Editar cuenta" : "Crear cuenta";
});

const etiquetaContrasena = computed(() =>
  esEdicionConCuenta.value ? "Nueva contraseña" : "Contraseña",
);

const opcionesRoles = computed(() =>
  (props.listaRoles || []).map((rol) => ({
    id: rol.id ?? rol.id_rol,
    nombre: rol.nombre ?? rol.nombre_rol,
  }))
);

// Nota instructiva: solo aplica donde la cuenta es opcional y aún no existe
// (crear en blanco, o editar un alumno que todavía no tiene cuenta).
const notaSinCuenta = computed(
  () =>
    props.cuentaOpcional &&
    !esEdicionConCuenta.value &&
    !contrasena.value.trim() &&
    !enviarEmail.value,
);

// Watchers
watch(() => props.defaultRolId, (nuevo) => {
  if (!mostrar.value) {
    idRol.value = nuevo || null;
  }
});

// Cambia el alumno editado o su cuenta: re-precarga email y sugerencias.
// La contraseña solo se limpia con el panel plegado para no borrar lo que el
// usuario está escribiendo.
watch(
  () => [props.usuarioActual, props.emailSugerido],
  () => {
    if (!emailTocado.value) {
      email.value = precargarEmail();
    }
    if (!mostrar.value) {
      contrasena.value = "";
    }
  }
);

watch([mostrar, email, contrasena, idRol, enviarEmail], () => {
  if (!mostrar.value) {
    emit("update:usuarioData", null);
  } else {
    emit(
      "update:usuarioData",
      {
        email: email.value.trim(),
        contrasena: contrasena.value.trim() || null,
        id_rol: idRol.value || null,
        enviarCredenciales: enviarEmail.value === true,
      },
      null
    );
  }
});

const toggleMostrar = () => {
  mostrar.value = !mostrar.value;
  if (!mostrar.value) {
    // Resetear campos al cerrar
    email.value = precargarEmail();
    emailTocado.value = false;
    contrasena.value = "";
    idRol.value = props.defaultRolId || null;
    enviarEmail.value = false;
    mostrarContrasena.value = false;
  }
};

const generarContrasena = () => {
  // Sin caracteres ambiguos (0/O, 1/l/I) para que sea legible al revelarla.
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*";
  let pass = "";
  for (let i = 0; i < 12; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  contrasena.value = pass;
  // Se revela automáticamente para que se vea qué se generó.
  mostrarContrasena.value = true;
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

/* ── Estado de la cuenta (modo edición, panel plegado) ────────────────────── */
.panel-status {
  padding: 8px 16px;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
}

.estado-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
}

.estado-pill i {
  font-size: 13px;
}

.estado-pill.vinculada {
  background: #ecfdf3;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.estado-pill.sin-cuenta {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
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

.generar-btn.btn-icono {
  padding: 6px 8px;
}

/* ── Envío de credenciales (cuenta opcional) ──────────────────────────────── */
.panel-envio {
  grid-column: 1 / -1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.checkbox-envio {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.checkbox-envio input {
  width: 15px;
  height: 15px;
  accent-color: #cd322c;
  cursor: pointer;
}

.hint-envio {
  font-size: 11px;
  color: #6b7280;
}

.panel-nota {
  grid-column: 1 / -1;
  margin: 0;
  font-size: 11.5px;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #f3f4f6;
  border-radius: 6px;
  padding: 8px 10px;
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
