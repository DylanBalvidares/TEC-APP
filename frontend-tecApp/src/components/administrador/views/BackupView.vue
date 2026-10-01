<template>
    <div class="backup-wrapper">
        <div class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-database-export" aria-hidden="true"></i>
                    Backup y restauración
                </div>
                <button
                    class="tb-btn primary sm"
                    :disabled="cargando"
                    @click="generar"
                >
                    <i :class="cargando ? 'ti ti-loader animate-spin' : 'ti ti-download'" aria-hidden="true"></i>
                    {{ cargando ? "Generando…" : "Generar backup" }}
                </button>
            </div>
            <div class="form-body">
                <p class="muted">
                    El backup incluye roles, permisos, configuración y conteos
                    de alumnos, cursos y usuarios, con checksum SHA-256 de
                    integridad.
                </p>
                <div v-if="error" class="error-banner" role="alert">
                    <i class="ti ti-alert-circle"></i> {{ error }}
                </div>
                <div v-if="resumen" class="backup-resumen" aria-live="polite">
                    <div><strong>Fecha:</strong> {{ resumen.fecha }}</div>
                    <div><strong>Versión:</strong> {{ resumen.version }}</div>
                    <div>
                        <strong>Checksum:</strong>
                        <code class="mono">{{ resumen.checksum }}</code>
                    </div>
                    <div><strong>Tablas:</strong> {{ resumen.tablas.join(", ") }}</div>
                    <div><strong>Filas totales:</strong> {{ resumen.totalFilas }}</div>
                    <button class="tb-btn outline sm" @click="descargar">
                        <i class="ti ti-file-download" aria-hidden="true"></i>
                        Descargar JSON
                    </button>
                </div>
            </div>
        </div>

        <div class="card animate-fade-in">
            <div class="card-header">
                <div class="card-title">
                    <i class="ti ti-shield-check" aria-hidden="true"></i>
                    Verificar backup
                </div>
            </div>
            <div class="form-body">
                <div class="form-row">
                    <div class="form-group">
                        <label for="backup-archivo">Archivo JSON de backup</label>
                        <input
                            id="backup-archivo"
                            type="file"
                            accept="application/json,.json"
                            @change="elegirArchivo"
                        />
                    </div>
                    <div class="form-group form-acciones">
                        <button
                            class="tb-btn primary sm"
                            :disabled="!textoArchivo || verificando"
                            @click="verificar"
                        >
                            <i v-if="verificando" class="ti ti-loader animate-spin" aria-hidden="true"></i>
                            {{ verificando ? "Verificando…" : "Verificar integridad" }}
                        </button>
                    </div>
                </div>
                <p v-if="nombreArchivo" class="archivo-seleccionado">
                    <i class="ti ti-file-check" aria-hidden="true"></i>
                    Archivo seleccionado: <strong>{{ nombreArchivo }}</strong>
                </p>
                <div v-if="veredicto" class="veredicto" :class="veredicto.ok ? 'ok' : 'falla'" :role="veredicto.ok ? 'status' : 'alert'" aria-live="polite">
                    <i :class="veredicto.ok ? 'ti ti-check' : 'ti ti-x'" aria-hidden="true"></i>
                    {{ veredicto.mensaje }}
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { exportarBackup, verificarBackup } from "../../../services/admin-service.js";

const cargando = ref(false);
const verificando = ref(false);
const error = ref("");
const backup = ref(null);
const resumen = ref(null);
const textoArchivo = ref("");
const nombreArchivo = ref("");
const veredicto = ref(null);

async function generar() {
    cargando.value = true;
    error.value = "";
    try {
        const res = await exportarBackup();
        if (!res.success) {
            error.value = res.message;
            return;
        }
        backup.value = res.backup;
        resumen.value = {
            fecha: res.backup.fecha,
            version: res.backup.version,
            checksum: res.backup.checksum,
            tablas: Object.keys(res.backup.tablas || {}),
            totalFilas: Object.values(res.backup.tablas || {}).reduce(
                (acc, filas) => acc + (Array.isArray(filas) ? filas.length : 0),
                0,
            ),
        };
    } catch (e) {
        error.value = e?.message || "No se pudo generar el backup. Intentá de nuevo.";
    } finally {
        cargando.value = false;
    }
}

function descargar() {
    const blob = new Blob([JSON.stringify(backup.value, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `tecapp-backup-${String(resumen.value.fecha).slice(0, 10)}.json`;
    enlace.click();
    URL.revokeObjectURL(url);
}

function elegirArchivo(evento) {
    veredicto.value = null;
    const archivo = evento.target.files?.[0];
    if (!archivo) {
        textoArchivo.value = "";
        nombreArchivo.value = "";
        return;
    }
    nombreArchivo.value = archivo.name;
    const lector = new FileReader();
    lector.onload = () => {
        textoArchivo.value = String(lector.result || "");
    };
    lector.onerror = () => {
        textoArchivo.value = "";
        error.value = "No se pudo leer el archivo seleccionado.";
    };
    lector.readAsText(archivo);
}

async function verificar() {
    verificando.value = true;
    veredicto.value = null;
    try {
        let documento;
        try {
            documento = JSON.parse(textoArchivo.value);
        } catch {
            veredicto.value = { ok: false, mensaje: "El archivo no es un JSON válido." };
            return;
        }
        const res = await verificarBackup(documento);
        veredicto.value = res.success
            ? {
                ok: true,
                mensaje: `Backup íntegro: ${res.totalFilas} filas en ${res.tablas.join(", ")}.`,
            }
            : { ok: false, mensaje: res.message };
    } catch (e) {
        veredicto.value = {
            ok: false,
            mensaje: e?.message || "No se pudo verificar el archivo. Intentá de nuevo.",
        };
    } finally {
        verificando.value = false;
    }
}
</script>

<style scoped>
.backup-wrapper {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
.muted {
    color: var(--color-text-tertiary, #6b7280);
    font-size: 13px;
}
.mono {
    font-family: monospace;
    font-size: 12px;
    word-break: break-all;
}
.backup-resumen {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 12px;
    font-size: 13px;
}
.archivo-seleccionado {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0;
    color: var(--color-text-secondary, #4b5563);
    font-size: 12px;
    overflow-wrap: anywhere;
}
.form-acciones {
    display: flex;
    align-items: flex-end;
}
.veredicto {
    margin-top: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
}
.veredicto.ok {
    background: #eaf3de;
    color: #3b6d11;
}
.veredicto.falla {
    background: #fdecec;
    color: #a52420;
}
</style>
