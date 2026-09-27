/**
 * Etiquetas legibles para los roles del sistema.
 * Fuente única de verdad para mostrar el rol en la UI
 * (Topbar, Perfil, etc.).
 */
export const ETIQUETAS_ROL = {
    root: "Administrador",
    administrativo: "Administrativo",
    profesor: "Profesor",
    preceptor: "Preceptor",
    alumno: "Alumno",
    tutor: "Tutor",
    delegado: "Delegado",
    bibliotecario: "Bibliotecario",
};

/**
 * Devuelve la etiqueta legible de un rol.
 * Si no está mapeado, capitaliza el valor crudo.
 * @param {string|null|undefined} nombreRol
 * @returns {string}
 */
export function etiquetaRol(nombreRol) {
    if (!nombreRol) return "Invitado";
    if (ETIQUETAS_ROL[nombreRol]) return ETIQUETAS_ROL[nombreRol];
    return String(nombreRol).charAt(0).toUpperCase() + String(nombreRol).slice(1);
}
