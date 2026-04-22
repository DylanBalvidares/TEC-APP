import Biblioteca from "../models/biblioteca-model.js";

async function obtenerBiblioteca() {
  try {
    const biblioteca = await Biblioteca.findAll();

    return biblioteca;
  } catch (error) {
    console.log("Error en obtenerBiblioteca",error);
    return "Error en obtenerBiblioteca"
  }
}


