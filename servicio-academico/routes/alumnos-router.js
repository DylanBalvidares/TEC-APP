import { Router } from "express";
import {
  crearAlumno,
  obtenerAlumno,
  obtenerTodosAlumnos,
  eliminarAlumno,
  modificarAlumno,
} from "../controllers/alumnos-controller.js";

const alumnosRouter = Router();

alumnosRouter.get("/alumnos/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const alumno = await obtenerAlumno(id);

    return res.json(alumno).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(404);
  }
});

alumnosRouter.get("/alumnos", async (req, res) => {
  try {
    const alumnos = await obtenerTodosAlumnos();
    return res.json(alumnos).statusCode(200);
  } catch (error) {
    return res.json(error).statusCode(404);
  }
});

alumnosRouter.post("/alumnos/:alumno", async (req, res) => {
  //const _alumno = JSON.parse(req.body);
  console.log("== ALUMNO REQUEST:", req.body); //DEBUG
  try {
    const alumno = await crearAlumno(req.body);
    return res.json(req.body).statusCode(201);
  } catch (error) {
    return res.json(error).statusCode(400); //400?
  }
});

alumnosRouter.delete("/alumnos/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const resultado = await eliminarAlumno(id);
    return res.json(resultado).status(200);
  } catch (error) {
    return res.json(error).statusCode(400); //400?
  }
});

//========== MODIFICAR RESPONSES Y METODOS

alumnosRouter.patch("/alumnos/:alumno", async (req, res) => {
  const { id, nombre, apellido, dni, curso } = req.body;
  try {
    const alumno = {
      id: id,
      nombre: nombre,
      apellido: apellido,
      dni: dni,
      curso: curso,
    };

    const resultado = await modificarAlumno(alumno);
    return res.json(resultado).statusCode(200); //200->OK,put/patch
  } catch (error) {
    return res.json(error).statusCode(400); //400?
  }
});

// =============
export default alumnosRouter;
