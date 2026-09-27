<template>
    <div class="perfil-wrapper">
        <!-- ── Encabezado de identidad ─────────────────────────────────── -->
        <div class="perfil-header card">
            <div class="avatar" aria-hidden="true">{{ iniciales }}</div>
            <div class="perfil-identidad">
                <h1>{{ nombreCompleto }}</h1>
                <p class="perfil-email">
                    <i class="ti ti-mail" aria-hidden="true"></i>
                    {{ usuario?.email || "Sin email registrado" }}
                </p>
                <div class="perfil-badges">
                    <span class="perfil-badge">{{ rolLegible }}</span>
                    <span v-if="usuario?.id_usuario" class="perfil-badge badge-neutro">
                        <i class="ti ti-id" aria-hidden="true"></i>
                        ID {{ usuario.id_usuario }}
                    </span>
                </div>
            </div>
        </div>

        <!-- ── Datos personales ─────────────────────────────────────────── -->
        <form class="card perfil-card" @submit.prevent="guardarDatos">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-user-edit" aria-hidden="true"></i>
                    Datos personales
                </div>
                <span v-if="hayCambiosDatos" class="perfil-badge badge-aviso">
                    Cambios sin guardar
                </span>
            </div>

            <div class="card-body">
                <div class="form-grid">
                    <div class="field-group">
                        <label class="field-label" for="perfil-nombre">Nombre</label>
                        <input
                            id="perfil-nombre"
                            v-model="form.nombre"
                            class="field-input"
                            :class="{ 'input-error': errores.nombre }"
                            type="text"
                            autocomplete="given-name"
                            @blur="validarCampoPerfil('nombre')"
                        />
                        <span v-if="errores.nombre" class="field-error">{{ errores.nombre }}</span>
                    </div>

                    <div class="field-group">
                        <label class="field-label" for="perfil-apellido">Apellido</label>
                        <input
                            id="perfil-apellido"
                            v-model="form.apellido"
                            class="field-input"
                            :class="{ 'input-error': errores.apellido }"
                            type="text"
                            autocomplete="family-name"
                            @blur="validarCampoPerfil('apellido')"
                        />
                        <span v-if="errores.apellido" class="field-error">{{ errores.apellido }}</span>
                    </div>

                    <div class="field-group form-grid-full">
                        <label class="field-label" for="perfil-email">Correo electrónico</label>
                        <input
                            id="perfil-email"
                            v-model="form.email"
                            class="field-input"
                            :class="{ 'input-error': errores.email }"
                            type="email"
                            autocomplete="email"
                            @blur="validarCampoPerfil('email')"
                        />
                        <span v-if="errores.email" class="field-error">{{ errores.email }}</span>
                        <span class="field-help">
                            Se usa para iniciar sesión. Si lo cambiás, usá el nuevo
                            email la próxima vez.
                        </span>
                    </div>
                </div>

                <div class="info-box">
                    <i class="ti ti-info-circle" aria-hidden="true"></i>
                    <span>
                        El rol y el ID de la cuenta los gestiona la institución y no
                        se pueden modificar desde acá.
                    </span>
                </div>
            </div>

            <div class="card-footer">
                <button
                    type="button"
                    class="tb-btn outline"
                    :disabled="!hayCambiosDatos || guardandoDatos"
                    @click="descartarDatos"
                >
                    Descartar
                </button>
                <button
                    type="submit"
                    class="tb-btn primary"
                    :disabled="!hayCambiosDatos || guardandoDatos"
                >
                    <i v-if="guardandoDatos" class="ti ti-loader animate-spin" aria-hidden="true"></i>
                    {{ guardandoDatos ? "Guardando..." : "Guardar datos" }}
                </button>
            </div>
        </form>

        <!-- ── Seguridad ────────────────────────────────────────────────── -->
        <form class="card perfil-card" @submit.prevent="guardarContrasena">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-lock" aria-hidden="true"></i>
                    Seguridad
                </div>
            </div>

            <div class="card-body">
                <div class="form-grid">
                    <div class="field-group form-grid-full">
                        <label class="field-label" for="perfil-pass-actual">
                            Contraseña actual
                        </label>
                        <div class="input-pass">
                            <input
                                id="perfil-pass-actual"
                                v-model="form.passActual"
                                class="field-input"
                                :class="{ 'input-error': errores.passActual }"
                                :type="visible.passActual ? 'text' : 'password'"
                                autocomplete="current-password"
                                @blur="validarCampoPass('passActual')"
                            />
                            <button
                                type="button"
                                class="pass-toggle"
                                :aria-label="visible.passActual ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'"
                                @click="visible.passActual = !visible.passActual"
                            >
                                <i
                                    class="ti"
                                    :class="visible.passActual ? 'ti-eye-off' : 'ti-eye'"
                                    aria-hidden="true"
                                ></i>
                            </button>
                        </div>
                        <span v-if="errores.passActual" class="field-error">{{ errores.passActual }}</span>
                    </div>

                    <div class="field-group">
                        <label class="field-label" for="perfil-pass-nueva">
                            Nueva contraseña
                        </label>
                        <div class="input-pass">
                            <input
                                id="perfil-pass-nueva"
                                v-model="form.passNueva"
                                class="field-input"
                                :class="{ 'input-error': errores.passNueva }"
                                :type="visible.passNueva ? 'text' : 'password'"
                                autocomplete="new-password"
                                @blur="validarCampoPass('passNueva')"
                            />
                            <button
                                type="button"
                                class="pass-toggle"
                                :aria-label="visible.passNueva ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'"
                                @click="visible.passNueva = !visible.passNueva"
                            >
                                <i
                                    class="ti"
                                    :class="visible.passNueva ? 'ti-eye-off' : 'ti-eye'"
                                    aria-hidden="true"
                                ></i>
                            </button>
                        </div>
                        <span v-if="errores.passNueva" class="field-error">{{ errores.passNueva }}</span>
                        <span v-else class="field-help">Mínimo 6 caracteres.</span>
                    </div>

                    <div class="field-group">
                        <label class="field-label" for="perfil-pass-confirmar">
                            Confirmar nueva contraseña
                        </label>
                        <div class="input-pass">
                            <input
                                id="perfil-pass-confirmar"
                                v-model="form.passConfirmar"
                                class="field-input"
                                :class="{ 'input-error': errores.passConfirmar }"
                                :type="visible.passConfirmar ? 'text' : 'password'"
                                autocomplete="new-password"
                                @blur="validarCampoPass('passConfirmar')"
                            />
                            <button
                                type="button"
                                class="pass-toggle"
                                :aria-label="visible.passConfirmar ? 'Ocultar confirmación' : 'Mostrar confirmación'"
                                @click="visible.passConfirmar = !visible.passConfirmar"
                            >
                                <i
                                    class="ti"
                                    :class="visible.passConfirmar ? 'ti-eye-off' : 'ti-eye'"
                                    aria-hidden="true"
                                ></i>
                            </button>
                        </div>
                        <span v-if="errores.passConfirmar" class="field-error">{{ errores.passConfirmar }}</span>
                    </div>
                </div>
            </div>

            <div class="card-footer">
                <p class="seguridad-nota">
                    Para cambiarla te pedimos la contraseña actual por seguridad.
                </p>
                <button
                    type="submit"
                    class="tb-btn primary"
                    :disabled="guardandoPass"
                >
                    <i v-if="guardandoPass" class="ti ti-loader animate-spin" aria-hidden="true"></i>
                    {{ guardandoPass ? "Actualizando..." : "Cambiar contraseña" }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, reactive, computed } from "vue";
