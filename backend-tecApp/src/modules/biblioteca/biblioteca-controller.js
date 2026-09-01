import Biblioteca from "../../db/models/biblioteca-model.js";

async function obtenerTodosBiblioteca() {
  try {
    const biblioteca = await Biblioteca.findAll();
    return biblioteca;
  } catch (error) {
    console.log("Error en obtenerBiblioteca", error);
    return [];
  }
}

async function obtenerBiblioteca(id) {
  try {
    const biblioteca = await Biblioteca.findByPk(id);

    if (!biblioteca) {
      throw new Error("No se encontró la biblioteca especificada");
    }

    return biblioteca;
  } catch (error) {
    console.log("Error en obtenerBiblioteca(id)", error);
    throw error;
  }
}

async function crearBiblioteca(biblioteca) {
  try {
    const data = await Biblioteca.create(biblioteca);
    return data;
  } catch (error) {
    console.log("Error en crearBiblioteca(biblioteca)", error);
    throw error;
  }
}

async function eliminarBiblioteca(id) {
  try {
    const data = await Biblioteca.destroy({
      where: {
        id_biblioteca: id,
      },
    });

    if (data === 0) {
      throw new Error("No se encontró la biblioteca especificada");
    }

    return data;
  } catch (error) {
    throw error;
  }
}

async function modificarBiblioteca(biblioteca) {
  try {
    const { id, nombre, responsable, ubicacion } = biblioteca;
    const data = await Biblioteca.update(
      {
        nombre,
        responsable,
        ubicacion,
      },
      {
        where: {
          id_biblioteca: id,
        },
      }
    );
    if (data[0] === 0) {
      throw new Error("No se encontró la biblioteca o no hubo cambios");
    }

    return data;
  } catch (error) {
    console.log("Error en modificarBiblioteca(biblioteca)", error);
    throw error;
  }
}

export {
  obtenerTodosBiblioteca,
  obtenerBiblioteca,
  crearBiblioteca,
  eliminarBiblioteca,
  modificarBiblioteca,
};
