<template>
    <Teleport to="body">
        <div class="toast-region" aria-live="polite" aria-label="Notificaciones">
            <TransitionGroup name="toast">
                <div
                    v-for="t in toasts"
                    :key="t.id"
                    class="toast-item"
                    :class="'toast-' + t.tipo"
                    role="status"
                >
                    <i class="ti" :class="icono(t.tipo)" aria-hidden="true"></i>
                    <span class="toast-msg">{{ t.mensaje }}</span>
                    <button
                        class="toast-close"
                        aria-label="Cerrar notificación"
                        @click="toast.cerrar(t.id)"
                    >
                        <i class="ti ti-x" aria-hidden="true"></i>
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<script setup>
import { toast, usarToasts } from "../../services/toast-service.js";

const toasts = usarToasts().toasts;

const icono = (tipo) =>
    ({
        success: "ti-circle-check",
        error: "ti-alert-circle",
        info: "ti-info-circle",
    })[tipo] || "ti-info-circle";
</script>

<style scoped>
.toast-region {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 3000;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    max-width: min(360px, calc(100vw - 32px));
}

.toast-item {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 10px;
    background: #ffffff;
    color: #1e2430;
    border: 1px solid #e5e7eb;
    border-left-width: 4px;
    border-radius: 8px;
    padding: 10px 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    font-size: 13px;
}

.toast-item i:first-child {
    font-size: 17px;
    flex-shrink: 0;
}

.toast-success {
    border-left-color: #38a169;
}
.toast-success > i:first-child {
    color: #38a169;
}

.toast-error {
    border-left-color: #cd322c;
}
.toast-error > i:first-child {
    color: #cd322c;
}

.toast-info {
    border-left-color: #4f7cff;
}
.toast-info > i:first-child {
    color: #4f7cff;
}

.toast-msg {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
}

.toast-close {
    background: none;
    border: none;
    cursor: pointer;
    color: #9ca3af;
    padding: 2px;
    display: flex;
    align-items: center;
    border-radius: 4px;
}
.toast-close:hover {
    color: #4b5563;
    background: #f3f4f6;
}

/* Animación de entrada/salida */
.toast-enter-active,
.toast-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}
.toast-enter-from {
    opacity: 0;
    transform: translateX(16px);
}
.toast-leave-to {
    opacity: 0;
    transform: translateX(16px);
}
</style>