import { useAuthStore } from "../../../stores/auth.js";
import { modificarUsuario, verificarContrasena } from "../../../services/usuarios-services.js";
import { toast } from "../../../services/toast-service.js";
import { etiquetaRol } from "../../../utils/roles.js";
import { validarEmail, validarRequerido, validarContrasena } from "../../../utils/validators.js";

const authStore = useAuthStore();
const usuario = computed(() => authStore.usuario || {});

const rolLegible = computed(() => etiquetaRol(usuario.value.nombre_rol));

const nombreCompleto = computed(() => {
    const completo = `${usuario.value.nombre || ""} ${usuario.value.apellido || ""}`.trim();
    return completo || "Usuario";
});

const iniciales = computed(() =>
    nombreCompleto.value
        .split(/\s+/)
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase(),
);

// ── Datos personales ────────────────────────────────────────────────────────
const datosBase = () => ({
    nombre: usuario.value.nombre || "",
    apellido: usuario.value.apellido || "",
    email: usuario.value.email || "",
});

const form = reactive({
    ...datosBase(),
    passActual: "",
    passNueva: "",
    passConfirmar: "",
});

const errores = reactive({});
const visible = reactive({
    passActual: false,
    passNueva: false,
    passConfirmar: false,
});

const guardandoDatos = ref(false);
const guardandoPass = ref(false);

