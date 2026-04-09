<<<<<<< HEAD
import Asistencia from "../models/asistencias-model.js";

// Obtener todos
async function obtenerTodosAsistencias() {
    try {
        const asistencias = await Asistencia.findAll();

        if (asistencias.length === 0) {
            throw new Error("No se encontraron asistencias");
        }

        return asistencias;
    } catch (error) {
        console.error("Error en obtenerTodosAsistencias", error);
        return "Error en obtenerTodosAsistencias";
    }
}

// Obtener uno por ID
async function obtenerAsistencia(id) {
    try {
        const asistencia = await Asistencia.findByPk(id);

        if (!asistencia) {
            throw new Error("Asistencia no encontrada");
        }

        return asistencia;
    } catch (error) {
        console.error("Error en obtenerAsistencia(id):", error);
        return "Error en obtenerAsistencia(id)";
    }
}

// Crear asistencia
async function crearAsistencia(asistencia) {
    try {
        const data = await Asistencia.create(asistencia);

        if (!data) {
            throw new Error("Error en crearAsistencia");
        }

        return data;
    } catch (error) {
        console.error("Error en crearAsistencia:", error);
        return "Error en crearAsistencia";
    }
}

// Eliminar asistencia
async function eliminarAsistencia(id) {
    try {
        const data = await Asistencia.destroy({
            where: {
                id_asistencia: id,
            },
        });

        if (data === 0) {
            throw new Error("Asistencia no encontrada");
        }

        return data;
    } catch (error) {
        console.error("Error en eliminarAsistencia:", error);
        return "Error en eliminarAsistencia";
    }
}

// Modificar todo el profesor
async function modificarAsistencia(asistencia) {
    const { id_asistencia, fecha, estado, id_alumno } = asistencia;
    try {
        const data = await Asistencia.update(
            {
                fecha: fecha,
                estado: estado,
                id_alumno: id_alumno,
            },
            {
                where: {
                    id_asistencia: id_asistencia,
                },
            }
        );

        if (data[0] === 0) {
            throw new Error("No se actualizó la asistencia");
        }

        return data;
    } catch (error) {
        console.error("Error en modificarAsistencia:", error);
        return "Error en modificarAsistencia(asistencia)";
    }
}

export {
    obtenerTodosAsistencias,
    obtenerAsistencia,
    crearAsistencia,
    eliminarAsistencia,
    modificarAsistencia,
};

=======
import Asistencia from "../models/asistencias-model.js";

// Obtener todos
async function obtenerTodosAsistencias() {
    try {
        const asistencias = await Asistencia.findAll();

        if (asistencias.length === 0) {
            throw new Error("No se encontraron asistencias");
        }

        return asistencias;
    } catch (error) {
        console.error("Error en obtenerTodosAsistencias", error);
        return "Error en obtenerTodosAsistencias";
    }
}

// Obtener uno por ID
async function obtenerAsistencia(id) {
    try {
        const asistencia = await Asistencia.findByPk(id);

        if (!asistencia) {
            throw new Error("Asistencia no encontrada");
        }

        return asistencia;
    } catch (error) {
        console.error("Error en obtenerAsistencia(id):", error);
        return "Error en obtenerAsistencia(id)";
    }
}

// Crear asistencia
async function crearAsistencia(asistencia) {
    try {
        const data = await Asistencia.create(asistencia);

        if (!data) {
            throw new Error("Error en crearAsistencia");
        }

        return data;
    } catch (error) {
        console.error("Error en crearAsistencia:", error);
        return "Error en crearAsistencia";
    }
}

// Eliminar asistencia
async function eliminarAsistencia(id) {
    try {
        const data = await Asistencia.destroy({
            where: {
                id_asistencia: id,
            },
        });

        if (data === 0) {
            throw new Error("Asistencia no encontrada");
        }

        return data;
    } catch (error) {
        console.error("Error en eliminarAsistencia:", error);
        return "Error en eliminarAsistencia";
    }
}

// Modificar todo el profesor
async function modificarAsistencia(asistencia) {
    const { id_asistencia, fecha, estado, id_alumno } = asistencia;
    try {
        const data = await Asistencia.update(
            {
                fecha: fecha,
                estado: estado,
                id_alumno: id_alumno,
            },
            {
                where: {
                    id_asistencia: id_asistencia,
                },
            }
        );

        if (data[0] === 0) {
            throw new Error("No se actualizó la asistencia");
        }

        return data;
    } catch (error) {
        console.error("Error en modificarAsistencia:", error);
        return "Error en modificarAsistencia(asistencia)";
    }
}

export {
    obtenerTodosAsistencias,
    obtenerAsistencia,
    crearAsistencia,
    eliminarAsistencia,
    modificarAsistencia,
};

>>>>>>> edbad23 (asistencias & cursos fixes)
