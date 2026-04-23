import Prestamo from "../models/prestamos-model.js";

async function obtenerTodosPrestamos() {
  try {
    const prestamos = await Recurso.findAll();

    return prestamos;
  } catch (error) {
    console.log("Error en obtenerPrestamos", error);
    return ("Error en obtenerPrestamos", error);
  }
}

async function obtenerPrestamo(id) {
  try {
    const prestamo = Prestamo.findByPk(id);

    if (!prestamo) {
      throw new Error("Error en obtenerPrestamo(id)");
    }

    return prestamo;
  } catch (error) {
    console.log("Error en obtenerPrestamo(id)", error);
    return "Error en obtenerPrestamo(id)";
  }
}

async function crearPrestamo(prestamo) {
  try {
    const data = Prestamo.create(prestamo);

    return data;
  } catch (error) {
    console.log("Error en crearPrestamo(prestamo)", error);
    return ("Error en crearPrestamo(prestamo)", error);
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
      throw new Error("Error en eliminarPrestamo(id)");
    }

    return data;
  } catch (error) {
    return ("Error en eliminarPrestamo(id)", error);
  }
}

async function modificarPrestamo(prestamo) {
  try {
    const { id_prestamo, id_recurso, id_usuario, fecha, fecha_devolucion, estado } = prestamo;
    const data = await Prestamo.update(
      {
        id_prestamo: id_prestamo,
        id_recurso: id_recurso,
        id_usuario: id_usuario,
        fecha: fecha,
        fecha_devolucion: fecha_devolucion,
        estado: estado
      },
      {
        where: {
          id_prestamo: id_prestamo,
        },
      },
    );
    if (!data) {
      throw new Error("Error en modificarPrestamo(prestamo)");
    }

    return data;
  } catch (error) {
    console.log("Error en modificarPrestamo(prestamo)", error);
    return "Error en modificarPrestamo(prestamo)";
  }
}

export {
  obtenerTodosPrestamos,
  obtenerPrestamo,
  crearPrestamo,
  eliminarPrestamo,
  modificarPrestamo
};
