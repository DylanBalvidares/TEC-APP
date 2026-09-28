<template>
    <div class="config-wrapper">
        <div v-if="error" class="error-banner" style="margin-bottom: 12px" role="alert">
            <i class="ti ti-alert-circle"></i> {{ error }}
            <button class="tb-btn sm outline" style="margin-left: auto" @click="cargar">
                Reintentar
            </button>
        </div>
        <div v-if="exito" class="exito-banner" style="margin-bottom: 12px" role="status" aria-live="polite">
            <i class="ti ti-check"></i> {{ exito }}
        </div>

        <div v-if="cargando" class="empty-state" role="status">
            <i class="ti ti-loader animate-spin" style="font-size: 24px; color: #cd322c"></i>
            <p>Cargando configuración...</p>
        </div>

        <template v-else>
            <div class="card animate-fade-in">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-building" aria-hidden="true"></i>
                        Institución
                    </div>
                </div>
                <div class="form-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Nombre <span class="required">*</span></label>
                            <input v-model="form.institucion_nombre" maxlength="200" />
                        </div>
                        <div class="form-group">
                            <label>Email institucional</label>
                            <input v-model="form.institucion_email" type="email" placeholder="escuela@ejemplo.edu.ar" />
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Dirección</label>
                            <input v-model="form.institucion_direccion" maxlength="200" />
                        </div>
                        <div class="form-group">
                            <label>Teléfono</label>
                            <input v-model="form.institucion_telefono" maxlength="200" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="card animate-fade-in">
                <div class="card-header">
                    <div class="card-title">
                        <i class="ti ti-calendar" aria-hidden="true"></i>
                        Ciclo lectivo
                    </div>
                </div>
                <div class="form-body">
                    <div class="form-row triple">
                        <div class="form-group">
                            <label>Año vigente <span class="required">*</span></label>
                            <input v-model="form.ciclo_lectivo_anio" inputmode="numeric" placeholder="2026" />
                        </div>
                        <div class="form-group">
                            <label>Inicio</label>
                            <input v-model="form.ciclo_lectivo_inicio" type="date" />
                        </div>
                        <div class="form-group">
                            <label>Fin</label>
                            <input v-model="form.ciclo_lectivo_fin" type="date" />
                        </div>
                    </div>
                </div>
            </div>

            <div class="search-bar-wrapper">
                <button class="tb-btn primary" :disabled="guardando" @click="guardar">
                    <i class="ti ti-loader animate-spin" v-if="guardando"></i>
                    {{ guardando ? "Guardando..." : "Guardar cambios" }}
                </button>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { obtenerConfiguracion, guardarConfiguracion } from "../../../services/admin-service.js";

const CLAVES = [
    "institucion_nombre",
    "institucion_direccion",
    "institucion_telefono",
    "institucion_email",
    "ciclo_lectivo_anio",
    "ciclo_lectivo_inicio",
    "ciclo_lectivo_fin",
];

const form = reactive(Object.fromEntries(CLAVES.map((c) => [c, ""])));
const cargando = ref(false);
const guardando = ref(false);
const error = ref("");
const exito = ref("");

async function cargar() {
    cargando.value = true;
    error.value = "";
    try {
        const res = await obtenerConfiguracion();
        if (!res.success) throw new Error(res.message);
        for (const c of CLAVES) form[c] = res.data[c] ?? "";
    } catch (e) {
        error.value = e?.message || "No se pudo cargar la configuración.";
    } finally {
        cargando.value = false;
    }
}

async function guardar() {
    guardando.value = true;
    error.value = "";
    exito.value = "";
    try {
        const res = await guardarConfiguracion({ ...form });
        if (!res.success) throw new Error(res.message);
        exito.value = "Configuración guardada correctamente.";
    } catch (e) {
        error.value = e?.message || "No se pudo guardar la configuración.";
    } finally {
        guardando.value = false;
    }
}

onMounted(cargar);
</script>
