import Prestamo from "../../db/models/prestamos-model.js";
import Recurso from "../../db/models/recursos-model.js";

async function obtenerTodosPrestamos() {
  try {
    const prestamos = await Prestamo.findAll({
      include: [{ model: Recurso }],
    });

    return prestamos;
  } catch (error) {
    console.log("Error en obtenerPrestamos", error);
    return [];
  }
}

async function obtenerPrestamo(id) {
  try {
    const prestamo = await Prestamo.findByPk(id);

    if (!prestamo) {
      throw new Error("No se encontró el préstamo especificado");
    }

    return prestamo;
  } catch (error) {
    console.log("Error en obtenerPrestamo(id)", error);
    throw error;
  }
}

async function crearPrestamo(prestamo) {
  try {
    const data = await Prestamo.create(prestamo);

    return data;
  } catch (error) {
    console.log("Error en crearPrestamo(prestamo)", error);
    throw error;
  }
}

async function eliminarPrestamo(id) {
  try {
    const data = await Prestamo.destroy({
      where: {
        id_prestamo: id,
      },
    });

    if (data === 0) {
      throw new Error("No se encontró el préstamo especificado");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function modificarPrestamo(prestamo) {
  try {
    const { id_prestamo, id_recurso, id_usuario, fecha_prestamo, fecha_devolucion, estado } = prestamo;
    const data = await Prestamo.update(
      {
        id_recurso,
        id_usuario,
        fecha_prestamo,
        fecha_devolucion,
        estado,
      },
      {
        where: {
          id_prestamo: id_prestamo,
        },
      }
    );
    if (data[0] === 0) {
      throw new Error("No se encontró el préstamo o no hubo cambios");
    }

    return data;
  } catch (error) {
    console.log("Error en modificarPrestamo(prestamo)", error);
    throw error;
  }
}

export {
  obtenerTodosPrestamos,
  obtenerPrestamo,
  crearPrestamo,
  eliminarPrestamo,
  modificarPrestamo,
};