const REGLAS_DATOS = {
    nombre: (v) => validarRequerido(v, "El nombre"),
    apellido: (v) => validarRequerido(v, "El apellido"),
    email: validarEmail,
};

function validarCampoPerfil(campo) {
    if (REGLAS_DATOS[campo]) errores[campo] = REGLAS_DATOS[campo](form[campo]);
}

const hayCambiosDatos = computed(() => {
    const base = datosBase();
    return (
        form.nombre !== base.nombre ||
        form.apellido !== base.apellido ||
        form.email !== base.email
    );
});

function descartarDatos() {
    Object.assign(form, datosBase());
    Object.keys(REGLAS_DATOS).forEach((k) => delete errores[k]);
}

async function guardarDatos() {
    if (guardandoDatos.value) return;

    // Validación previa
    Object.keys(REGLAS_DATOS).forEach(validarCampoPerfil);
    if (Object.keys(REGLAS_DATOS).some((campo) => errores[campo])) {
        toast.error("Revisá los campos marcados en rojo.");
        return;
    }
    if (!hayCambiosDatos.value) return;

    guardandoDatos.value = true;
    try {
        await modificarUsuario({
            id_usuario: usuario.value.id_usuario,
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            email: form.email.trim(),
        });

        // Reflejar los cambios en la sesión y en el localStorage
        authStore.updateProfile({
            nombre: form.nombre.trim(),
            apellido: form.apellido.trim(),
            email: form.email.trim(),
        });

        toast.success("Tus datos se actualizaron correctamente.");
    } catch (error) {
        const mensaje =
            error?.response?.data?.mensaje ||
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "No se pudieron guardar tus datos. Intentá de nuevo.";
        toast.error(mensaje);
    } finally {
        guardandoDatos.value = false;
    }
}

// ── Seguridad ───────────────────────────────────────────────────────────────
const REGLAS_PASS = {
    passActual: (v) => validarRequerido(v, "La contraseña actual"),
    passNueva: (v, formData) => {
        const requerido = validarContrasena(v);
        if (requerido) return requerido;
        if (v === formData.passActual) {
            return "La nueva contraseña debe ser distinta a la actual";
        }
        return "";
    },
    passConfirmar: (v, formData) => {
        if (!v) return "Confirmá la nueva contraseña";
        if (v !== formData.passNueva) return "Las contraseñas no coinciden";
        return "";
    },
};

function validarCampoPass(campo) {
    if (REGLAS_PASS[campo]) errores[campo] = REGLAS_PASS[campo](form[campo], form);
}

function limpiarPasswords() {
    form.passActual = "";
    form.passNueva = "";
    form.passConfirmar = "";
    ["passActual", "passNueva", "passConfirmar"].forEach((k) => delete errores[k]);
}

