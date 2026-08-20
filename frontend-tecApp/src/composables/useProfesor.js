import { useAuthStore } from "@/stores/auth.js";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:9000/api";

/**
 * Devuelve el id_profesor del usuario logueado.
 * Intenta: localStorage["alumno"] → petición al backend → null
 */
export async function resolverIdProfesor() {
    const authStore = useAuthStore();

    // 1. Intentar desde localStorage (clave "alumno")
    try {
        const raw = localStorage.getItem("alumno");
        if (raw) {
            const parsed = JSON.parse(raw);
            const id = parsed?.data?.id_profesor || parsed?.id_profesor;
            if (id) {
                console.log("[useProfesor] id_profesor encontrado en localStorage:", id);
                return id;
            }
        }
    } catch (e) {
        console.warn("[useProfesor] Error leyendo localStorage:", e);
    }

    // 2. Fallback: buscar en el backend usando el id_usuario del token
    const idUsuario = authStore.usuario?.id;
    if (!idUsuario) {
        console.warn("[useProfesor] No hay id_usuario en el store.");
        return null;
    }

    try {
        console.log("[useProfesor] Buscando perfil en backend para id_usuario:", idUsuario);
        const response = await axios.get(`${API_URL}/academico/profesores-mi-info/${idUsuario}`, {
            headers: { Authorization: `Bearer ${authStore.token}` },
        });
        // El backend devuelve { data: profesor }
        const profesor = response.data?.data || response.data;
        const id = profesor?.id_profesor;

        // Guardar en localStorage para próximas visitas
        if (id) {
            authStore.guardarInfo(response.data);
            console.log("[useProfesor] id_profesor obtenido del backend y guardado:", id);
        }
        return id || null;
    } catch (error) {
        console.error("[useProfesor] Error al obtener perfil del profesor:", error?.response?.data || error.message);
        return null;
    }
}
