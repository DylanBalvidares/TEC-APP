import Biblioteca from "../models/biblioteca-model.js";

async function obtenerTodosBiblioteca() {
  try {
    const biblioteca = await Biblioteca.findAll();

    return biblioteca;
  } catch (error) {
    console.log("Error en obtenerBiblioteca", error);
    return "Error en obtenerBiblioteca";
  }
}

async function obtenerBiblioteca(id) {
  try {
    const biblioteca = await Biblioteca.findByPk(id);

    if (!biblioteca) {
      throw new Error("Error en obtenerRecurso(id)");
    }
  } catch (error) {
    console.log("Error en obtenerBiblioteca(id)", error);
    return ("Error en obtenerBiblioteca(id)", error);
  }
}

async function crearBiblioteca(biblioteca) {
  try {
    const data = Biblioteca.create(biblioteca);

    return data;
  } catch (error) {
    console.log("Error en crearBiblioteca(biblioteca)", error);
    return ("Error en crearBiblioteca(biblioteca)", error);
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
      throw new Error("Error en eliminarBiblioteca(id)");
    }

    return data;
  } catch (error) {
    return ("Error en eliminarBiblioteca(id)", error);
  }
}

async function modificarBiblioteca(biblioteca) {
  try {
    const { id, nombre, responsable, ubicacion } = biblioteca;
    const data = await Biblioteca.update(
      {
        nombre: nombre,
        responsable: responsable,
        ubicacion: ubicacion,
      },
      {
        where: {
          id_biblioteca: biblioteca,
        },
      },
    );
    if (!data) {
      throw new Error("Error en modificarBiblioteca(biblioteca)");
    }

    return data;
  } catch (error) {
    console.log("Error en modificarBiblioteca(biblioteca)", error);
    return "Error en modificarBiblioteca(biblioteca)";
  }
}

export {
  obtenerTodosBiblioteca,
  obtenerBiblioteca,
  crearBiblioteca,
  eliminarBiblioteca,
  modificarBiblioteca,
};