async function guardarContrasena() {
    if (guardandoPass.value) return;

    Object.keys(REGLAS_PASS).forEach(validarCampoPass);
    if (errores.passActual || errores.passNueva || errores.passConfirmar) {
        return;
    }

    guardandoPass.value = true;
    try {
        // 1) Verificar la contraseña actual contra el servidor
        const verificacion = await verificarContrasena(
            usuario.value.email,
            form.passActual,
        );

        if (!verificacion.success) {
            errores.passActual =
                verificacion.message || "La contraseña actual es incorrecta.";
            toast.error(errores.passActual);
            return;
        }

        // 2) Aplicar el cambio (el backend la guarda hasheada)
        await modificarUsuario({
            id_usuario: usuario.value.id_usuario,
            contrasena: form.passNueva,
        });

        limpiarPasswords();
        toast.success("Contraseña actualizada correctamente.");
    } catch (error) {
        const mensaje =
            error?.response?.data?.mensaje ||
            error?.response?.data?.error ||
            error?.response?.data?.message ||
            "No se pudo cambiar la contraseña. Intentá de nuevo.";
        toast.error(mensaje);
    } finally {
        guardandoPass.value = false;
    }
}

// Expuestos para tests
defineExpose({ form, errores, hayCambiosDatos });
</script>

<style scoped>
.perfil-wrapper {
    display: flex;
    flex-direction: column;
    gap: 14px;
    max-width: 860px;
    width: 100%;
}

/* ── Encabezado de identidad ─────────────────────────────────────────── */
.perfil-header {
    display: flex;
    align-items: center;
    gap: 18px;
    padding: 20px;
}

.avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: #cd322c;
    color: #fff;
    font-size: 24px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.perfil-identidad h1 {
    font-size: 19px;
    font-weight: 600;
    color: var(--color-text-primary, #111827);
    margin: 0;
}

.perfil-email {
    font-size: 12.5px;
    color: var(--color-text-tertiary, #6b7280);
    margin: 4px 0 0;
    display: flex;
    align-items: center;
    gap: 5px;
    overflow-wrap: anywhere;
}

.perfil-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
}

.perfil-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: #fbf0f0;
    color: #a52420;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
}

.badge-neutro {
    background: #f3f4f6;
    color: #4b5563;
}

.badge-aviso {
    background: #fef9c3;
    color: #a16207;
}

/* ── Tarjetas de formulario ──────────────────────────────────────────── */
.perfil-card {
    display: flex;
    flex-direction: column;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
}

.form-grid-full {
    grid-column: 1 / -1;
}

.field-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.field-label {
    font-size: 11.5px;
    font-weight: 600;
    color: #4b5563;
}

.field-input {
    padding: 9px 12px;
    border-radius: 6px;
    border: 1px solid #d1d5db;
    font-size: 13px;
    outline: none;
    background: #fff;
    font-family: inherit;
    color: var(--color-text-primary, #111827);
    transition: border-color 0.15s, box-shadow 0.15s;
}

.field-input:focus {
    border-color: var(--color-primary, #cd322c);
    box-shadow: 0 0 0 2px rgba(205, 50, 44, 0.08);
}

.field-help {
    font-size: 11px;
    color: #9ca3af;
}

.input-pass {
    position: relative;
    display: flex;
    align-items: center;
}

.input-pass .field-input {
    width: 100%;
    padding-right: 38px;
}

.pass-toggle {
    position: absolute;
    right: 6px;
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 5px;
    border-radius: 4px;
    display: flex;
    align-items: center;
}

.pass-toggle:hover {
    color: #4b5563;
    background: #f3f4f6;
}

.seguridad-nota {
    font-size: 11.5px;
    color: var(--color-text-tertiary, #6b7280);
    margin: 0 auto 0 0;
    align-self: center;
}

@media (max-width: 640px) {
    .form-grid {
        grid-template-columns: 1fr;
    }

    .perfil-header {
        flex-direction: column;
        align-items: flex-start;
        text-align: left;
    }

    .card-footer {
        flex-direction: column-reverse;
        align-items: stretch;
    }

    .card-footer .tb-btn {
        justify-content: center;
    }

    .seguridad-nota {
        margin: 0 0 4px;
    }
}
</style>
