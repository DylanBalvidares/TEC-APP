import Profesor from "../models/profesores-model.js";

// Obtener todos
async function obtenerTodosProfesores() {
    try {
        const profesores = await Profesor.findAll();

        if (profesores.length === 0) {
            throw new Error("No se encontraron profesores");
        }

        return profesores;
    } catch (error) {
        console.error("Error en obtenerTodosProfesores", error);
        return "Error en obtenerTodosProfesores";
    }
}

// Obtener uno por ID
async function obtenerProfesor(id) {
    try {
        const profesor = await Profesor.findByPk(id);

        if (!profesor) {
            throw new Error("Profesor no encontrado");
        }

        return profesor;
    } catch (error) {
        console.error("Error en obtenerProfesor(id):", error);
        return "Error en obtenerProfesor(id)";
    }
}

// Crear profesor
async function crearProfesor(profesor) {
    try {
        const data = await Profesor.create(profesor);

        if (!data) {
            throw new Error("Error en crearProfesor");
        }

        return data;
    } catch (error) {
        console.error("Error en crearProfesor:", error);
        return "Error en crearProfesor";
    }
}

// Eliminar profesor
async function eliminarProfesor(id) {
    try {
        const data = await Profesor.destroy({
            where: {
                id_profesor: id,
            },
        });

        if (data === 0) {
            throw new Error("Profesor no encontrado");
        }

        return data;
    } catch (error) {
        console.error("Error en eliminarProfesor:", error);
        return "Error en eliminarProfesor";
    }
}

// Modificar nombre
async function modificarNombre(id, nombre) {
    try {
        const data = await Profesor.update(
            { nombre: nombre },
            {
                where: {
                    id_profesor: id,
                },
            }
        );

        if (data[0] === 0) {
            throw new Error("No se actualizó el nombre");
        }

        return data;
    } catch (error) {
        console.error("Error en modificarNombre:", error);
        return "Error en modificarNombre";
    }
}

// Modificar apellido
async function modificarApellido(id, apellido) {
    try {
        const data = await Profesor.update(
            { apellido: apellido },
            {
                where: {
                    id_profesor: id,
                },
            }
        );

        if (data[0] === 0) {
            throw new Error("No se actualizó el apellido");
        }

        return data;
    } catch (error) {
        console.error("Error en modificarApellido:", error);
        return "Error en modificarApellido";
    }
}

// Modificar materia
async function modificarMateria(id, materia) {
    try {
        const data = await Profesor.update(
            { materia: materia },
            {
                where: {
                    id_profesor: id,
                },
            }
        );

        if (data[0] === 0) {
            throw new Error("No se actualizó la materia");
        }

        return data;
    } catch (error) {
        console.error("Error en modificarMateria:", error);
        return "Error en modificarMateria";
    }
}

// Modificar email
async function modificarEmail(id, email) {
    try {
        const data = await Profesor.update(
            { email: email },
            {
                where: {
                    id_profesor: id,
                },
            }
        );

        if (data[0] === 0) {
            throw new Error("No se actualizó el email");
        }

        return data;
    } catch (error) {
        console.error("Error en modificarEmail:", error);
        return "Error en modificarEmail";
    }
}

// Modificar todo el profesor
async function modificarProfesor(profesor) {
    try {
        const data = await Profesor.update(
            {
                nombre: profesor.nombre,
                apellido: profesor.apellido,
                materia: profesor.materia,
                email: profesor.email,
            },
            {
                where: {
                    id_profesor: profesor.id_profesor,
                },
            }
        );

        if (data[0] === 0) {
            throw new Error("No se actualizó el profesor");
        }

        return data;
    } catch (error) {
        console.error("Error en modificarProfesor:", error);
        return "Error en modificarProfesor";
    }
}

export {
    obtenerTodosProfesores,
    obtenerProfesor,
    crearProfesor,
    eliminarProfesor,
    modificarNombre,
    modificarApellido,
    modificarMateria,
    modificarEmail,
    modificarProfesor,
};